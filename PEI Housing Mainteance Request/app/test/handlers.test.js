'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { createHandlers, sniffImage } = require('../api/src/lib/handlers');
const { createMemoryStore } = require('../api/src/lib/store-memory');

const PROPS = [
  { code: 'test-vld', name: 'Test Apartments – Valdosta', city: 'Valdosta', state: 'GA', contact: 'secret contact', submitTo: 'secret@example.com', afterHoursPhone: '229-555-0143' },
  { code: 'old-one', name: 'Old Place', city: 'Albany', state: 'GA', active: false },
];
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]);
const req = (o = {}) => ({
  clientId: crypto.randomUUID(), deviceId: o.deviceId || crypto.randomUUID(), lang: 'en',
  code: 'test-vld', apt: '104', name: 'Marcus Bell', cell: '2295550188', site: 'I-85 widening',
  cat: 3, where: 2, desc: 'AC blows warm air.', long: 0, worse: 0, entry: 0, times: [], pets: 0, ...o,
});
const setup = (opts) => { const store = createMemoryStore({ properties: PROPS }); return { store, h: createHandlers(store, opts) }; };

test('properties returns active ones with public fields and the after-hours number only', async () => {
  const { h } = setup();
  const r = await h.getProperties();
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, [{ code: 'test-vld', name: 'Test Apartments – Valdosta', city: 'Valdosta', st: 'GA', ah: '(229) 555-0143' }]);
  assert.doesNotMatch(JSON.stringify(r.json), /secret/);
});

test('a request is stored and numbered', async () => {
  const { h, store } = setup();
  const r = await h.postRequest({ body: req(), ip: '1.1.1.1' });
  assert.equal(r.status, 201);
  assert.equal(r.json.num, 'HR-1001');
  const row = store.state.requests[0];
  assert.equal(row.fields.Title, 'HR-1001');
  assert.equal(row.propertyItemId, 1);
  assert.equal(row.fields.Status, 'New');
});

test('the same request sent twice keeps one copy and one number', async () => {
  const { h, store } = setup();
  const body = req();
  const [a, b] = await Promise.all([h.postRequest({ body, ip: 'x' }), h.postRequest({ body, ip: 'x' })]);
  const c = await h.postRequest({ body, ip: 'x' });
  assert.equal(store.state.requests.length, 1);
  assert.equal(a.json.num, b.json.num);
  assert.equal(c.json.num, a.json.num);
  assert.equal(c.json.repeat, true);
});

test('a retry after a restart finds the stored copy', async () => {
  const store = createMemoryStore({ properties: PROPS });
  const body = req();
  const first = await createHandlers(store).postRequest({ body, ip: 'x' });
  const again = await createHandlers(store).postRequest({ body, ip: 'x' });
  assert.equal(again.status, 200);
  assert.equal(again.json.num, first.json.num);
});

test('an invalid request names the fields', async () => {
  const { h } = setup();
  const r = await h.postRequest({ body: req({ apt: '', entry: 1, times: [] }), ip: 'x' });
  assert.equal(r.status, 400);
  assert.deepEqual(r.json.fields.sort(), ['apt', 'times']);
});

test('the hidden field drops the request quietly', async () => {
  const { h, store } = setup();
  const r = await h.postRequest({ body: req({ website: 'http://spam' }), ip: 'x' });
  assert.equal(r.status, 201);
  assert.equal(store.state.requests.length, 0);
});

test('5 requests per phone per hour, then 429; the hour slides', async () => {
  let now = Date.parse('2026-12-07T09:00:00Z');
  const { h } = setup({ now: () => now });
  const deviceId = crypto.randomUUID();
  for (let i = 0; i < 5; i++) assert.equal((await h.postRequest({ body: req({ deviceId }), ip: 'x' })).status, 201);
  assert.equal((await h.postRequest({ body: req({ deviceId }), ip: 'x' })).status, 429);
  assert.equal((await h.postRequest({ body: req(), ip: 'x' })).status, 201, 'another phone on the same Wi-Fi still gets through');
  now += 3600e3 + 1;
  assert.equal((await h.postRequest({ body: req({ deviceId }), ip: 'x' })).status, 201);
});

