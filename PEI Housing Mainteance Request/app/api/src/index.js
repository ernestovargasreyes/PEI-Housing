'use strict';
/*
 * Azure Functions entry point (Node.js v4 programming model), deployed as the managed
 * API of an Azure Static Web App. Routes are served under /api/.
 */
const { app } = require('@azure/functions');
const { createHandlers } = require('./lib/handlers');

let handlers = null;
function getHandlers(context) {
  if (handlers) return handlers;
  let store;
  if (process.env.PEI_STORE === 'memory') {
    // Only for trying the API without SharePoint. Requests vanish when the instance restarts.
    const { createMemoryStore } = require('./lib/store-memory');
    store = createMemoryStore({ properties: require('./lib/properties.sample.json') });
  } else {
    const { createSharePointStore } = require('./lib/store-sharepoint');
    store = createSharePointStore(process.env);
  }
  handlers = createHandlers(store, { log: (level, msg, err) => context.error(`${msg}: ${err && err.message}`) });
  return handlers;
}

const clientIp = (req) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim().replace(/:\d+$/, '') || 'unknown';
const reply = (r) => ({
  status: r.status,
  jsonBody: r.json,
  headers: { 'Cache-Control': 'no-store', ...(r.headers || {}) },
});

app.http('properties', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'properties',
  handler: async (req, context) => reply(await getHandlers(context).getProperties()),
});

app.http('requests', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'requests',
  handler: async (req, context) => {
    let body = null;
    try { body = await req.json(); } catch { return reply({ status: 400, json: { error: 'invalid_json' } }); }
    return reply(await getHandlers(context).postRequest({ body, ip: clientIp(req) }));
  },
});

// Dry run only: what arrived, for the person running it. Answers 404 unless the app runs in
// memory mode with PEI_DRYRUN_KEY set and the request carries that key (app/DRY-RUN.md).
app.http('dryrun', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dryrun/requests',
  handler: async (req, context) => {
    if (process.env.PEI_STORE !== 'memory') return reply({ status: 404, json: { error: 'not_found' } });
    return reply(await getHandlers(context).dryRunList({ key: req.query.get('key') || '', expected: process.env.PEI_DRYRUN_KEY || '' }));
  },
});

app.http('photos', {
  methods: ['POST', 'DELETE'],
  authLevel: 'anonymous',
  route: 'photos',
  handler: async (req, context) => {
    const query = Object.fromEntries(req.query.entries());
    if (req.method === 'DELETE') return reply(await getHandlers(context).deletePhoto({ query }));
    const len = Number(req.headers.get('content-length') || 0);
    if (len > 4 * 1024 * 1024) return reply({ status: 413, json: { error: 'too_large' } });
    const body = Buffer.from(await req.arrayBuffer());
    return reply(await getHandlers(context).postPhoto({ query, body, ip: clientIp(req) }));
  },
});
