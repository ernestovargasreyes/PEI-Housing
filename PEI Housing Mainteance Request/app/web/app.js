/*
 * Plateau Excavation housing — worker maintenance request form.
 *
 * Built from prototype/worker-form.html. Screens, copy and behaviour follow
 * journey-worker-form.md, states-worker-form.md and accessibility-worker-form.md.
 * What changed from the prototype: answers are sent to /api/requests and photos to
 * /api/photos; the property list comes from /api/properties; numbers come from config.js;
 * the demo controls and the coordinator queue are gone (the queue is the SharePoint list).
 */
(() => {
'use strict';

const CFG = window.PEI_CONFIG || {};
const PLACEHOLDER = /X/i;
const notReady = !CFG.housingNumber || PLACEHOLDER.test(CFG.housingNumber);
const testTag = CFG.testMode ? ' (TEST – do not call)' : '';
const HOUSING = (CFG.housingNumber || '') + testTag;
const telHref = (n) => { let d = String(n).replace(/\D/g, ''); if (d.length === 10) d = '1' + d; return 'tel:+' + d; };
const T = window.PEI_I18N.makeStrings(HOUSING);
const matchWords = window.PEI_I18N.matchWords;
const STATES = { GA: 'Georgia', FL: 'Florida', AL: 'Alabama', TN: 'Tennessee', VA: 'Virginia', IN: 'Indiana' };
const HOUR = 3600e3, DAY = 24 * HOUR;
const SEND_TIMEOUT = 30e3, SLOW_AFTER = 10e3, PHOTO_WAIT = 30e3, MAX_PHOTOS = 5, PER_HOUR = 5;

/* ── storage (wrapped: may be unavailable in private browsing or in-app browsers) ── */
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('pei.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('pei.' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('pei.' + k); } catch {} },
};
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));
const deviceId = store.get('device') || (() => { const id = uuid(); store.set('device', id); return id; })();

const blank = () => ({ code: '', freeName: '', freeCity: '', apt: '', name: '', cell: '', site: '', supervisor: '', cat: '', where: '', desc: '', long: '', worse: '', entry: '', times: [], pets: '', petOther: '', notes: '', website: '' });
let S = {
  lang: (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en',
  screen: 'emergency', d: blank(), clientId: uuid(), photos: [], fromQR: false, qrUnknown: false,
  returning: false, editProfile: false, errors: {}, tapped: -1, matched: '', maybeDone: false,
  attempts: 0, failKind: '', sending: false, sendNote: '', result: null, offline: !navigator.onLine, history: [],
};
let PROPS = [];            // [{ code, name, city, st }]
let propsFailed = false;   // the list could not be loaded: the worker types the name instead

const L = () => T[S.lang];
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const prop = (code) => PROPS.find((p) => p.code === code);
const propName = () => (S.d.code && prop(S.d.code) ? prop(S.d.code).name : (S.d.freeName || ''));
const ICON = {
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v4" stroke-linecap="round"/><circle cx="12" cy="17.5" r="1" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
};
const big = (svg, color) => `<span class="${color}">${svg.replace('aria-hidden', 'width="40" height="40" aria-hidden')}</span>`;

/* ── announcements ── */
function say(msg, urgent) {
  const el = urgent ? $('#liveAssert') : $('#livePolite');
  el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 40);
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; t.setAttribute('aria-hidden', 'true');
  document.body.appendChild(t); setTimeout(() => t.remove(), 5000); say(msg);   // long enough to read twice
}

/* ── time helpers ── */
const loc = () => (S.lang === 'es' ? 'es-US' : 'en-US');
const fmtTime = (ts) => new Date(ts).toLocaleTimeString(loc(), { hour: 'numeric', minute: '2-digit' }).toLowerCase();
const fmtDate = (ts) => new Date(ts).toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short' });
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* The next day someone reviews the queue: not a weekend, not on the holiday list. */
function reviewDay() {
  const holidays = new Set(CFG.holidays || []);
  const d = new Date();
  do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6 || holidays.has(isoDay(d)));
  return d.toLocaleDateString(loc(), { weekday: 'long' });
}

/* ── steps ── */
const skipWho = () => S.returning && !S.editProfile;
function stepOf(scr) {
  const seq = skipWho() ? ['where', 'what', 'access'] : ['where', 'who', 'what', 'access'];
  const i = seq.indexOf(scr === 'notlisted' ? 'where' : scr);
  return i < 0 ? null : [i + 1, seq.length];
}

/* ── persistence ── */
const photoMeta = () => S.photos.filter((p) => p.status === 'done').map((p) => ({ slot: p.slot, thumb: p.thumb, status: 'done' }));
function saveDraft() {
  if (['emergency', 'call', 'done'].includes(S.screen)) return;
  store.set('draft', {
    d: S.d, dName: propName(), clientId: S.clientId, screen: S.screen === 'maybe' ? 'what' : S.screen, at: Date.now(),
    returning: S.returning, editProfile: S.editProfile, maybeDone: S.maybeDone, matched: S.matched,
    photos: photoMeta(), photosPending: S.photos.filter((p) => p.status !== 'done').length,
  });
}

/* ── rendering ── */
/* The dark "hero" band at the top of each step screen and the first screen: step bar, step
   count, heading. The call, possible-emergency and confirmation screens keep their own look. */