test('an inactive or unknown property is not accepted without a name', async () => {
  const { h } = setup();
  const r = await h.postRequest({ body: req({ code: 'old-one' }), ip: 'x' });
  assert.equal(r.status, 400);
  assert.deepEqual(r.json.fields, ['code']);
});

test('photos: stored by slot, counted on the request, extras reported missing', async () => {
  const { h, store } = setup();
  const body = req({ photosExpected: 3 });
  assert.equal((await h.postPhoto({ query: { clientId: body.clientId, index: '0' }, body: JPEG, ip: 'x' })).status, 201);
  assert.equal((await h.postPhoto({ query: { clientId: body.clientId, index: '0' }, body: JPEG, ip: 'x' })).status, 201, 'retry overwrites');
  assert.equal((await h.postPhoto({ query: { clientId: body.clientId, index: '1' }, body: JPEG, ip: 'x' })).status, 201);
  await h.postRequest({ body, ip: 'x' });
  const f = store.state.requests[0].fields;
  assert.equal(f.PhotoCount, 2);
  assert.equal(f.PhotosMissing, 1);
  // "Send photos again" from the confirmation screen
  await h.postPhoto({ query: { clientId: body.clientId, index: '2' }, body: JPEG, ip: 'x' });
  assert.equal(store.state.requests[0].fields.PhotoCount, 3);
  assert.equal(store.state.requests[0].fields.PhotosMissing, 0);
});

test('photos: removed before sending, kept after', async () => {
  const { h, store } = setup();
  const body = req();
  await h.postPhoto({ query: { clientId: body.clientId, index: '0' }, body: JPEG, ip: 'x' });
  assert.equal((await h.deletePhoto({ query: { clientId: body.clientId, index: '0' } })).status, 204);
  assert.equal(await store.countPhotos(body.clientId), 0);
  await h.postPhoto({ query: { clientId: body.clientId, index: '1' }, body: JPEG, ip: 'x' });
  await h.postRequest({ body, ip: 'x' });
  assert.equal((await h.deletePhoto({ query: { clientId: body.clientId, index: '1' } })).status, 409);
});

test('photos: only images, only five slots, size capped', async () => {
  const { h } = setup();
  const id = crypto.randomUUID();
  assert.equal((await h.postPhoto({ query: { clientId: id, index: '5' }, body: JPEG, ip: 'x' })).status, 400);
  assert.equal((await h.postPhoto({ query: { clientId: 'x', index: '0' }, body: JPEG, ip: 'x' })).status, 400);
  assert.equal((await h.postPhoto({ query: { clientId: id, index: '0' }, body: Buffer.from('<html>hello world</html>'), ip: 'x' })).status, 415);
  assert.equal((await h.postPhoto({ query: { clientId: id, index: '0' }, body: Buffer.concat([JPEG, Buffer.alloc(4 * 1024 * 1024)]), ip: 'x' })).status, 413);
});

