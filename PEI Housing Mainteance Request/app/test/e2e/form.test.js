'use strict';
/*
 * The worker form in a real browser (Playwright's Chromium) at phone size, against the
 * local dev server. Covers the trial-platform.md test cards that a browser can check:
 * photo without sign-in, entry permission, Spanish, emergency stop, QR pre-fill, weak or
 * no signal, plus the failure states in states-worker-form.md.
 *
 *   npm run test:e2e
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, devices } = require('playwright');
const { createServer } = require('../../dev/server');

const CONFIG = { housingNumber: '(229) 555-0101', testMode: true, holidays: [] };
let browser, srv, base;

test.before(async () => {
  browser = await chromium.launch();
  srv = createServer({ dataDir: null, config: CONFIG });
  await new Promise((r) => srv.server.listen(0, r));
  base = `http://localhost:${srv.server.address().port}`;
});
test.after(async () => { await browser.close(); srv.server.close(); });

async function phone(opts = {}) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], locale: opts.locale || 'en-US' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  ctx.on('weberror', (e) => errors.push(e.error().message));
  page.errors = errors;
  return { ctx, page };
}
const tap = (page, name) => page.getByRole('button', { name, exact: true }).click();
const pill = (page, group, name) => page.getByRole('group', { name: group }).getByLabel(name, { exact: true }).check();

async function jpeg(page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 300;
    const g = c.getContext('2d'); g.fillStyle = '#c33'; g.fillRect(0, 0, 400, 300);
    return c.toDataURL('image/jpeg', 0.9).split(',')[1];
  });
  return { name: 'thermostat.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(b64, 'base64') };
}

async function fillToAccess(page, { qr = false, entry = 'Yes', photo = false, started = false } = {}) {
  if (!started) await tap(page, 'None of these — report a problem');
  if (!qr) {
    await page.getByRole('button', { name: /Apartments/ }).click();
    await page.getByRole('button', { name: /Test Apartments – Valdosta/ }).click();
  }
  await page.getByLabel('Apartment number').fill('104');
  await tap(page, 'Next');
  await page.getByLabel('Your name').fill('Marcus Bell');
  await page.getByLabel('Your cell number').fill('229-555-0188');
  await page.getByLabel('What job site are you on?').fill('I-85 widening');
  await tap(page, 'Next');
  await page.getByLabel('Type of problem').selectOption({ label: 'Heating or air conditioning' });
  await pill(page, 'Where in your apartment?', 'Bedroom');
  await page.getByLabel("Tell us what's happening").fill('AC blows warm air, started Tuesday.');
  await pill(page, 'How long has this been going on?', 'A few days');
  await pill(page, 'Is it getting worse?', 'Yes');
  if (photo) {
    await page.locator('#fileIn').setInputFiles(await jpeg(page));
    await page.getByText('Photo 1 uploaded').waitFor({ state: 'attached' });
  }
  await tap(page, 'Next');
  await pill(page, "Can maintenance come in if you're not there?", entry);
  await pill(page, 'Any pets in the apartment?', 'None');
}

test('card 1: a full request with a photo, no sign-in', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await page.getByRole('heading', { name: 'First — is this an emergency?' }).waitFor();
  await fillToAccess(page, { photo: true });
  await tap(page, 'Send request');
  await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
  const num = await page.locator('.bignum').textContent();
  assert.match(num, /^HR-\d{4}$/);
  const row = srv.store.state.requests.find((r) => r.fields.Title === num);
  assert.equal(row.fields.Apartment, '104');
  assert.equal(row.fields.WorkerCell, '(229) 555-0188');
  assert.equal(row.fields.ProblemType, 'Heating or air conditioning');
  assert.equal(row.fields.PhotoCount, 1);
  assert.equal(row.fields.PhotosMissing, 0);
  assert.equal(row.fields.FormLanguage, 'English');
  assert.match(await page.locator('#banner').textContent(), /TEST VERSION/);
  assert.deepEqual(page.errors, []);
  await ctx.close();
});

test('card 2: entry refused needs a time', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await fillToAccess(page, { entry: 'No' });
  await tap(page, 'Send request');
  await page.getByText("Pick at least one time you're usually there.").waitFor();
  await page.getByLabel('Evenings').check();
  await tap(page, 'Send request');
  await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
  const num = await page.locator('.bignum').textContent();
  const row = srv.store.state.requests.find((r) => r.fields.Title === num);
  assert.equal(row.fields.EntryOK, 'No');
  assert.equal(row.fields.Availability, 'Evenings');
  await ctx.close();
});

test('card 3: the Spanish form from start to finish', async () => {
  const { ctx, page } = await phone({ locale: 'es-US' });
  await page.goto(base);
  await page.getByRole('heading', { name: 'Primero: ¿es una emergencia?' }).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'es');
  await tap(page, 'Nada de esto — reportar un problema');
  await page.getByRole('button', { name: /Apartamentos/ }).click();
  await page.getByRole('button', { name: /Test Apartments – Valdosta/ }).click();
  await page.getByLabel('Número de apartamento').fill('102');
  await tap(page, 'Siguiente');
  await page.getByLabel('Su nombre').fill('José Hernández');
  await page.getByLabel('Su número de celular').fill('2295550134');
  await page.getByLabel('¿En qué obra está trabajando?').fill('Puente de la 231');
  await page.getByLabel('Su supervisor o capataz').fill('Dale Hughes');
  await tap(page, 'Siguiente');
  await page.getByLabel('Tipo de problema').selectOption({ label: 'Refrigerador, estufa, lavadora o secadora' });
  await pill(page, '¿En qué parte de su apartamento?', 'Cocina');
  await page.getByLabel('Cuéntenos qué está pasando').fill('El refrigerador no enfría.');
  await pill(page, '¿Desde cuándo está pasando?', 'Empezó hoy');
  await pill(page, '¿Está empeorando?', 'No sé');
  await tap(page, 'Siguiente');
  await pill(page, '¿Puede entrar mantenimiento si usted no está?', 'Sí');
  await pill(page, '¿Hay mascotas en el apartamento?', 'Ninguna');
  await tap(page, 'Enviar solicitud');
  await page.getByRole('heading', { name: 'Listo. Recibimos su solicitud.' }).waitFor();
  const num = await page.locator('.bignum').textContent();
  const row = srv.store.state.requests.find((r) => r.fields.Title === num);
  assert.equal(row.fields.FormLanguage, 'Spanish');
  assert.equal(row.fields.ProblemType, 'Fridge, stove, washer, or dryer');
  assert.equal(row.fields.ProblemDescription, 'El refrigerador no enfría.');
  assert.equal(row.fields.JobSite, 'Puente de la 231');
  assert.equal(row.fields.Supervisor, 'Dale Hughes');
  assert.deepEqual(page.errors, []);
  await ctx.close();
});

test('card 5: an emergency stops the form; the worker finds their leasing office\'s number', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await tap(page, 'No water');
  await page.getByRole('heading', { name: "Call your leasing office now — don't use this form" }).waitFor();
  await page.getByText("Call your leasing office's emergency line.").waitFor();
  const housing = page.getByRole('link', { name: '(229) 555-0101 (TEST – do not call)' });
  assert.equal(await housing.getAttribute('href'), 'tel:+12295550101');
  await tap(page, "Choose where you're staying to see the number");
  await page.getByRole('button', { name: /Test Apartments – Valdosta/ }).click();
  await page.getByText('Emergency line for Test Apartments – Valdosta:').waitFor();
  const call = page.getByRole('link', { name: 'Call (229) 555-0143 (TEST – do not call)' });
  assert.equal(await call.getAttribute('href'), 'tel:+12295550143');
  assert.equal(await page.getByRole('button', { name: 'Next' }).count(), 0, 'no way forward into the form');
  await tap(page, 'Not an emergency — go back');
  await page.getByRole('heading', { name: 'First — is this an emergency?' }).waitFor();
  await ctx.close();
});

test('from a QR code, the emergency screen shows that property\'s number at once', async () => {
  const { ctx, page } = await phone();
  await page.goto(base + '/?p=test-mgm');
  await tap(page, 'I smell gas');
  const call = page.getByRole('link', { name: 'Call (334) 555-0177 (TEST – do not call)' });
  assert.equal(await call.getAttribute('href'), 'tel:+13345550177');
  await page.getByText('If you smell gas, leave the apartment first, then call.').waitFor();
  await ctx.close();
});

test('a property with no after-hours number still points the worker somewhere', async () => {
  const { ctx, page } = await phone();
  await page.goto(base + '/?p=oak-tlh');
  await tap(page, 'No electricity');
  await page.getByText("Call your leasing office's emergency line.").waitFor();
  await page.getByRole('link', { name: '(229) 555-0101 (TEST – do not call)' }).waitFor();
  assert.equal(await page.getByRole('button', { name: "Choose where you're staying to see the number" }).count(), 0);
  await ctx.close();
});

test('job site is required on "Who should they contact?"', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await tap(page, 'None of these — report a problem');
  await page.getByRole('button', { name: /Apartments/ }).click();
  await page.getByRole('button', { name: /Test Apartments – Valdosta/ }).click();
  await page.getByLabel('Apartment number').fill('104');
  await tap(page, 'Next');
  await page.getByLabel('Your name').fill('Marcus Bell');
  await page.getByLabel('Your cell number').fill('2295550188');
  await tap(page, 'Next');
  await page.getByText('Enter your job site.').waitFor();
  await page.getByText('(optional)').waitFor();
  await ctx.close();
});

test('Virginia and Indiana appear in the property list', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await tap(page, 'None of these — report a problem');
  await page.getByRole('button', { name: /Apartments/ }).click();
  await page.getByText('Virginia', { exact: true }).waitFor();
  await page.getByText('Indiana', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Maple Court Apartments/ }).waitFor();
  await ctx.close();
});

test('emergency words in the description bring back the call screen', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await tap(page, 'None of these — report a problem');
  await page.getByRole('button', { name: /Apartments/ }).click();
  await page.getByRole('button', { name: /Test Apartments – Valdosta/ }).click();
  await page.getByLabel('Apartment number').fill('106');
  await tap(page, 'Next');
  await page.getByLabel('Your name').fill('Ray Simmons');
  await page.getByLabel('Your cell number').fill('3345550163');
  await page.getByLabel('What job site are you on?').fill('Hwy 231 bridge');
  await tap(page, 'Next');
  await page.getByLabel('Type of problem').selectOption({ label: 'Fridge, stove, washer, or dryer' });
  await pill(page, 'Where in your apartment?', 'Kitchen');
  await page.getByLabel("Tell us what's happening").fill('Stove, I smell gas when it lights.');
  await pill(page, 'How long has this been going on?', 'Started today');
  await pill(page, 'Is it getting worse?', 'No');
  await tap(page, 'Next');
  await page.getByRole('heading', { name: 'This might be an emergency' }).waitFor();
  await page.getByText('You wrote "smell gas"').waitFor();
  await page.getByRole('link', { name: 'Call (229) 555-0143 (TEST – do not call)' }).waitFor();
  await tap(page, "It's not an emergency — continue");
  await page.getByRole('heading', { name: 'Getting in' }).waitFor();
  await pill(page, "Can maintenance come in if you're not there?", 'Yes');
  await pill(page, 'Any pets in the apartment?', 'None');
  await tap(page, 'Send request');
  await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
  const num = await page.locator('.bignum').textContent();
  assert.equal(srv.store.state.requests.find((r) => r.fields.Title === num).fields.PossibleEmergency, 'smell gas');
  await ctx.close();
});

test('card 7: a QR code fills in the property', async () => {
  const { ctx, page } = await phone();
  await page.goto(base + '/?p=test-vld');
  await tap(page, 'None of these — report a problem');
  await page.getByText('Test Apartments – Valdosta').waitFor();
  await fillToAccess(page, { qr: true, started: true });
  await tap(page, 'Send request');
  await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
  const num = await page.locator('.bignum').textContent();
  assert.equal(srv.store.state.requests.find((r) => r.fields.Title === num).fields.PropertyCode, 'test-vld');
  await ctx.close();
});

test('a QR code for a place not on the list says so', async () => {
  const { ctx, page } = await phone();
  await page.goto(base + '/?p=nowhere');
  await tap(page, 'None of these — report a problem');
  await page.getByText("This sign's place isn't on our list.").waitFor();
  await ctx.close();
});

test('card 8: no signal keeps the answers and sends when signal returns', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await fillToAccess(page);
  await ctx.setOffline(true);
  await page.getByText('No signal. Your answers are saved.').first().waitFor();
  await tap(page, 'Send request');
  await page.getByText('Not sent yet — no signal.').waitFor();
  const before = srv.store.state.requests.length;
  await ctx.setOffline(false);
  await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
  assert.equal(srv.store.state.requests.length, before + 1);
  await ctx.close();
});

test('three failed sends offer "Copy my request" with the housing number', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await fillToAccess(page);
  srv.ctl.failNext = 3;
  for (let i = 0; i < 3; i++) {
    await tap(page, 'Send request');
    await page.getByText('Not sent yet. Try again in a minute.').waitFor();
  }
  await page.getByText('Still not sending. Copy your request and text it to (229) 555-0101').waitFor();
  await page.getByRole('button', { name: 'Copy my request' }).waitFor();
  await tap(page, 'Send request');
  await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
  await ctx.close();
});

test('an unsent request is offered again when the link is reopened', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await fillToAccess(page);
  srv.ctl.failNext = 1;
  await tap(page, 'Send request');
  await page.getByText('Not sent yet. Try again in a minute.').waitFor();
  await page.goto(base);
  await page.getByRole('heading', { name: /wasn't sent/ }).waitFor();
  await tap(page, 'Send now');
  await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
  await ctx.close();
});

test('a returning worker confirms in one tap', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await fillToAccess(page);
  await tap(page, 'Send request');
  await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
  await tap(page, 'Report another problem');
  await tap(page, 'None of these — report a problem');
  await page.getByRole('heading', { name: 'Is this still you?' }).waitFor();
  await page.getByText('Step 1 of 3').waitFor();
  await ctx.close();
});

test('when the property list will not load, the worker types the place', async () => {
  srv.ctl.propertiesDown = true;
  const { ctx, page } = await phone();
  try {
    await page.goto(base);
    await tap(page, 'None of these — report a problem');
    await page.getByLabel('Name of your apartments').fill('Pine Court');
    await page.getByLabel('Apartment number').fill('3');
    await tap(page, 'Next');
    await page.getByRole('heading', { name: 'Who should they contact?' }).waitFor();
  } finally { srv.ctl.propertiesDown = false; await ctx.close(); }
});

test('dry-run results page lists what arrived, and only with the key', async () => {
  const { ctx, page } = await phone();
  await page.goto(base);
  await fillToAccess(page);
  await tap(page, 'Send request');
  await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
  const num = await page.locator('.bignum').textContent();
  await page.goto(base + '/dry-run.html?key=local-dry-run-key');
  await page.getByRole('heading', { name: new RegExp(num) }).waitFor();
  await page.getByText('I-85 widening').first().waitFor();
  await page.goto(base + '/dry-run.html?key=wrong-key-wrong-key');
  await page.getByText('Not available: wrong key').waitFor();
  assert.deepEqual(page.errors.filter((e) => !/404/.test(e)), []);
  await ctx.close();
});

test('a second worker reporting the same problem shows as a repeat to follow up', async () => {
  const send = async () => {
    const { ctx, page } = await phone();
    await page.goto(base);
    await fillToAccess(page);   // apartment 104, heating or air conditioning
    await tap(page, 'Send request');
    await page.getByRole('heading', { name: 'Got it. Your request is in.' }).waitFor();
    const num = await page.locator('.bignum').textContent();
    await ctx.close();
    return num;
  };
  const first = await send();
  const second = await send();
  // Earlier tests on this server already reported AC in apartment 104, so the original is the
  // oldest open report of that problem, and both of these point at it.
  const rows = srv.store.state.requests;
  const rep = rows.find((r) => r.fields.Title === second);
  const orig = rows.find((r) => r.fields.Title === rep.fields.RepeatOf);
  assert.ok(orig, 'the repeat points at an existing request');
  assert.equal(orig.fields.RepeatOf, undefined, 'the original is not itself a repeat');
  assert.equal(orig.fields.RepeatKey, rep.fields.RepeatKey);
  assert.ok(Number(orig.id) < Number(rows.find((r) => r.fields.Title === first).id) || orig.fields.Title === first);
  assert.ok(orig.fields.RepeatCount >= 1);
  const { ctx, page } = await phone();
  await page.goto(base + '/dry-run.html?key=local-dry-run-key');
  await page.getByText(`Repeat of ${orig.fields.Title}`).first().waitFor();
  await page.getByText(/Reported again \d+ times?: follow up/).first().waitFor();
  await ctx.close();
});

test('the form shows "Not ready" while the numbers are placeholders', async () => {
  const s2 = createServer({ dataDir: null, config: { housingNumber: '(XXX) XXX-XXXX', testMode: false } });
  await new Promise((r) => s2.server.listen(0, r));
  const { ctx, page } = await phone();
  await page.goto(`http://localhost:${s2.server.address().port}`);
  await page.getByText('Not ready for workers').waitFor();
  await ctx.close(); s2.server.close();
});
