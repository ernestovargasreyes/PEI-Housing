/*
 * Coordinators' dashboard (view-only). Tonya, Jordan and Matt sign in with Microsoft; the
 * Static Web App only serves this page and /api/dashboard to the "coordinator" role.
 * Requests are worked in the SharePoint Requests list: each card links to its item there.
 *
 *  - Tiles: counts by status, plus "Reported again" (follow up) and "Possible emergency".
 *    Tapping a tile filters the board.
 *  - Board: one card per request; search and sort.
 *  - Insights: top complexes, top problems, frequent reporters, and which complexes get the
 *    most repeats, for the chosen period (the 80-20 view Matt asked for).
 */
(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5;
const OPEN = ['New', 'Needs Info', 'Sent to Property'];
const TILES = [
  { key: 'New', label: 'New', cls: 't-new', test: (r) => r.status === 'New' },
  { key: 'Needs Info', label: 'Needs info', cls: 't-info', test: (r) => r.status === 'Needs Info' },
  { key: 'Sent to Property', label: 'Sent to property', cls: 't-sent', test: (r) => r.status === 'Sent to Property' },
  { key: 'repeat', label: 'Reported again', cls: 't-rep', test: (r) => r.repeatCount > 0 && OPEN.includes(r.status) },
  { key: 'emergency', label: 'Possible emergency', cls: 't-emerg', test: (r) => r.emergency && OPEN.includes(r.status) },
  { key: 'Fixed', label: 'Fixed, to close', cls: 't-fixed', test: (r) => r.status === 'Fixed' },
];
const STATUS_CLS = { 'New': 'st-new', 'Needs Info': 'st-info', 'Sent to Property': 'st-sent', 'Fixed': 'st-fixed', 'Closed': 'st-closed', 'Duplicate': 'st-closed' };

let all = [];
let filter = 'open';
let loadedOnce = false;

const ago = (iso) => {
  const ms = Date.now() - Date.parse(iso);
  if (!(ms >= 0)) return '';
  const h = Math.floor(ms / 36e5);
  if (h < 1) return 'just now';
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? '1 day ago' : `${d} days ago`;
};
const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
const hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 'av' + (h % 6); };

function renderTiles() {
  const open = all.filter((r) => OPEN.includes(r.status)).length;
  const tiles = [{ key: 'open', label: 'All open', cls: 't-open', n: open }, ...TILES.map((t) => ({ ...t, n: all.filter(t.test).length }))];
  $('#tiles').innerHTML = tiles.map((t) => `
    <button class="tile ${t.cls}" data-f="${esc(t.key)}" aria-pressed="${filter === t.key}">
      <span class="tile-n">${t.n}</span><span class="tile-l">${esc(t.label)}</span>
    </button>`).join('');
}

const pin = (r) => (r.emergency && OPEN.includes(r.status) ? 1 : 0);
function visible() {
  const q = $('#q').value.trim().toLowerCase();
  const t = TILES.find((x) => x.key === filter);
  let rows = all.filter((r) => (filter === 'open' ? OPEN.includes(r.status) : filter === 'all' ? true : t ? t.test(r) : true));
  if (q) rows = rows.filter((r) => [r.num, r.place, r.apt, r.worker, r.cell, r.problem, r.desc, r.jobSite, r.supervisor].join(' ').toLowerCase().includes(q));
  const sort = $('#sort').value;
  rows.sort(sort === 'old' ? (a, b) => String(a.created).localeCompare(String(b.created))
    : sort === 'rep' ? (a, b) => (b.repeatCount - a.repeatCount) || String(b.created).localeCompare(String(a.created))
      // Newest first, with open possible emergencies pinned to the top.
      : (a, b) => (pin(b) - pin(a)) || String(b.created).localeCompare(String(a.created)));
  return rows;
}