test('image sniffing', () => {
  assert.equal(sniffImage(JPEG), 'jpg');
  assert.equal(sniffImage(Buffer.from('89504e470d0a1a0a0000000000', 'hex')), 'png');
  assert.equal(sniffImage(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')])), 'webp');
  assert.equal(sniffImage(Buffer.concat([Buffer.alloc(4), Buffer.from('ftypheic'), Buffer.alloc(4)])), 'heic');
  assert.equal(sniffImage(Buffer.from('GIF89a......')), null);
});

test('a store failure returns 503 so the form keeps the answers and retries', async () => {
  const store = createMemoryStore({ properties: PROPS });
  store.createRequest = async () => { throw new Error('Graph down'); };
  const r = await createHandlers(store).postRequest({ body: req(), ip: 'x' });
  assert.equal(r.status, 503);
});

test('dry-run list: needs the exact key, at least 16 characters; newest first', async () => {
  const { h } = setup();
  await h.postRequest({ body: req({ apt: '101' }), ip: 'x' });
  await h.postRequest({ body: req({ apt: '102' }), ip: 'x' });
  const key = 'k'.repeat(20);
  assert.equal((await h.dryRunList({ key: '', expected: key })).status, 404);
  assert.equal((await h.dryRunList({ key: 'k'.repeat(19), expected: key })).status, 404);
  assert.equal((await h.dryRunList({ key: 'short', expected: 'short' })).status, 404, 'short keys are refused');
  assert.equal((await h.dryRunList({ key: '', expected: '' })).status, 404, 'no key set means off');
  const r = await h.dryRunList({ key, expected: key });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.map((x) => x.Apartment), ['102', '101']);
});

test('dry-run list is unavailable on a store without it (SharePoint)', async () => {
  const store = createMemoryStore({ properties: PROPS });
  delete store.listRequests;
  const key = 'k'.repeat(20);
  assert.equal((await createHandlers(store).dryRunList({ key, expected: key })).status, 404);
});

test('repeats: a second report of an open problem is marked and counted on the original', async () => {
  const { h, store } = setup();
  const first = await h.postRequest({ body: req({ apt: '104', cat: 3 }), ip: 'x' });
  const second = await h.postRequest({ body: req({ apt: 'Apt 104', cat: 3, desc: 'Still no AC' }), ip: 'x' });
  const third = await h.postRequest({ body: req({ apt: '#104', cat: 3 }), ip: 'x' });
  const rows = store.state.requests;
  assert.equal(rows[0].fields.RepeatCount, 2);
  assert.ok(rows[0].fields.LastRepeatOn);
  assert.match(rows[0].fields.ActivityLog, new RegExp(`Reported again as ${second.json.num}`));
  assert.equal(rows[1].fields.RepeatOf, first.json.num);
  assert.equal(rows[2].fields.RepeatOf, first.json.num, 'every repeat points at the original');
  assert.equal(third.status, 201);
});

test('repeats: different apartment, problem or place is not a repeat', async () => {
  const { h, store } = setup();
  await h.postRequest({ body: req({ apt: '104', cat: 3 }), ip: 'x' });
  await h.postRequest({ body: req({ apt: '105', cat: 3 }), ip: 'x' });
  await h.postRequest({ body: req({ apt: '104', cat: 4 }), ip: 'x' });
  await h.postRequest({ body: req({ code: '', freeName: 'Pine Court', apt: '104', cat: 3 }), ip: 'x' });
  assert.deepEqual(store.state.requests.map((r) => r.fields.RepeatOf || ''), ['', '', '', '']);
  assert.equal(store.state.requests[0].fields.RepeatCount || 0, 0);
});

test('repeats: a closed, fixed or duplicate original starts fresh', async () => {
  for (const status of ['Fixed', 'Closed', 'Duplicate']) {
    const { h, store } = setup();
    await h.postRequest({ body: req({ apt: '104', cat: 3 }), ip: 'x' });
    store.state.requests[0].fields.Status = status;
    await h.postRequest({ body: req({ apt: '104', cat: 3 }), ip: 'x' });
    assert.equal(store.state.requests[1].fields.RepeatOf, undefined, status);
  }
});

test('repeats: still matched once the original was sent to the property', async () => {
  const { h, store } = setup();
  const first = await h.postRequest({ body: req({ apt: '104', cat: 3 }), ip: 'x' });
  store.state.requests[0].fields.Status = 'Sent to Property';
  await h.postRequest({ body: req({ apt: '104', cat: 3 }), ip: 'x' });
  assert.equal(store.state.requests[1].fields.RepeatOf, first.json.num);
});

test('repeats: a failed lookup never blocks the request', async () => {
  const store = createMemoryStore({ properties: PROPS });
  store.findOpenRepeat = async () => { throw new Error('Graph down'); };
  const r = await createHandlers(store).postRequest({ body: req(), ip: 'x' });
  assert.equal(r.status, 201);
});
