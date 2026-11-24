'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createHandlers } = require('../api/src/lib/handlers');
const { createMemoryStore } = require('../api/src/lib/store-memory');
const { isCoordinator } = require('../api/src/lib/auth');

const PROPS = [{ code: 'test-mgm', name: 'Test Apartments – Montgomery', city: 'Montgomery', state: 'AL' }];
const req = (o = {}) => ({
  clientId: crypto.randomUUID(), deviceId: crypto.randomUUID(), lang: 'en', code: 'test-mgm', apt: '104', name: 'Marcus Bell',
  cell: '3345550188', site: 'I-85', cat: 3, where: 2, desc: 'AC warm', long: 0, worse: 0, entry: 0, times: [], pets: 0, ...o,
});
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64');

test('dashboard data: newest first, property names, repeats, and SharePoint links', async () => {
  const store = createMemoryStore({ properties: PROPS });
  const h = createHandlers(store, { requestsListUrl: 'https://x.sharepoint.com/sites/housing/Lists/Requests/' });
  await h.postRequest({ body: req(), ip: 'x' });
  await h.postRequest({ body: req({ name: 'Dwayne Harris', cell: '3345550177' }), ip: 'x' });
  await h.postRequest({ body: req({ code: '', freeName: 'Pine Court', apt: '3', cat: 4, lang: 'es' }), ip: 'x' });
  store.state.requests[0].created = '2026-12-01T10:00:00Z';
  store.state.requests[1].created = '2026-12-02T10:00:00Z';
  store.state.requests[2].created = '2026-12-03T10:00:00Z';
  const r = await h.dashboard();
  assert.equal(r.status, 200);
  const [c, b, a] = r.json.requests;
  assert.deepEqual([c.num, b.num, a.num], ['HR-1003', 'HR-1002', 'HR-1001']);
  assert.equal(a.place, 'Test Apartments – Montgomery');
  assert.equal(c.place, 'Pine Court (not on the list)');
  assert.equal(a.repeatCount, 1);
  assert.equal(b.repeatOf, 'HR-1001');
  assert.equal(a.link, 'https://x.sharepoint.com/sites/housing/Lists/Requests/DispForm.aspx?ID=1');
  assert.equal(c.lang, 'Spanish');
});

test('dashboard data: a store failure is a 503, not a crash', async () => {
  const store = createMemoryStore({ properties: PROPS });
  store.listRequests = async () => { throw new Error('Graph down'); };
  assert.equal((await createHandlers(store).dashboard()).status, 503);
});

test('only the coordinator role passes the sign-in check', () => {
  assert.equal(isCoordinator(b64({ userRoles: ['anonymous', 'authenticated', 'coordinator'] })), true);
  assert.equal(isCoordinator(b64({ userRoles: ['anonymous', 'authenticated'] })), false);
  assert.equal(isCoordinator(b64({})), false);
  assert.equal(isCoordinator(''), false);
  assert.equal(isCoordinator('not base64 json'), false);
});

test('Azure routes lock the dashboard to coordinators and keep the form public', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'web', 'staticwebapp.config.json'), 'utf8'));
  const find = (route) => cfg.routes.findIndex((r) => r.route === route);
  for (const r of ['/dashboard.html', '/dashboard.js', '/api/dashboard']) {
    const i = find(r);
    assert.ok(i >= 0, r);
    assert.deepEqual(cfg.routes[i].allowedRoles, ['coordinator'], r);
    assert.ok(i < find('/api/*'), `${r} comes before the public /api/* rule`);
  }
  assert.deepEqual(cfg.routes[find('/api/*')].allowedRoles, ['anonymous']);
  assert.match(cfg.responseOverrides['401'].redirect, /^\/\.auth\/login\/aad/);
});
