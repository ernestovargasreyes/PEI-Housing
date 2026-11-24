'use strict';
/*
 * The request a worker sends, how it is checked, and how it is stored.
 *
 * The form sends answers as option indexes (so the same request reads the same in
 * English and Spanish). The queue stores the English label for each answer, because
 * Tonya, Jordan and the forward email all work in English. The worker's own words
 * (description, notes) are stored exactly as typed, in whatever language they used.
 *
 * Option order here must match web/i18n.js. test/schema.test.js checks that it does.
 */

const CATEGORIES = [
  // [English label shown in the queue, stored code] — code list from the Notion project page
  ['Water leak, drip, or flooding', 'plumbing'],
  ['Toilet, sink, shower, or drain', 'plumbing'],
  ['No hot water', 'plumbing'],
  ['Heating or air conditioning', 'hvac'],
  ['Lights, outlets, or power', 'electrical'],
  ['Fridge, stove, washer, or dryer', 'appliance'],
  ['Door, lock, key, or garage', 'locks_access'],
  ['Bugs, mice, or other pests', 'pest'],
  ['Internet, cable, or TV', 'internet_cable'],
  ['Damage to walls, floors, or ceiling', 'structural'],
  ['Cleaning or trash', 'cleaning'],
  ['Yard, grounds, or snow', 'landscaping'],
  ['Furniture or household items', 'furniture'],
  ['Something else', 'other'],
];
const WHERES = ['Kitchen', 'Bathroom', 'Bedroom', 'Living area', 'Laundry', 'Outside', 'The whole place'];
const LONGS = ['Started today', 'A few days', 'More than a week'];
const WORSES = ['Yes', 'No', 'Not sure'];
const YESNO = ['Yes', 'No'];
const TIMES = ['Weekday mornings', 'Weekday afternoons', 'Evenings', 'Weekends', 'Anytime is fine'];
const PETS = ['None', 'Dog', 'Cat', 'Other'];
const STATES = ['GA', 'FL', 'AL', 'TN', 'VA', 'IN'];

const STATUSES = ['New', 'Needs Info', 'Sent to Property', 'Fixed', 'Closed', 'Duplicate'];

const LIMITS = { apt: 30, name: 80, site: 80, supervisor: 80, freeName: 80, freeCity: 60, desc: 2000, notes: 1000, petOther: 40, possibleEmergency: 200 };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
/* Strip control characters (keeps newlines and tabs in long text) and trim. */
const clean = (v, multiline) => str(v).replace(multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, '').trim();
const idx = (v, arr) => {
  const n = typeof v === 'number' ? v : str(v).trim() === '' ? NaN : Number(v);
  return Number.isInteger(n) && n >= 0 && n < arr.length ? n : null;
};