function head(title, scr, sub) {
  const st = stepOf(scr);
  // A bar of segments as well as the words: easier to read at a glance than "Step 2 of 4".
  const bar = st ? `<div class="steps" aria-hidden="true">${Array.from({ length: st[1] }, (_, i) => `<span class="${i < st[0] ? 'on' : ''}${i === st[0] - 1 ? ' now' : ''}"></span>`).join('')}</div>` : '';
  const inner = `${bar}${st ? `<p class="step" id="stepText">${esc(L().step(st[0], st[1]))}</p>` : ''}<h1 tabindex="-1" ${st ? 'aria-describedby="stepText"' : ''}>${esc(title)}</h1>${sub ? `<p class="lede">${esc(sub)}</p>` : ''}`;
  return st || scr === 'emergency' ? `<div class="hero">${inner}</div>` : inner;
}
function errLine(id, msg) { return msg ? `<p class="err" id="${id}-err">${ICON.alert}<span>${esc(msg)}</span></p>` : ''; }
function radios(name, labels, val, legend, opts = {}) {
  const e = S.errors[name];
  return `<fieldset class="field" ${e ? `aria-invalid="true" aria-describedby="${name}-err"` : ''}>
    <legend>${esc(legend)}</legend>
    <div class="pills">${labels.map((lab, i) => `
      <label class="pill"><input type="radio" name="${name}" value="${i}" ${String(val) === String(i) ? 'checked' : ''} data-k="${name}" ${i === 0 ? `id="f-${name}"` : ''}><span>${esc(lab)}</span></label>`).join('')}
    </div>${errLine(name, e)}${opts.after || ''}</fieldset>`;
}
function input(k, label, attrs = '', hint = '', optional = false) {
  const e = S.errors[k];
  const desc = [hint ? `${k}-hint` : '', e ? `${k}-err` : ''].filter(Boolean).join(' ');
  return `<div class="field"><label class="label" for="f-${k}">${esc(label)}${optional ? ` <span class="opt">${esc(L().opt)}</span>` : ''}</label>
    <input class="input" id="f-${k}" data-k="${k}" value="${esc(S.d[k])}" ${attrs} ${e ? 'aria-invalid="true"' : ''} ${desc ? `aria-describedby="${desc}"` : ''}>
    ${errLine(k, e)}${hint ? `<p class="hint" id="${k}-hint">${esc(hint)}</p>` : ''}</div>`;
}
/* Emergencies are handled by the property (Matt, 2026-11-23), so the number shown is the
   after-hours line of the place the worker is staying: known from the QR code, the phone's
   last request, or by choosing it here. The call button is a real tel: link with the number
   in its visible label, so a phone that cannot place calls still shows the number to dial. */
const emergency = () => { const p = prop(S.d.code); return p && p.ah ? { name: p.name, num: p.ah, shown: p.ah + testTag } : null; };
function callBlock() {
  const l = L(), e = emergency();
  const main = e
    ? `<p>${esc(l.k2b(e.name))}</p><a class="btn btn-danger" id="callLink" href="${esc(telHref(e.num))}">${esc(l.k3(e.shown))}</a>`
    : `<p><strong>${esc(l.k3none)}</strong></p>${!S.d.code && PROPS.length ? `<button class="btn btn-secondary" id="callPick" data-act="pick">${esc(l.kPick)}</button>` : ''}`;
  const housing = notReady ? '' : `<p>${esc(l.kHousing)} <a href="${esc(telHref(CFG.housingNumber))}">${esc(HOUSING)}</a></p>`;
  return main + housing;
}

