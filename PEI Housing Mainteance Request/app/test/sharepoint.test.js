'use strict';
/* The SharePoint store against a fake Microsoft Graph: checks the calls it makes, not SharePoint itself. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSharePointStore } = require('../api/src/lib/store-sharepoint');

const ENV = {
  PEI_TENANT_ID: 'tenant', PEI_CLIENT_ID: 'app', PEI_CLIENT_SECRET: 'secret', PEI_SITE_ID: 'site1',
  PEI_REQUESTS_LIST_ID: 'reqs', PEI_PROPERTIES_LIST_ID: 'props', PEI_PHOTOS_DRIVE_ID: 'drive1',
};

function fakeGraph(routes) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const method = init.method || 'GET';
    calls.push({ method, url, body: init.body, headers: init.headers || {} });
    if (url.includes('login.microsoftonline.com')) return json(200, { access_token: 'tok', expires_in: 3600 });
    for (const [m, re, fn] of routes) if (m === method && re.test(url)) return fn(url, init);
    return json(404, { error: 'not found' });
  };
  return { calls, fetchImpl };
}
function json(status, body) {
  return { ok: status < 300, status, headers: new Map(), json: async () => body, text: async () => JSON.stringify(body) };
}

test('refuses to start without its settings', () => {
  assert.throws(() => createSharePointStore({}, async () => {}), /Missing app settings: PEI_TENANT_ID/);
});

test('reads the property list, following pages', async () => {
  const g = fakeGraph([
    ['GET', /lists\/props\/items\?/, () => json(200, { value: [{ id: '1', fields: { Title: 'Test Apartments', Code: ' TEST-VLD ', City: 'Valdosta', State: 'GA', Active: true, AfterHoursPhone: '229-555-0143' } }], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/next-page' })],
    ['GET', /next-page/, () => json(200, { value: [{ id: '2', fields: { Title: 'Old', Code: 'old', Active: false } }] })],
  ]);
  const s = createSharePointStore(ENV, g.fetchImpl);
  const list = await s.listProperties();
  assert.deepEqual(list, [
    { itemId: '1', code: 'test-vld', name: 'Test Apartments', city: 'Valdosta', state: 'GA', afterHoursPhone: '229-555-0143', active: true },
    { itemId: '2', code: 'old', name: 'Old', city: '', state: '', afterHoursPhone: '', active: false },
  ]);
  assert.equal(g.calls.filter((c) => c.url.includes('login')).length, 1, 'token is cached');
  assert.equal(g.calls[1].headers.Authorization, 'Bearer tok');
});

test('creates the item, links the property, then numbers it from the item ID', async () => {
  const g = fakeGraph([
    ['POST', /lists\/reqs\/items$/, () => json(201, { id: '57' })],
    ['PATCH', /lists\/reqs\/items\/57\/fields$/, () => json(200, {})],
  ]);
  const s = createSharePointStore(ENV, g.fetchImpl);
  const num = await s.createRequest({ Status: 'New', Apartment: '104' }, { propertyItemId: 3 });
  assert.equal(num, 'HR-1057');
  const post = JSON.parse(g.calls.find((c) => c.method === 'POST' && c.url.includes('/items')).body);
  assert.deepEqual(post.fields, { Status: 'New', Apartment: '104', Title: 'pending', PropertyLookupId: '3' });
  const patch = JSON.parse(g.calls.find((c) => c.method === 'PATCH').body);
  assert.deepEqual(patch, { Title: 'HR-1057' });
});

test('looks up a request by client ID with a quoted filter', async () => {
  const g = fakeGraph([['GET', /lists\/reqs\/items\?/, () => json(200, { value: [{ id: '9', fields: { Title: 'HR-1009', ClientId: 'abc' } }] })]]);
  const s = createSharePointStore(ENV, g.fetchImpl);
  assert.deepEqual(await s.findRequestByClientId("ab'c"), { itemId: '9', num: 'HR-1009' });
  assert.match(g.calls[1].url, /\$filter=fields\/ClientId eq 'ab''c'/);
});

test('photos go to a folder named by client ID; a missing folder counts as zero', async () => {
  const g = fakeGraph([['PUT', /drives\/drive1\/root:\/id-1\/photo-2\.jpg:\/content$/, () => json(201, {})]]);
  const s = createSharePointStore(ENV, g.fetchImpl);
  assert.equal(await s.countPhotos('id-1'), 0);
  await s.putPhoto('id-1', 1, 'jpg', Buffer.from('x'));
  assert.ok(g.calls.some((c) => c.method === 'PUT'));
});

test('retries once when Graph throttles, then reports the failure', async () => {
  let n = 0;
  const g = fakeGraph([['POST', /lists\/reqs\/items$/, () => { n++; return { ...json(429, {}), headers: new Map([['Retry-After', '0']]) }; }]]);
  const s = createSharePointStore(ENV, g.fetchImpl);
  await assert.rejects(s.createRequest({}, {}), /429/);
  assert.equal(n, 3);
});
