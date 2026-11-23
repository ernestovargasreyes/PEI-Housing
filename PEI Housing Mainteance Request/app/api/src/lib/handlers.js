'use strict';
/*
 * The three API operations, written without reference to Azure Functions so they can be
 * tested directly and served by the local dev server. index.js adapts them to Azure.
 *
 * Every handler takes { query, headers, body, ip } and returns { status, json }.
 */
const { validateRequest, toListFields, requestNumber, formatPhone, UUID } = require('./schema');
const { RateLimiter } = require('./ratelimit');

const HOUR = 3600e3;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // the form shrinks photos to ~1600px JPEG first; this leaves room
const PROPERTY_CACHE_MS = 5 * 60e3;

/* Recognise an image by its first bytes rather than trusting the Content-Type. */
function sniffImage(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (buf.slice(4, 8).toString('latin1') === 'ftyp' && /^(heic|heix|hevc|mif1|msf1)$/.test(buf.slice(8, 12).toString('latin1'))) return 'heic';
  return null;
}

function createHandlers(store, opts = {}) {
  const now = opts.now || (() => Date.now());
  const perPhone = new RateLimiter({ limit: opts.perPhoneLimit ?? 5, windowMs: HOUR, now });
  const perAddress = new RateLimiter({ limit: opts.perAddressLimit ?? 40, windowMs: HOUR, now });
  const photoAddress = new RateLimiter({ limit: opts.photoAddressLimit ?? 200, windowMs: HOUR, now });
  const log = opts.log || (() => {});

  let propCache = null;
  async function properties() {
    if (propCache && now() - propCache.at < PROPERTY_CACHE_MS) return propCache.list;
    const list = (await store.listProperties()).filter((p) => p.active && p.code && p.name);
    propCache = { at: now(), list };
    return list;
  }

  /* Recent client IDs, so a retry that races the first write still gets the same number. */
  const recent = new Map();
  const remember = (clientId, num) => {
    recent.set(clientId, { num, at: now() });
    if (recent.size > 5000) for (const [k, r] of recent) if (now() - r.at > HOUR) recent.delete(k);
  };
  const inflight = new Map();

  async function getProperties() {
    try {
      const list = await properties();
      // Only what the picker and the emergency screen need. The after-hours number is the one
      // contact detail sent: the property handles emergencies, so the worker must be able to call it.
      // Contact names, submit-to addresses and notes never leave the server.
      return {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=300' },
        json: list.map((p) => ({ code: p.code, name: p.name, city: p.city || '', st: p.state || '', ah: formatPhone(p.afterHoursPhone) })),
      };
    } catch (err) {
      log('error', 'properties failed', err);
      return { status: 503, json: { error: 'unavailable' } };
    }
  }

  async function postRequest({ body, ip }) {
    const b = body && typeof body === 'object' ? body : {};

    // Hidden field people never see. Anything that fills it is dropped without a word.
    if (b.website) return { status: 201, json: { num: 'HR-0000' } };

    const clientId = typeof b.clientId === 'string' ? b.clientId : '';
    if (UUID.test(clientId)) {
      const seen = recent.get(clientId);
      if (seen) return { status: 200, json: { num: seen.num, repeat: true } };
      // A copy of this request is already being written: answer with its number.
      // (Registered below before any await, so two copies arriving together cannot both write.)
      if (inflight.has(clientId)) {
        const r = await inflight.get(clientId).catch(() => null);
        if (r && r.num) return { status: 200, json: { num: r.num, repeat: true } };
      }
    }

    const work = (async () => {
      let known;
      try { known = new Set((await properties()).map((p) => p.code)); } catch { known = new Set(); }
      const checked = validateRequest(b, known);
      if (!checked.ok) return { invalid: checked.fields };
      const v = checked.value;

      const existing = await store.findRequestByClientId(v.clientId);
      if (existing) return { num: existing.num, repeat: true };

      if (!perPhone.check(v.deviceId) || !perAddress.check(ip)) return { limited: true };

      const props = await properties().catch(() => []);
      const prop = props.find((p) => p.code === v.propertyCode);
      const photoCount = await store.countPhotos(v.clientId).catch(() => 0);
      const fields = toListFields(v, { photoCount, now: new Date(now()).toISOString() });
      const num = await store.createRequest(fields, { propertyItemId: prop ? prop.itemId : null });
      perPhone.record(v.deviceId);
      perAddress.record(ip);
      return { num };
    })();

    const key = UUID.test(clientId) ? clientId : null;
    if (key) inflight.set(key, work);
    try {
      const r = await work;
      if (r.invalid) return { status: 400, json: { error: 'invalid', fields: r.invalid } };
      if (r.limited) return { status: 429, json: { error: 'rate_limited' } };
      remember(clientId, r.num);
      return { status: r.repeat ? 200 : 201, json: r.repeat ? { num: r.num, repeat: true } : { num: r.num } };
    } catch (err) {
      log('error', 'create request failed', err);
      return { status: 503, json: { error: 'unavailable' } };
    } finally {
      if (key && inflight.get(key) === work) inflight.delete(key);
      perPhone.sweep(); perAddress.sweep();
    }
  }

  async function postPhoto({ query, body, ip }) {
    const clientId = String(query.clientId || '');
    const index = Number(query.index);
    if (!UUID.test(clientId) || !Number.isInteger(index) || index < 0 || index > 4) {
      return { status: 400, json: { error: 'invalid' } };
    }
    if (!Buffer.isBuffer(body) || !body.length) return { status: 400, json: { error: 'empty' } };
    if (body.length > MAX_PHOTO_BYTES) return { status: 413, json: { error: 'too_large' } };
    const ext = sniffImage(body);
    if (!ext) return { status: 415, json: { error: 'not_an_image' } };
    if (!photoAddress.check(ip)) return { status: 429, json: { error: 'rate_limited' } };
    try {
      // Same index overwrites, so a retried upload never makes a second copy.
      await store.putPhoto(clientId, index, ext, body);
      photoAddress.record(ip);
      // Photos sent again from the confirmation screen land on a request that already exists.
      const existing = await store.findRequestByClientId(clientId);
      if (existing) await store.updatePhotoCount(existing, await store.countPhotos(clientId));
      return { status: 201, json: { ok: true } };
    } catch (err) {
      log('error', 'photo upload failed', err);
      return { status: 503, json: { error: 'unavailable' } };
    } finally {
      photoAddress.sweep();
    }
  }

  /* A worker removed a photo before sending. Once a request exists its photos are kept:
     the coordinators may already have forwarded them. */
  async function deletePhoto({ query }) {
    const clientId = String(query.clientId || '');
    const index = Number(query.index);
    if (!UUID.test(clientId) || !Number.isInteger(index) || index < 0 || index > 4) {
      return { status: 400, json: { error: 'invalid' } };
    }
    try {
      if (await store.findRequestByClientId(clientId)) return { status: 409, json: { error: 'already_sent' } };
      await store.deletePhoto(clientId, index);
      return { status: 204, json: null };
    } catch (err) {
      log('error', 'photo delete failed', err);
      return { status: 503, json: { error: 'unavailable' } };
    }
  }

  return { getProperties, postRequest, postPhoto, deletePhoto };
}

module.exports = { createHandlers, sniffImage, requestNumber, MAX_PHOTO_BYTES };