const SCREENS = {
  emergency() {
    return `<div class="body">${head(L().e1, 'emergency', L().e2)}
      <div class="list">${L().conds.map((c, i) => `<button class="row" data-act="emerg" data-i="${i}"><span class="grow">${esc(c)}</span>${ICON.chev}</button>`).join('')}</div></div>
      <div class="foot"><button class="btn btn-secondary" data-act="none">${esc(L().none)}</button></div>`;
  },
  call() {
    return `<div class="body"><div class="emerg-head">${ICON.alert}${head(L().k1)}</div>
      <p>${esc(L().k2)} <strong>${esc(L().conds[S.tapped])}</strong></p>
      ${S.tapped === 3 ? `<p><strong>${esc(L().k5)}</strong></p>` : ''}
      ${callBlock()}
      <p>${esc(L().k4)}</p></div>
      <div class="foot noline"><button class="linkbtn" data-act="notEmerg">${esc(L().k6)}</button></div>`;
  },
  where() {
    const l = L();
    if (S.returning && !S.editProfile) {
      const last = store.get('last');
      return `<div class="body">${head(l.w12, 'where')}
        <div class="card"><dl><dt>${esc(l.wWhere)}</dt><dd>${esc(l.aptPrefix)} ${esc(S.d.apt)}, ${esc(propName())}</dd>
          <dt>${esc(l.wName)}</dt><dd>${esc(S.d.name)}</dd><dt>${esc(l.wCell)}</dt><dd>${esc(S.d.cell)}</dd></dl>
          <button class="btn btn-secondary" data-act="editProfile">${esc(l.change)}</button></div>
        <p class="hint">${esc(l.w14)}</p>
        ${last && l.cats[last.cat] ? `<div class="note ok">${ICON.check}<p><strong>${esc(l.w15(last.num))}</strong>${esc(l.w15b(l.cats[last.cat], fmtDate(last.at)))}</p></div>` : ''}</div>
        <div class="foot"><button class="btn btn-primary" data-act="next">${esc(l.w16)}</button></div>`;
    }
    const p = prop(S.d.code); const e = S.errors.code;
    let propField;
    if (propsFailed) {
      // The list did not load: the worker types the place, and a coordinator matches it.
      propField = `${input('freeName', l.w8, 'maxlength="80" autocomplete="off"', l.w9)}${input('freeCity', l.w8c, 'maxlength="60" autocomplete="off"', '', true)}`;
    } else if (S.fromQR && p) {
      propField = `<div class="card row-card"><div class="grow"><strong>${esc(p.name)}</strong><br><span class="hint">${esc(p.city)}${p.st ? ', ' + esc(STATES[p.st] || p.st) : ''}</span></div><button class="btn btn-quiet auto" data-act="pick">${esc(l.change)}</button></div>`;
    } else {
      propField = `<div class="field"><span class="label" id="propLabel">${esc(l.w2)}</span>
        ${S.qrUnknown ? `<div class="note alert">${ICON.alert}<p>${esc(l.w7)}</p></div>` : ''}
        ${S.goneNote ? `<div class="note alert">${ICON.alert}<p>${esc(S.goneNote)}</p></div>` : ''}
        <button class="pickbtn" id="f-code" data-act="pick" aria-haspopup="dialog" aria-labelledby="propLabel propValue" ${e ? 'aria-invalid="true" aria-describedby="code-err"' : ''}>
          <span id="propValue" class="${p || S.d.freeName ? '' : 'ph'}">${esc(p ? p.name : (S.d.freeName || l.w3))}</span>${ICON.down}</button>${errLine('code', e)}</div>`;
    }
    return `<div class="body">${head(l.w1, 'where')}${propField}
      ${input('apt', l.w4, `placeholder="${esc(l.w5)}" autocomplete="off" maxlength="30"`)}</div>
      <div class="foot"><button class="btn btn-primary" data-act="next">${esc(l.next)}</button></div>`;
  },
  notlisted() {
    const l = L();
    return `<div class="body">${head(l.w1, 'where')}
      ${input('freeName', l.w8, 'maxlength="80" autocomplete="off"', l.w9)}${input('freeCity', l.w8c, 'maxlength="60" autocomplete="off"', '', true)}</div>
      <div class="foot"><button class="btn btn-primary" data-act="notlistedNext">${esc(l.next)}</button></div>`;
  },
  who() {
    const l = L();
    return `<div class="body">${head(l.h1, 'who')}
      ${input('name', l.h2, 'autocomplete="name" maxlength="80"')}
      ${input('cell', l.h3, 'type="tel" inputmode="tel" autocomplete="tel-national" maxlength="20"', l.h4)}
      ${input('site', l.h5, 'maxlength="80"')}
      ${input('supervisor', l.h9, 'maxlength="80" autocomplete="off"', '', true)}</div>
      <div class="foot"><button class="btn btn-primary" data-act="next">${esc(l.next)}</button></div>`;
  },
  what() {
    const l = L(); const ec = S.errors.cat; const ed = S.errors.desc;
    const n = S.d.desc.length;
    return `<div class="body">${head(l.q1, 'what')}
      <div class="field"><label class="label" for="f-cat">${esc(l.q2)}</label>
        <select class="input" id="f-cat" data-k="cat" ${ec ? 'aria-invalid="true" aria-describedby="cat-err"' : ''}>
          <option value="" ${S.d.cat === '' ? 'selected' : ''} disabled>${esc(l.q3)}</option>
          ${l.cats.map((c, i) => `<option value="${i}" ${String(S.d.cat) === String(i) ? 'selected' : ''}>${esc(c)}</option>`).join('')}
        </select>${errLine('cat', ec)}</div>
      ${radios('where', l.wheres, S.d.where, l.q5)}
      <div class="field"><label class="label" for="f-desc">${esc(l.q7)}</label>
        <textarea class="input" id="f-desc" data-k="desc" maxlength="2000" placeholder="${esc(l.q8)}" aria-describedby="desc-hint${ed ? ' desc-err' : ''}" ${ed ? 'aria-invalid="true"' : ''}>${esc(S.d.desc)}</textarea>
        ${errLine('desc', ed)}<p class="hint" id="desc-hint">${n >= 1800 ? esc(l.q21(n)) : esc(l.q9)}</p></div>
      ${radios('long', l.longs, S.d.long, l.q10)}
      ${radios('worse', l.worses, S.d.worse, l.q12)}
      <div class="field"><span class="label">${esc(l.q14)} <span class="opt">${esc(l.q14b)}</span></span>
        <div class="photos" id="photos"></div><p class="hint" id="photoHint" aria-live="off"></p>
        <input type="file" id="fileIn" accept="image/*" multiple hidden></div></div>
      <div class="foot"><button class="btn btn-primary" data-act="next">${esc(l.next)}</button></div>`;
  },
  maybe() {
    const l = L();
    return `<div class="body"><div class="emerg-head">${ICON.alert}${head(l.x1)}</div>
      <p>${esc(l.x2(S.matched))}</p>
      <p>${esc(l.x3)}</p>${callBlock()}</div>
      <div class="foot"><button class="btn btn-secondary" data-act="maybeContinue">${esc(l.x4)}</button></div>`;
  },
  access() {
    const l = L(); const et = S.errors.times;
    const timesReq = String(S.d.entry) === '1';
    const petOther = String(S.d.pets) === '3' ? input('petOther', l.a8, 'maxlength="40"') : '';
    return `<div class="body">${head(l.a1, 'access')}
      ${radios('entry', l.yesno, S.d.entry, l.a2)}
      <fieldset class="field" ${et ? 'aria-invalid="true" aria-describedby="times-err"' : ''}><legend>${esc(l.a4)} <span class="opt">${esc(timesReq ? l.a4b : l.a4b + ' ' + l.opt)}</span></legend>
        <div class="checks">${l.times.map((t, i) => `<label class="check"><input type="checkbox" data-k="times" value="${i}" ${S.d.times.includes(i) ? 'checked' : ''} ${i === 0 ? 'id="f-times"' : ''}>${esc(t)}</label>`).join('')}</div>
        ${errLine('times', et)}</fieldset>
      ${radios('pets', l.pets, S.d.pets, l.a6, { after: petOther })}
      <div class="field"><label class="label" for="f-notes">${esc(l.a9)} <span class="opt">${esc(l.opt)}</span></label>
        <textarea class="input" id="f-notes" data-k="notes" maxlength="1000" placeholder="${esc(l.a10)}">${esc(S.d.notes)}</textarea></div>
      <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" data-k="website" tabindex="-1" autocomplete="off" value="${esc(S.d.website)}"></div>
      <div id="sendNote"></div></div>
      <div class="foot" id="sendFoot"></div>`;
  },
  done() {
    const l = L(); const r = S.result;
    const missing = S.photos.filter((p) => p.status === 'failed' || p.status === 'uploading').length;
    return `<div class="body"><div class="emerg-head tight">${big(ICON.check, 'accent pop')}${head(l.c1)}</div>
      <div class="ticket"><p class="ticket-k">${esc(l.c2)}</p><p class="bignum">${esc(r.num)}</p></div><p class="hint">${esc(l.c3)}</p>
      ${missing ? `<div class="note alert">${ICON.alert}<p>${esc(l.c10(missing))}<br><button class="btn btn-secondary mt" data-act="resendPhotos">${esc(l.c11)}</button></p></div>` : ''}
      <div class="card"><strong>${esc(l.c4)}</strong><p class="m0">${esc(l.c5(r.prop, reviewDay()))}</p><p class="m0">${esc(l.c6)}</p></div>
      <div class="note">${ICON.alert}<p><strong>${esc(l.c7)}</strong>${esc(l.c8(emergency() ? emergency().shown : ''))}</p></div></div>
      <div class="foot"><button class="btn btn-secondary" data-act="another">${esc(l.c9)}</button></div>`;
  },
};