function card(r) {
  const badges = [
    r.emergency ? `<span class="badge b-emerg">Possible emergency: ${esc(r.emergency)}</span>` : '',
    r.repeatCount ? `<span class="badge b-rep">Reported again ×${r.repeatCount}</span>` : '',
    r.repeatOf ? `<span class="badge">Repeat of ${esc(r.repeatOf)}</span>` : '',
    r.lang === 'Spanish' ? '<span class="badge">Spanish</span>' : '',
    r.photos ? `<span class="badge">${r.photos} ${r.photos === 1 ? 'photo' : 'photos'}</span>` : '',
  ].join('');
  return `<article class="dcard">
    <div class="dcard-top"><span class="chip ${STATUS_CLS[r.status] || ''}">${esc(r.status)}</span><span class="dnum">${esc(r.num)}</span><span class="dage">${esc(ago(r.created))}</span></div>
    <h3 class="dcard-h">${esc(r.problem)}${r.apt ? ` · Apt ${esc(r.apt)}` : ''}</h3>
    <p class="dplace">${esc(r.place)}</p>
    ${r.desc ? `<p class="ddesc">${esc(r.desc)}</p>` : ''}
    ${badges ? `<div class="badges">${badges}</div>` : ''}
    <div class="dwho"><span class="avatar ${hue(r.worker)}" aria-hidden="true">${esc(initials(r.worker))}</span>
      <span><strong>${esc(r.worker)}</strong><small>${esc([r.cell, r.jobSite, r.supervisor && 'Sup. ' + r.supervisor].filter(Boolean).join(' · '))}</small></span></div>
    ${r.link ? `<a class="dopen" href="${esc(r.link)}" target="_blank" rel="noopener">Open in SharePoint</a>` : ''}
  </article>`;
}

function renderCards() {
  const rows = visible();
  const label = filter === 'open' ? 'open' : filter === 'all' ? '' : (TILES.find((t) => t.key === filter) || {}).label?.toLowerCase();
  $('#status').textContent = all.length
    ? `${rows.length} ${label ? label + ' ' : ''}${rows.length === 1 ? 'request' : 'requests'}${$('#q').value.trim() ? ' matching the search' : ''}.`
    : 'No requests yet.';
  $('#cards').innerHTML = rows.map(card).join('');
}

/* Insights for the chosen period: counts grouped by a key, largest first, top 5. */
function top(rows, keyFn, valFn = () => 1, min = 1) {
  const m = new Map();
  for (const r of rows) { const k = keyFn(r); if (!k) continue; const e = m.get(k.id) || { label: k.label, n: 0 }; e.n += valFn(r); m.set(k.id, e); }
  return [...m.values()].filter((e) => e.n >= min).sort((a, b) => b.n - a.n).slice(0, 5);
}
function block(title, items, empty) {
  const max = items.reduce((a, e) => Math.max(a, e.n), 0) || 1;
  return `<section class="ins"><h3>${esc(title)}</h3>${items.length ? `<ol class="bars">${items.map((e) => `
    <li><span class="bar-l">${esc(e.label)}</span><span class="bar-n">${e.n}</span>
      <progress max="${max}" value="${e.n}" aria-hidden="true"></progress></li>`).join('')}</ol>` : `<p class="hint">${esc(empty)}</p>`}</section>`;
}
function renderInsights() {
  const days = Number($('#period').value);
  const since = days ? Date.now() - days * DAY : 0;
  const rows = all.filter((r) => Date.parse(r.created) >= since && r.status !== 'Duplicate');
  const withRepeats = all.filter((r) => Date.parse(r.created) >= since);
  $('#insights').innerHTML = [
    block('Complexes with the most requests', top(rows, (r) => r.place && { id: r.place, label: r.place }), 'No requests in this period.'),
    block('Most common problems', top(rows, (r) => r.problem && { id: r.problem, label: r.problem }), 'No requests in this period.'),
    block('Frequent reporters (2 or more)', top(rows, (r) => r.cell && { id: r.cell, label: `${r.worker} · ${r.cell}` }, () => 1, 2), 'Nobody has reported twice in this period.'),
    block('Complexes where problems get reported again', top(withRepeats, (r) => r.repeatOf && r.place && { id: r.place, label: r.place }), 'No repeats in this period.'),
  ].join('');
}

async function load() {
  try {
    const res = await fetch('/api/dashboard', { cache: 'no-store', credentials: 'same-origin' });
    if (res.status === 401 || res.status === 403) {
      $('#status').innerHTML = 'You need to sign in as a housing coordinator. <a href="/.auth/login/aad?post_login_redirect_uri=/dashboard">Sign in with Microsoft</a>';
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    all = Array.isArray(data.requests) ? data.requests : [];
    loadedOnce = true;
    $('#updated').textContent = 'Updated ' + new Date(data.generatedAt || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    renderTiles(); renderCards(); renderInsights();
  } catch {
    $('#status').textContent = loadedOnce ? 'Could not refresh. Showing the last copy; trying again in a minute.' : 'Could not load requests. Trying again in a minute.';
  }
}

$('#tiles').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]'); if (!b) return;
  filter = filter === b.dataset.f && filter !== 'open' ? 'open' : b.dataset.f;
  renderTiles(); renderCards();
});
$('#q').addEventListener('input', renderCards);
$('#sort').addEventListener('change', renderCards);
$('#period').addEventListener('change', renderInsights);
load();
setInterval(load, 60000);
})();
