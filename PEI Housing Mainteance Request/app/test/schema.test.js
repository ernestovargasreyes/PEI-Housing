'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../api/src/lib/schema');
const { makeStrings, matchWords } = require('../web/i18n.js');

const known = new Set(['test-vld']);
const good = (o = {}) => ({
  clientId: '3b241101-e2bb-4255-8caf-4136c566a962', deviceId: '9a7b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d', lang: 'en',
  code: 'test-vld', apt: '104', name: 'Marcus Bell', cell: '(229) 555-0188', site: '',
  cat: 3, where: 2, desc: 'AC blows warm air.', long: 0, worse: 0, entry: 0, times: [], pets: 0, notes: '',
  ...o,
});

test('a complete request passes and is normalised', () => {
  const r = S.validateRequest(good({ cell: '+1 229-555-0188', apt: '  104 ' }), known);
  assert.equal(r.ok, true);
  assert.equal(r.value.cell, '(229) 555-0188');
  assert.equal(r.value.apt, '104');
});

test('each required answer is reported when missing', () => {
  const r = S.validateRequest({ clientId: 'nope' }, known);
  assert.equal(r.ok, false);
  for (const f of ['clientId', 'deviceId', 'code', 'apt', 'name', 'cell', 'cat', 'where', 'desc', 'long', 'worse', 'entry', 'pets']) {
    assert.ok(r.fields.includes(f), `expected ${f} in ${r.fields}`);
  }
});

test('times are required only when entry is refused', () => {
  assert.equal(S.validateRequest(good({ entry: 0, times: [] }), known).ok, true);
  const r = S.validateRequest(good({ entry: 1, times: [] }), known);
  assert.deepEqual(r.fields, ['times']);
  assert.equal(S.validateRequest(good({ entry: 1, times: [2, 3, 2] }), known).value.times.join(), '2,3');
});

test('cell numbers must have 10 digits after a leading 1', () => {
  assert.equal(S.normalizeCell('1-229-555-0134'), '2295550134');
  assert.equal(S.normalizeCell('555-0134'), null);
  assert.deepEqual(S.validateRequest(good({ cell: '229555013' }), known).fields, ['cell']);
});

test('an unknown property code needs a typed place name', () => {
  assert.deepEqual(S.validateRequest(good({ code: 'gone-xyz' }), known).fields, ['code']);
  const r = S.validateRequest(good({ code: 'gone-xyz', freeName: 'Pine Court', freeCity: 'Albany' }), known);
  assert.equal(r.ok, true);
  assert.equal(r.value.propertyCode, '');
  assert.equal(S.toListFields(r.value).PlaceNotListed, 'Pine Court, Albany');
});

test('a known code drops any typed name', () => {
  const r = S.validateRequest(good({ freeName: 'stray' }), known);
  assert.equal(r.value.freeName, '');
});

test('length limits match the form', () => {
  assert.deepEqual(S.validateRequest(good({ desc: 'x'.repeat(2001) }), known).fields, ['desc']);
  assert.equal(S.validateRequest(good({ desc: 'x'.repeat(2000) }), known).ok, true);
});

test('control characters are stripped, newlines kept in long text', () => {
  const r = S.validateRequest(good({ name: 'Ana\u0000 Ruiz', desc: 'line one\nline two\u0007' }), known);
  assert.equal(r.value.name, 'Ana Ruiz');
  assert.equal(r.value.desc, 'line one\nline two');
});

test('stored fields use English labels and the category code', () => {
  const r = S.validateRequest(good({ lang: 'es', desc: 'El aire sale caliente', entry: 1, times: [2, 3], pets: 3, petOther: 'Loro' }), known);
  const f = S.toListFields(r.value, { photoCount: 1, now: '2026-12-07T10:00:00Z' });
  assert.equal(f.ProblemType, 'Heating or air conditioning');
  assert.equal(f.CategoryCode, 'hvac');
  assert.equal(f.FormLanguage, 'Spanish');
  assert.equal(f.ProblemDescription, 'El aire sale caliente');
  assert.equal(f.EntryOK, 'No');
  assert.equal(f.Availability, 'Evenings, Weekends');
  assert.equal(f.Pets, 'Other (Loro)');
  assert.equal(f.Status, 'New');
  assert.equal(f.ArrivedBy, 'Form');
  assert.match(f.ActivityLog, /^2026-12-07T10:00:00Z {2}Arrived by form \(Spanish\)$/);
});

test('request numbers come from the list item ID', () => {
  assert.equal(S.requestNumber(42), 'HR-1042');
});

test('form option lists line up with the server in both languages', () => {
  const T = makeStrings('(229) 555-0100', '(229) 555-0101');
  assert.deepEqual(T.en.cats, S.CATEGORIES.map((c) => c[0]));
  assert.deepEqual(T.en.wheres, S.WHERES);
  assert.deepEqual(T.en.longs, S.LONGS);
  assert.deepEqual(T.en.worses, S.WORSES);
  assert.deepEqual(T.en.yesno, S.YESNO);
  assert.deepEqual(T.en.times, S.TIMES);
  assert.deepEqual(T.en.pets, S.PETS);
  for (const k of ['cats', 'wheres', 'longs', 'worses', 'yesno', 'times', 'pets', 'conds']) {
    assert.equal(T.es[k].length, T.en[k].length, `Spanish ${k} has a different number of options`);
  }
  const missing = Object.keys(T.en).filter((k) => !(k in T.es));
  assert.deepEqual(missing, [], 'every English string has a Spanish one');
});

test('emergency words match in either language and keep the longest phrase', () => {
  assert.deepEqual(matchWords('I smell gas in the kitchen'), ['smell gas']);
  assert.deepEqual(matchWords('Huele a gas cerca de la estufa'), ['huele a gas']);
  assert.deepEqual(matchWords('the gasket is loose'), []);
  assert.deepEqual(matchWords('No water since this morning!'), ['no water']);
});