function render(focusSel) {
  const l = L();
  document.documentElement.lang = S.lang;
  const banner = $('#banner');
  banner.hidden = !(notReady || CFG.testMode);
  banner.className = 'banner ' + (notReady ? 'notready' : 'test');
  banner.textContent = notReady ? l.notReady : l.testBanner;
  $('#appTitle').textContent = l.appTitle;
  const lb = $('#langBtn'); lb.textContent = l.lang; lb.lang = l.langOther;
  $('#backLabel').textContent = l.back;
  $('#backBtn').hidden = !S.history.length || S.screen === 'done';
  $('#signalBar').hidden = !(S.offline && !['emergency', 'call', 'done'].includes(S.screen));
  $('#signalBar').textContent = l.noSignal;
  const app = $('#app');
  app.innerHTML = SCREENS[S.screen]();
  document.body.classList.toggle('has-hero', !!app.querySelector('.hero'));
  // Slide the new screen in (from the right going forward, from the left going back).
  // Only on a change of screen, not when the same screen redraws to show an error.
  if (S.screen !== lastScreen) {
    app.classList.remove('anim-fwd', 'anim-back');
    void app.offsetWidth;
    if (lastScreen !== null) app.classList.add(navDir === 'back' ? 'anim-back' : 'anim-fwd');
    lastScreen = S.screen;
  }
  navDir = 'fwd';
  const h = $('#app h1');
  const st = stepOf(S.screen);
  document.title = (st ? l.step(st[0], st[1]) + ': ' : '') + (h ? h.textContent : '') + ' — ' + l.appTitle;
  if (S.screen === 'what') renderPhotos();
  if (S.screen === 'access') renderSend();
  const f = focusSel ? $(focusSel) : h;
  if (f) f.focus({ preventScroll: !focusSel });
  if (!focusSel) window.scrollTo(0, 0);
}
let lastScreen = null, navDir = 'fwd';
function go(scr, push = true) {
  if (push && S.screen !== scr) { S.history.push(S.screen); try { history.pushState({ pei: S.history.length }, ''); } catch {} }
  S.screen = scr; S.errors = {}; render(); saveDraft();
}
function goBack() {
  const prev = S.history.pop(); if (!prev) return;
  navDir = 'back'; S.screen = prev; S.errors = {}; render(); saveDraft();
}

/* ── photos ── */
function renderPhotos() {
  const box = $('#photos'); if (!box) return; const l = L();
  box.innerHTML = S.photos.map((p, i) => `<div class="thumb ${p.status === 'failed' ? 'failed' : ''}">
      ${p.thumb ? `<img src="${esc(p.thumb)}" alt="${esc(l.photoAlt(i + 1))}">` : `<span class="ph-img" role="img" aria-label="${esc(l.photoAlt(i + 1))}">${ICON.cam}</span>`}
      ${p.status === 'uploading' ? `<span class="state">${esc(l.uploading)}</span>` : ''}
      ${p.status === 'failed' ? `<button class="retry" data-act="retryPhoto" data-i="${i}">${esc(l.retry)}</button>` : ''}
      <button class="x" data-act="removePhoto" data-i="${i}" aria-label="${esc(l.q16)} ${i + 1}">${ICON.x}</button></div>`).join('')
    + `<button class="addphoto" data-act="addPhoto" ${S.photos.length >= MAX_PHOTOS ? 'disabled' : ''}>${ICON.cam}<span>${esc(l.q15)}</span></button>`;
  const up = S.photos.filter((p) => p.status === 'uploading').length;
  const bad = S.photos.filter((p) => p.status === 'failed').length;
  $('#photoHint').textContent = bad ? l.q18(bad) : up ? l.q17(up) : S.photos.length >= MAX_PHOTOS ? l.q19 : '';
}
function freeSlot() {
  const used = new Set(S.photos.map((p) => p.slot));
  for (let i = 0; i < MAX_PHOTOS; i++) if (!used.has(i)) return i;
  return -1;
}
/* Shrink a camera photo to at most 1600 px on the long side, as JPEG. A 4 MB phone photo
   becomes ~300 KB, which uploads on one bar of signal. Falls back to the original file
   if this browser cannot decode it (the server accepts JPEG, PNG, WebP and HEIC). */
