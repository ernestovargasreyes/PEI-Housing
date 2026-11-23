'use strict';
/*
 * Run before the link goes to real crews (the January pilot), not for the trial week:
 *
 *   npm run check:launch
 *
 * Fails while the housing number is a placeholder or test mode is still on.
 * Emergency numbers come from each property's After-Hours Phone in SharePoint; check those
 * by hand: every active property needs one (app/README.md, before the pilot).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'web', 'config.js'), 'utf8'), sandbox);
const c = sandbox.window.PEI_CONFIG || {};
const problems = [];
const isNumber = (v) => typeof v === 'string' && !/x/i.test(v) && v.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').length === 10;

if (!isNumber(c.housingNumber)) problems.push(`housingNumber is not a real number: "${c.housingNumber}"`);
if (c.testMode) problems.push('testMode is still on: numbers show "TEST – do not call"');
const today = new Date().toISOString().slice(0, 10);
if (!(c.holidays || []).some((d) => d >= today)) problems.push('holidays has no upcoming dates: the confirmation may name a day nobody reviews the queue');

if (problems.length) {
  console.error('Not ready to launch:\n' + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log('config.js is ready to launch.');
