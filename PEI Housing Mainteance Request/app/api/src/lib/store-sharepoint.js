'use strict';
/*
 * The production store: a SharePoint site in Sterling's Microsoft 365, reached through
 * Microsoft Graph with an app registration (client credentials).
 *
 *   Properties list        — the property and contact list. The form reads Code, Title,
 *                            City, State, Active and AfterHoursPhone. Nothing else is read here.
 *   Requests list          — the queue Tonya and Jordan work. One item per request.
 *   Request Photos library — one folder per request, named by the request's client ID.
 *
 * Permissions: give the app registration the Graph application permission
 * Sites.Selected, then grant it "write" on this one site only (see app/README.md).
 * It then cannot read or write anything else in the tenant.
 *
 * No SDK: Node's built-in fetch keeps the deploy free of dependencies.
 */
const { requestNumber } = require('./schema');

const GRAPH = 'https://graph.microsoft.com/v1.0';

function requireEnv(env, names) {
  const missing = names.filter((n) => !env[n]);
  if (missing.length) throw new Error(`Missing app settings: ${missing.join(', ')}`);
}

function createSharePointStore(env = process.env, fetchImpl = fetch) {
  requireEnv(env, ['PEI_TENANT_ID', 'PEI_CLIENT_ID', 'PEI_CLIENT_SECRET', 'PEI_SITE_ID', 'PEI_REQUESTS_LIST_ID', 'PEI_PROPERTIES_LIST_ID', 'PEI_PHOTOS_DRIVE_ID']);
  const site = env.PEI_SITE_ID;
  const reqList = env.PEI_REQUESTS_LIST_ID;
  const propList = env.PEI_PROPERTIES_LIST_ID;
  const drive = env.PEI_PHOTOS_DRIVE_ID;

  let token = null;
  async function getToken() {
    if (token && token.exp - Date.now() > 120e3) return token.value;
    const res = await fetchImpl(`https://login.microsoftonline.com/${encodeURIComponent(env.PEI_TENANT_ID)}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.PEI_CLIENT_ID,
        client_secret: env.PEI_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });
    if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
    const j = await res.json();
    token = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
    return token.value;
  }

  async function graph(method, url, { json, body, headers = {} } = {}, attempt = 0) {
    const res = await fetchImpl(url.startsWith('http') ? url : GRAPH + url, {
      method,
      headers: {
        Authorization: `Bearer ${await getToken()}`,
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : body,
    });
    // Graph throttles with 429/503 and says how long to wait. Two short retries, then give up
    // and let the form show "Not sent yet" — the worker's answers are safe on the phone.
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      const wait = Math.min(Number(res.headers.get('Retry-After')) || 1, 5) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      return graph(method, url, { json, body, headers }, attempt + 1);
    }
    if (res.status === 404 && method === 'GET') return null;
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Graph ${method} ${url.split('?')[0]} failed: ${res.status} ${text.slice(0, 300)}`);
    }
    return res.status === 204 ? null : res.json();
  }

  const items = (list) => `/sites/${site}/lists/${list}/items`;
  const odataStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

  return {
    async listProperties() {
      const out = [];
      let url = `${items(propList)}?$expand=fields($select=Title,Code,City,State,Active,AfterHoursPhone)&$top=500`;
      while (url) {
        const page = await graph('GET', url);
        if (!page) break;
        for (const it of page.value) {
          const f = it.fields || {};
          out.push({ itemId: it.id, code: String(f.Code || '').trim().toLowerCase(), name: f.Title || '', city: f.City || '', state: f.State || '', afterHoursPhone: f.AfterHoursPhone || '', active: f.Active === true });
        }
        url = page['@odata.nextLink'] || null;
      }
      return out;
    },

    async findRequestByClientId(clientId) {
      // ClientId is an indexed column (provision.ps1), so this filter is allowed on a large list.
      const page = await graph('GET', `${items(reqList)}?$expand=fields($select=Title,ClientId)&$filter=fields/ClientId eq ${odataStr(clientId)}&$top=1`, {
        headers: { Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly' },
      });
      const it = page && page.value && page.value[0];
      return it ? { itemId: it.id, num: it.fields.Title } : null;
    },

    async createRequest(fields, { propertyItemId } = {}) {
      const f = { ...fields, Title: 'pending' };
      if (propertyItemId) f.PropertyLookupId = String(propertyItemId);
      const created = await graph('POST', items(reqList), { json: { fields: f } });
      // The request number comes from the item ID, so it is unique and increases without a counter.
      const num = requestNumber(created.id);
      await graph('PATCH', `${items(reqList)}/${created.id}/fields`, { json: { Title: num } });
      return num;
    },

    /* Every request, newest first, with the fields the coordinators' dashboard shows. At 15 to
       20 requests a week this is a few hundred items a year; capped at 4,000. */
    async listRequests() {
      const sel = 'Title,Status,PropertyCode,PlaceNotListed,Apartment,WorkerName,WorkerCell,JobSite,Supervisor,ProblemType,CategoryCode,WhereInUnit,ProblemDescription,FormLanguage,PhotoCount,PossibleEmergency,RepeatOf,RepeatCount,LastRepeatOn,SentOn';
      const out = [];
      let url = `${items(reqList)}?$expand=fields($select=${sel})&$top=500`;
      while (url && out.length < 4000) {
        const page = await graph('GET', url);
        if (!page) break;
        for (const it of page.value) out.push({ itemId: it.id, created: it.createdDateTime, ...(it.fields || {}) });
        url = page['@odata.nextLink'] || null;
      }
      return out;
    },

    async findOpenRepeat(key) {
      // RepeatKey is indexed (provision.ps1). The original is the oldest open request with the key
      // that is not itself a repeat, so every repeat counts against the same original.
      const page = await graph('GET', `${items(reqList)}?$expand=fields($select=Title,Status,RepeatOf)&$filter=fields/RepeatKey eq ${odataStr(key)}&$top=50`, {
        headers: { Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly' },
      });
      const open = ['New', 'Needs Info', 'Sent to Property'];
      const hits = ((page && page.value) || []).filter((it) => open.includes(it.fields.Status) && !it.fields.RepeatOf)
        .sort((a, b) => Number(a.id) - Number(b.id));
      return hits.length ? { itemId: hits[0].id, num: hits[0].fields.Title } : null;
    },

    async recordRepeat(original, num, at) {
      const it = await graph('GET', `${items(reqList)}/${original.itemId}?$expand=fields($select=RepeatCount,ActivityLog)`);
      if (!it) return;
      const f = it.fields || {};
      await graph('PATCH', `${items(reqList)}/${original.itemId}/fields`, { json: {
        RepeatCount: (Number(f.RepeatCount) || 0) + 1,
        LastRepeatOn: at,
        ActivityLog: `${f.ActivityLog || ''}\n${at}  Reported again as ${num}`,
      } });
    },

    async updatePhotoCount(existing, count) {
      await graph('PATCH', `${items(reqList)}/${existing.itemId}/fields`, { json: { PhotoCount: count, PhotosMissing: 0 } });
    },

    async countPhotos(clientId) {
      const page = await graph('GET', `/drives/${drive}/root:/${encodeURIComponent(clientId)}:/children?$select=name&$top=20`);
      return page ? page.value.length : 0;
    },

    async deletePhoto(clientId, index) {
      const existing = await graph('GET', `/drives/${drive}/root:/${encodeURIComponent(clientId)}:/children?$select=name,id&$top=20`);
      if (!existing) return;
      for (const it of existing.value) {
        if (it.name.startsWith(`photo-${index + 1}.`)) await graph('DELETE', `/drives/${drive}/items/${it.id}`);
      }
    },

    async putPhoto(clientId, index, ext, buf) {
      // Simple upload handles files up to 4 MB, which is the API's limit for one photo.
      const name = `photo-${index + 1}.${ext}`;
      const existing = await graph('GET', `/drives/${drive}/root:/${encodeURIComponent(clientId)}:/children?$select=name,id&$top=20`);
      if (existing) {
        for (const it of existing.value) {
          if (it.name !== name && it.name.startsWith(`photo-${index + 1}.`)) await graph('DELETE', `/drives/${drive}/items/${it.id}`);
        }
      }
      await graph('PUT', `/drives/${drive}/root:/${encodeURIComponent(clientId)}/${name}:/content`, {
        body: buf,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    },
  };
}

module.exports = { createSharePointStore };