async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const t = document.createElement('canvas'); const ts = 176 / Math.max(bmp.width, bmp.height);
    t.width = Math.round(bmp.width * ts); t.height = Math.round(bmp.height * ts);
    t.getContext('2d').drawImage(bmp, 0, 0, t.width, t.height);
    bmp.close && bmp.close();
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.8));
    if (!blob) throw new Error('encode');
    return { blob, thumb: t.toDataURL('image/jpeg', 0.6) };
  } catch {
    return { blob: file, thumb: '' };
  }
}
async function postPhoto(p) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 45e3);
  try {
    const res = await fetch(`/api/photos?clientId=${encodeURIComponent(S.clientId)}&index=${p.slot}`, {
      method: 'POST', body: p.blob, headers: { 'Content-Type': p.blob.type || 'application/octet-stream' }, signal: ctl.signal,
    });
    return res.ok;
  } catch { return false; } finally { clearTimeout(timer); }
}
async function deletePhoto(clientId, slot) {
  try { await fetch(`/api/photos?clientId=${encodeURIComponent(clientId)}&index=${slot}`, { method: 'DELETE' }); } catch {}
}
async function upload(p, autoRetry = true) {
  if (!p.blob) { p.status = 'failed'; renderPhotos(); return; }
  p.status = 'uploading'; renderPhotos(); if (S.screen === 'access') renderSend();
  let ok = await postPhoto(p);
  if (!ok && autoRetry && !p.removed) { await new Promise((r) => setTimeout(r, 5000)); if (!p.removed) ok = await postPhoto(p); }
  if (p.removed) { if (ok) deletePhoto(S.clientId, p.slot); return; }
  p.status = ok ? 'done' : 'failed';
  const n = S.photos.indexOf(p) + 1;
  if (n > 0 && S.screen === 'what') say(ok ? L().q24(n) : L().q18(1));
  if (S.screen === 'what') renderPhotos();
  if (S.screen === 'access') renderSend();
  if (S.screen === 'done') render();
  saveDraft();
}

/* ── validation ── */
const cellDigits = (v) => { let d = String(v).replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1); return d; };
function validate(scr) {
  const l = L(), d = S.d, e = {};
  if (scr === 'where' && !(S.returning && !S.editProfile)) {
    if (propsFailed) { if (!d.freeName.trim()) e.freeName = l.w10; }
    else if (!d.code && !d.freeName) e.code = l.w10;
    if (!d.apt.trim()) e.apt = l.w11;
  }
  if (scr === 'notlisted' && !d.freeName.trim()) e.freeName = l.w8;
  if (scr === 'who') {
    if (!d.name.trim()) e.name = l.h6;
    const digits = cellDigits(d.cell);
    if (!digits) e.cell = l.h7; else if (digits.length !== 10) e.cell = l.h8(digits.length);
    if (!d.site.trim()) e.site = l.h10;
  }
  if (scr === 'what') {
    if (d.cat === '') e.cat = l.q22;
    if (d.where === '') e.where = l.q23;
    if (!d.desc.trim()) e.desc = l.q20;
    if (d.long === '') e.long = l.q23;
    if (d.worse === '') e.worse = l.q23;
  }
  if (scr === 'access') {
    if (d.entry === '') e.entry = l.a11;
    if (String(d.entry) === '1' && !d.times.length) e.times = l.a12;
    if (d.pets === '') e.pets = l.q23;
  }
  S.errors = e;
  const first = Object.keys(e)[0];
  if (first) { render('#f-' + first); return false; }
  return true;
}