/* A cell number to 10 digits. A leading 1 or +1 is dropped. Returns null if it isn't 10 digits. */
function normalizeCell(v) {
  let d = str(v).replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  return d.length === 10 ? d : null;
}
const formatCell = (d) => `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
/* A property's after-hours number as typed in the list, to a display form, or '' if it isn't 10 digits. */
const formatPhone = (v) => { const d = normalizeCell(v); return d ? formatCell(d) : ''; };

/*
 * Check a submitted request. Returns { ok: true, value } with clean, typed values,
 * or { ok: false, fields: [names that failed] }.
 * `knownCodes` is the set of active property codes; an unknown code is treated as
 * "my place isn't listed" only if the worker also typed a name, otherwise it fails.
 */
function validateRequest(body, knownCodes) {
  const b = body && typeof body === 'object' ? body : {};
  const bad = [];
  const v = {};

  v.clientId = str(b.clientId).trim();
  if (!UUID.test(v.clientId)) bad.push('clientId');
  v.deviceId = str(b.deviceId).trim();
  if (!UUID.test(v.deviceId)) bad.push('deviceId');
  v.lang = b.lang === 'es' ? 'es' : 'en';

  v.propertyCode = clean(b.code).toLowerCase();
  v.freeName = clean(b.freeName);
  v.freeCity = clean(b.freeCity);
  if (v.propertyCode && !(knownCodes && knownCodes.has(v.propertyCode))) v.propertyCode = '';
  if (!v.propertyCode && !v.freeName) bad.push('code');
  if (v.propertyCode) { v.freeName = ''; v.freeCity = ''; }

  v.apt = clean(b.apt);
  if (!v.apt) bad.push('apt');
  v.name = clean(b.name);
  if (!v.name) bad.push('name');
  const cell = normalizeCell(b.cell);
  if (!cell) bad.push('cell');
  v.cell = cell ? formatCell(cell) : '';
  // Job site is required and supervisor is optional: Matt's answers, 2026-11-23 (decisions.md).
  v.site = clean(b.site);
  if (!v.site) bad.push('site');
  v.supervisor = clean(b.supervisor);

  v.cat = idx(b.cat, CATEGORIES); if (v.cat === null) bad.push('cat');
  v.where = idx(b.where, WHERES); if (v.where === null) bad.push('where');
  v.desc = clean(b.desc, true); if (!v.desc) bad.push('desc');
  v.long = idx(b.long, LONGS); if (v.long === null) bad.push('long');
  v.worse = idx(b.worse, WORSES); if (v.worse === null) bad.push('worse');
  v.entry = idx(b.entry, YESNO); if (v.entry === null) bad.push('entry');
  const times = Array.isArray(b.times) ? b.times.map((t) => idx(t, TIMES)) : [];
  if (times.some((t) => t === null)) bad.push('times');
  v.times = [...new Set(times.filter((t) => t !== null))].sort();
  // Times are required only when maintenance may not enter without the worker (decisions.md).
  if (v.entry === 1 && !v.times.length) bad.push('times');
  v.pets = idx(b.pets, PETS); if (v.pets === null) bad.push('pets');
  v.petOther = v.pets === 3 ? clean(b.petOther) : '';
  v.notes = clean(b.notes, true);
  v.possibleEmergency = clean(b.possibleEmergency);
  const pe = Number(b.photosExpected);
  v.photosExpected = Number.isInteger(pe) && pe >= 0 && pe <= 5 ? pe : 0;

  for (const [k, max] of Object.entries(LIMITS)) if (v[k] && v[k].length > max) bad.push(k);

  return bad.length ? { ok: false, fields: [...new Set(bad)] } : { ok: true, value: v };
}

/* The row written to the SharePoint Requests list. Field names are the list's internal names. */
function toListFields(v, extra = {}) {
  return {
    Status: 'New',
    ArrivedBy: 'Form',
    ClientId: v.clientId,
    DeviceId: v.deviceId,
    FormLanguage: v.lang === 'es' ? 'Spanish' : 'English',
    PropertyCode: v.propertyCode,
    PlaceNotListed: v.propertyCode ? '' : [v.freeName, v.freeCity].filter(Boolean).join(', '),
    Apartment: v.apt,
    WorkerName: v.name,
    WorkerCell: v.cell,
    JobSite: v.site,
    Supervisor: v.supervisor,
    ProblemType: CATEGORIES[v.cat][0],
    CategoryCode: CATEGORIES[v.cat][1],
    WhereInUnit: WHERES[v.where],
    ProblemDescription: v.desc,
    Started: LONGS[v.long],
    GettingWorse: WORSES[v.worse],
    EntryOK: YESNO[v.entry],
    Availability: v.times.length ? v.times.map((t) => TIMES[t]).join(', ') : v.entry === 0 ? 'Any time (OK to enter)' : '',
    Pets: PETS[v.pets] + (v.petOther ? ` (${v.petOther})` : ''),
    AccessNotes: v.notes,
    PossibleEmergency: v.possibleEmergency,
    PhotoCount: extra.photoCount ?? 0,
    PhotosMissing: Math.max(0, v.photosExpected - (extra.photoCount ?? 0)),
    PhotoFolder: v.clientId,
    RepeatKey: repeatKey(v),
    ActivityLog: `${extra.now || new Date().toISOString()}  Arrived by form${v.lang === 'es' ? ' (Spanish)' : ''}`,
  };
}

const requestNumber = (itemId) => `HR-${1000 + Number(itemId)}`;

/*
 * Repeat detection (decided 2026-11-24): the coordinators follow up with a property only when
 * the same problem is reported again. A request repeats an open one when it is for the same
 * place, the same apartment and the same kind of problem (category code, so "toilet" and
 * "no hot water" both count as plumbing). Apartment numbers are compared loosely:
 * "Apt 214", "#214" and "214" are the same apartment.
 */
const OPEN_STATUSES = ['New', 'Needs Info', 'Sent to Property'];
function normalizeApt(v) {
  return String(v || '').toLowerCase()
    .replace(/\b(apartamento|apartment|apto|apt|unit|unidad|no|num|number|n[uú]mero)\b\.?/g, ' ')
    .replace(/[^\p{L}\p{N}]/gu, '');
}
function repeatKey(v) {
  const place = v.propertyCode || 'free:' + String(v.freeName || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  return `${place}|${normalizeApt(v.apt)}|${CATEGORIES[v.cat][1]}`;
}

module.exports = {
  CATEGORIES, WHERES, LONGS, WORSES, YESNO, TIMES, PETS, STATES, STATUSES, LIMITS, UUID,
  validateRequest, toListFields, normalizeCell, formatCell, formatPhone, requestNumber,
  normalizeApt, repeatKey, OPEN_STATUSES,
};