/* ── sending ── */
function renderSend() {
  const foot = $('#sendFoot'), note = $('#sendNote'); if (!foot) return; const l = L();
  const pending = S.photos.filter((p) => p.status === 'uploading').length;
  let label = l.s1;
  if (S.sending) label = S.sendNote === 'slow' ? l.s3 : pending ? l.s2(pending) : (S.sendNote === 'retry' ? l.sendingNow : l.sending);
  foot.innerHTML = `<button class="btn btn-primary" data-act="send" ${S.sending ? 'disabled' : ''}>${S.sending ? '<span class="spinner" aria-hidden="true"></span>' : ''}${esc(label)}</button>`;
  let msg = '';
  if (S.failKind === 'limited') msg = esc(l.limited);
  else if (S.attempts && !S.sending) {
    msg = esc(S.failKind === 'offline' ? l.notSentNoSignal : l.notSentServer);
    if (S.attempts >= 3) msg += `<br><br>${esc(l.stillFailing)}<br><button class="btn btn-secondary mt" data-act="copy">${esc(l.copyMine)}</button>`;
  }
  note.innerHTML = msg ? `<div class="note alert" role="alert">${ICON.alert}<p>${msg}</p></div>` : '';
}
function sentRecently() { return (store.get('sent') || []).filter((t) => Date.now() - t < HOUR); }
function payload() {
  return Object.assign({}, S.d, {
    clientId: S.clientId, deviceId, lang: S.lang,
    photosExpected: S.photos.length,
    possibleEmergency: S.maybeDone ? S.matched : '',
  });
}
async function send(isRetry) {
  if (S.sending) return;
  S.failKind = '';
  if (sentRecently().length >= PER_HOUR) { S.failKind = 'limited'; renderSend(); say(L().limited, true); return; }
  S.sending = true; S.sendNote = isRetry ? 'retry' : ''; renderSend();
  const started = Date.now();
  const slow = setTimeout(() => { S.sendNote = 'slow'; renderSend(); say(L().s3); }, SLOW_AFTER);
  // Wait for photos still uploading, up to 30 seconds; then send without them.
  while (S.photos.some((p) => p.status === 'uploading') && Date.now() - started < PHOTO_WAIT) {
    renderSend(); await new Promise((r) => setTimeout(r, 400));
  }
  let res = null, kind = '';
  if (!navigator.onLine) kind = 'offline';
  else {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), SEND_TIMEOUT);
    try {
      const r = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()), signal: ctl.signal });
      const j = await r.json().catch(() => null);
      if ((r.status === 200 || r.status === 201) && j && j.num) res = j;
      else kind = r.status === 429 ? 'limited' : 'server';
    } catch { kind = navigator.onLine ? 'server' : 'offline'; } finally { clearTimeout(timer); }
  }
  clearTimeout(slow); S.sending = false; S.sendNote = '';

  if (!res) {
    if (kind !== 'limited') { S.attempts++; store.set('unsent', { d: S.d, clientId: S.clientId, at: Date.now(), maybeDone: S.maybeDone, matched: S.matched, photos: photoMeta() }); }
    S.failKind = kind; renderSend();
    say(kind === 'limited' ? L().limited : S.attempts >= 3 ? L().stillFailing : kind === 'offline' ? L().notSentNoSignal : L().notSentServer, true);
    return;
  }
  // Only now, with the server's answer, is a request number shown.
  S.result = { num: res.num, prop: propName() };
  if (!res.repeat) store.set('sent', [...sentRecently(), Date.now()]);
  store.set('last', { num: res.num, cat: S.d.cat, at: Date.now() });
  store.set('profile', { code: S.d.code, freeName: S.d.freeName, freeCity: S.d.freeCity, apt: S.d.apt, name: S.d.name, cell: S.d.cell, site: S.d.site, supervisor: S.d.supervisor });
  store.del('draft'); store.del('unsent');
  S.attempts = 0; S.history = []; S.screen = 'done'; render();
}
function copyText() {
  const l = L(), d = S.d;
  const ans = (arr, v) => (v === '' ? '' : arr[v]);
  return `${l.copyHead}: ${propName()}, ${l.aptPrefix.toLowerCase()} ${d.apt}. ${ans(l.cats, d.cat)}: ${d.desc} ${l.started}: ${ans(l.longs, d.long)}. ${l.worse}: ${ans(l.worses, d.worse)}. ${l.enter}: ${ans(l.yesno, d.entry)}. ${l.there}: ${d.times.map((i) => l.times[i]).join(', ') || '—'}. ${l.petsL}: ${ans(l.pets, d.pets)}${d.petOther ? ' (' + d.petOther + ')' : ''}. ${d.name}, ${d.cell}.`;
}

/* ── property sheet ── */
function openSheet() {
  const l = L(), sh = $('#sheet');
  sh.innerHTML = `<div class="sheet-in"><div class="sheet-top"><h2 id="sheetTitle">${esc(l.w3)}</h2>
    <button class="iconbtn" data-act="closeSheet" aria-label="${esc(l.close)}">${ICON.x}</button></div>
    <div class="sheet-search"><label class="sr" for="propSearch">${esc(l.p2)}</label>
      <input class="input" id="propSearch" type="search" placeholder="${esc(l.p2)}" autocomplete="off"></div>
    <div class="sheet-list" id="sheetList"></div></div>`;
  const draw = (q) => {
    q = q.trim().toLowerCase();
    const hits = PROPS.filter((p) => !q || (p.name + ' ' + p.city).toLowerCase().includes(q));
    let html = '';
    for (const st of [...Object.keys(STATES), '']) {
      const g = hits.filter((p) => (st ? p.st === st : !STATES[p.st])); if (!g.length) continue;
      html += `${st ? `<p class="group">${STATES[st]}</p>` : ''}<div class="list">${g.map((p) => `<button class="row" data-act="choose" data-code="${esc(p.code)}"><span class="grow">${esc(p.name)}<small>${esc(p.city)}</small></span></button>`).join('')}</div>`;
    }
    if (!hits.length) html += `<p class="hint pad" role="status">${esc(l.p5(q))}</p>`;
    html += `<div class="list"><button class="row" data-act="notListed">${ICON.plus}<span class="grow"><strong>${esc(l.p4)}</strong></span></button></div>`;
    $('#sheetList').innerHTML = html;
  };
  draw('');
  sh.showModal(); $('#propSearch').focus();
  $('#propSearch').addEventListener('input', (e) => draw(e.target.value));
}
function closeSheet() { const sh = $('#sheet'); if (sh.open) sh.close(); }
$('#sheet').addEventListener('close', () => { const b = $('#callLink') || $('#f-code') || $('[data-act="pick"]'); if (b) b.focus(); });

/* ── dialogs on opening ── */
function prompt(kind, saved) {
  const l = L(), dlg = $('#dlg'), d = saved.d;
  const cat = d.cat === '' ? '' : l.cats[d.cat];
  const pn = d.code ? (prop(d.code) || {}).name || '' : d.freeName;
  if (kind === 'unsent') {
    dlg.innerHTML = `<div class="dbody"><span class="danger">${ICON.alert.replace('aria-hidden', 'width="28" height="28" aria-hidden')}</span>
      <h2 tabindex="-1">${esc(l.unsentT(fmtTime(saved.at)))}</h2><p>${esc([cat, d.apt ? l.aptPrefix + ' ' + d.apt : '', pn].filter(Boolean).join(', '))}.</p>
      <button class="btn btn-primary" data-act="sendUnsent">${esc(l.sendNow)}</button><button class="btn btn-quiet" data-act="deleteUnsent">${esc(l.deleteIt)}</button></div>`;
  } else {
    const missing = saved.photosPending;
    const gone = d.code && PROPS.length && !prop(d.code);
    dlg.innerHTML = `<div class="dbody"><h2 tabindex="-1">${esc(l.resumeT)}</h2><p>${esc(l.resumeB(fmtTime(saved.at), cat, d.apt, gone ? '' : pn))}</p>
      ${missing ? `<p>${esc(l.resumePhotos(missing))}</p>` : ''}
      ${gone ? `<p>${esc(l.resumeGone(saved.dName || l.w2))}</p>` : ''}
      <button class="btn btn-primary" data-act="resume">${esc(l.cont)}</button><button class="btn btn-quiet" data-act="startOver">${esc(l.startOver)}</button></div>`;
  }
  dlg.dataset.kind = kind;
  dlg.showModal(); $('#dlg h2').focus();
}
$('#dlg').addEventListener('cancel', (e) => {
  if ($('#dlg').dataset.kind === 'resume') { e.preventDefault(); act('resume'); }
});

function restore(saved) {
  S.d = Object.assign(blank(), saved.d);
  S.clientId = saved.clientId || uuid();
  S.maybeDone = !!saved.maybeDone; S.matched = saved.matched || '';
  S.photos = (saved.photos || []).map((p) => ({ slot: p.slot, thumb: p.thumb, status: 'done' }));
}

/* ── actions ── */
function act(a, el) {
  const l = L();
  switch (a) {
    case 'emerg': S.tapped = +el.dataset.i; go('call'); break;
    case 'none': go('where'); break;
    case 'notEmerg': { const i = S.tapped; S.history = []; navDir = 'back'; S.screen = 'emergency'; render(`[data-act="emerg"][data-i="${i}"]`); break; }
    case 'pick': openSheet(); break;
    case 'closeSheet': closeSheet(); break;
    case 'choose':
      S.d.code = el.dataset.code; S.d.freeName = ''; S.d.freeCity = ''; S.qrUnknown = false; S.goneNote = ''; S.fromQR = false; delete S.errors.code; closeSheet();
      // Chosen from the call screen: show that property's emergency number straight away.
      if (S.screen === 'call' || S.screen === 'maybe') { render('#callLink'); break; }
      render('#f-code'); saveDraft(); break;
    case 'notListed': closeSheet(); S.d.code = ''; go('notlisted'); break;
    case 'notlistedNext': if (validate('notlisted')) { S.history.pop(); navDir = 'back'; S.screen = 'where'; S.errors = {}; render('#f-apt'); saveDraft(); } break;
    case 'editProfile': S.editProfile = true; render('#f-apt'); break;
    case 'next': {
      const order = skipWho() ? { where: 'what', what: 'access' } : { where: 'who', who: 'what', what: 'access' };
      if (!validate(S.screen)) break;
      if (S.screen === 'what' && !S.maybeDone) {
        const hits = matchWords(S.d.desc);
        if (hits.length) { S.matched = hits.join(', '); go('maybe'); break; }
      }
      go(order[S.screen]); break;
    }
    case 'maybeContinue': S.maybeDone = true; S.history.pop(); S.history.push('what'); S.screen = 'access'; S.errors = {}; render(); saveDraft(); break;
    case 'addPhoto': $('#fileIn').click(); break;
    case 'removePhoto': {
      const i = +el.dataset.i; const p = S.photos[i];
      if (p) { p.removed = true; if (p.status === 'done') deletePhoto(S.clientId, p.slot); }
      S.photos.splice(i, 1); renderPhotos(); saveDraft();
      const nx = $(`[data-act="removePhoto"][data-i="${Math.min(i, S.photos.length - 1)}"]`) || $('[data-act="addPhoto"]'); nx && nx.focus();
      break;
    }
    case 'retryPhoto': upload(S.photos[+el.dataset.i], false); break;
    case 'send': if (validate('access')) send(false); break;
    case 'copy': {
      const txt = copyText();
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast(l.copied), () => {
        const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); toast(l.copied); } catch {} ta.remove();
      });
      break;
    }
    case 'resendPhotos': {
      const todo = S.photos.filter((p) => p.status === 'failed');
      Promise.all(todo.map((p) => upload(p, false))).then(() => { if (!S.photos.some((p) => p.status === 'failed')) toast(l.photosSent); });
      break;
    }
    case 'another': {
      const keep = { code: S.d.code, freeName: S.d.freeName, freeCity: S.d.freeCity, apt: S.d.apt, name: S.d.name, cell: S.d.cell, site: S.d.site, supervisor: S.d.supervisor };
      S.d = Object.assign(blank(), keep); S.clientId = uuid(); S.photos = []; S.maybeDone = false; S.matched = '';
      S.returning = true; S.editProfile = false; S.fromQR = false; S.history = []; S.result = null; S.failKind = ''; S.attempts = 0;
      go('emergency', false); break;
    }
    case 'resume': {
      const saved = store.get('draft'); $('#dlg').close();
      if (saved) {
        restore(saved);
        S.returning = !!saved.returning; S.editProfile = !!saved.editProfile; S.history = ['emergency'];
        let screen = saved.screen;
        if (S.d.code && PROPS.length && !prop(S.d.code)) { S.d.code = ''; S.returning = false; S.editProfile = false; screen = 'where'; }
        go(screen, false);
      }
      break;
    }
    case 'startOver': store.del('draft'); $('#dlg').close(); begin(true); break;
    case 'sendUnsent': {
      const saved = store.get('unsent'); $('#dlg').close();
      if (!saved) { begin(true); break; }
      restore(saved); S.history = []; S.screen = 'access'; render(); send(true); break;
    }
    case 'deleteUnsent': store.del('unsent'); $('#dlg').close(); begin(true); break;
  }
}
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  e.preventDefault(); act(el.dataset.act, el);
});
document.addEventListener('input', (e) => {
  const k = e.target.dataset && e.target.dataset.k; if (!k) return;
  if (k === 'times') {
    const v = +e.target.value; S.d.times = e.target.checked ? [...new Set([...S.d.times, v])].sort() : S.d.times.filter((x) => x !== v);
  } else S.d[k] = e.target.value;
  if (S.errors[k]) {
    delete S.errors[k];
    const holder = e.target.closest('.field'); if (holder) { const er = holder.querySelector('.err'); if (er) er.remove(); holder.removeAttribute('aria-invalid'); }
    e.target.removeAttribute('aria-invalid');
  }
  if (k === 'desc') { const n = S.d.desc.length; const h = $('#desc-hint'); h.textContent = n >= 1800 ? L().q21(n) : L().q9; if ([1800, 1900, 2000].includes(n)) say(L().q21(n)); }
  if (k === 'entry' || k === 'pets') render(`[name="${k}"][value="${e.target.value}"]`);
  saveDraft();
});
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'fileIn') return;
  const files = [...e.target.files].slice(0, MAX_PHOTOS - S.photos.length);
  e.target.value = '';
  for (const f of files) {
    const slot = freeSlot(); if (slot < 0) break;
    const p = { slot, thumb: '', status: 'uploading', blob: null };
    S.photos.push(p); renderPhotos();
    const { blob, thumb } = await shrink(f);
    p.blob = blob; p.thumb = thumb || (f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
    upload(p);
  }
  if (S.photos.length >= MAX_PHOTOS) say(L().q19);
});
$('#backBtn').addEventListener('click', goBack);
window.addEventListener('popstate', () => {
  if (S.screen === 'done') { act('another'); return; }   // never back to the Send button
  if (S.history.length) goBack();
});
$('#langBtn').addEventListener('click', () => {
  S.lang = S.lang === 'en' ? 'es' : 'en';
  store.set('lang', S.lang);
  render('#langBtn'); say(L().langAnnounce);
});
function setOnline(on) {
  S.offline = !on;
  $('#signalBar').hidden = !(S.offline && !['emergency', 'call', 'done'].includes(S.screen));
  if (S.offline) say(L().noSignal);
  // Signal is back: a request that failed for lack of signal goes again by itself.
  else if (S.screen === 'access' && S.attempts && S.failKind === 'offline' && !S.sending) send(true);
}
window.addEventListener('online', () => setOnline(true));
window.addEventListener('offline', () => setOnline(false));

/* ── property list ── */
async function loadProperties() {
  const cached = store.get('props');
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch('/api/properties', { signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    const list = await r.json();
    if (!Array.isArray(list)) throw new Error('shape');
    PROPS = list; store.set('props', { at: Date.now(), list });
  } catch {
    if (cached && Array.isArray(cached.list) && cached.list.length) PROPS = cached.list;
    else propsFailed = true;
  } finally { clearTimeout(timer); }
}

/* ── start ── */
function begin(fresh) {
  S = Object.assign(S, { screen: 'emergency', d: blank(), clientId: uuid(), photos: [], fromQR: false, qrUnknown: false, goneNote: '', returning: false, editProfile: false, errors: {}, tapped: -1, matched: '', maybeDone: false, attempts: 0, failKind: '', sending: false, result: null, history: [] });
  const code = (new URLSearchParams(location.search).get('p') || '').toLowerCase();
  const profile = store.get('profile');
  if (profile && profile.name) {
    // A profile saved before job site was required goes through "Who are you" once more.
    Object.assign(S.d, blank(), profile); S.returning = !!profile.site;
    if (S.d.code && !propsFailed && !prop(S.d.code)) { S.d.code = ''; S.returning = false; }
  }
  if (code) {
    if (propsFailed) S.d.code = code;   // can't check it; the server keeps it only if it's real
    else if (prop(code)) { if (S.d.code !== code) { S.d.code = code; S.d.freeName = ''; S.returning = false; S.d.apt = profile && profile.code === code ? profile.apt : ''; } S.fromQR = !S.returning; }
    else S.qrUnknown = true;
  }
  render();
  if (fresh) return;
  const unsent = store.get('unsent');
  if (unsent && Date.now() - unsent.at < 7 * DAY) { prompt('unsent', unsent); return; }
  if (unsent) store.del('unsent');
  const draft = store.get('draft');
  if (draft && Date.now() - draft.at < DAY) prompt('resume', draft);
  else if (draft) store.del('draft');
}

const savedLang = store.get('lang'); if (savedLang === 'en' || savedLang === 'es') S.lang = savedLang;
// Screen 1 never waits for the network. The property, and so its emergency number, is known
// at once from the QR code or the phone's last request, using the list saved on the phone.
const cachedProps = store.get('props');
if (cachedProps && Array.isArray(cachedProps.list)) PROPS = cachedProps.list;
{
  const qr = (new URLSearchParams(location.search).get('p') || '').toLowerCase();
  const pr = store.get('profile');
  S.d.code = qr || (pr && pr.code) || '';
}
render();
loadProperties().then(() => {
  if (S.screen === 'emergency' && !S.history.length) begin(false);
  // The worker got here before the list arrived: redraw with the property and its number.
  else if (['where', 'call', 'maybe'].includes(S.screen)) render(S.screen === 'where' ? undefined : '#callLink');
});
})();
