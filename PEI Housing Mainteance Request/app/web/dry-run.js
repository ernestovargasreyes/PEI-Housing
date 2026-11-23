/*
 * Dry run only. Lists the requests the form has received, as a coordinator would see them
 * in the queue. Open as dry-run.html?key=<PEI_DRYRUN_KEY>. Works only while the API runs in
 * memory mode (app/DRY-RUN.md); with SharePoint connected the API answers 404 and the real
 * queue is the Requests list.
 */
(() => {
'use strict';
const key = new URLSearchParams(location.search).get('key') || '';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = (iso) => new Date(iso).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
const FIELDS = [
  ['Place', (r) => r.PropertyCode || (r.PlaceNotListed ? r.PlaceNotListed + ' (not on the list)' : '')],
  ['Apartment', (r) => r.Apartment],
  ['Worker', (r) => `${r.WorkerName}, ${r.WorkerCell}`],
  ['Job site', (r) => r.JobSite],
  ['Supervisor', (r) => r.Supervisor || '—'],
  ['Problem', (r) => `${r.ProblemType} (${r.WhereInUnit})`],
  ['Description', (r) => r.ProblemDescription],
  ['Started', (r) => `${r.Started}; getting worse: ${r.GettingWorse}`],
  ['OK to enter', (r) => r.EntryOK],
  ['Usually there', (r) => r.Availability || '—'],
  ['Pets', (r) => r.Pets],
  ['Anything else', (r) => r.AccessNotes || '—'],
  ['Photos', (r) => String(r.PhotoCount || 0)],
  ['Language', (r) => r.FormLanguage],
];

async function load() {
  if (!key) { $('#status').textContent = 'Add ?key=… to the address (the dry-run key from app/DRY-RUN.md).'; return; }
  try {
    const res = await fetch('/api/dryrun/requests?key=' + encodeURIComponent(key), { cache: 'no-store' });
    if (res.status === 404) { $('#status').textContent = 'Not available: wrong key, or the app is not in dry-run (memory) mode.'; return; }
    if (!res.ok) throw new Error(String(res.status));
    const rows = await res.json();
    $('#status').textContent = rows.length ? `${rows.length} ${rows.length === 1 ? 'request' : 'requests'}, newest first.` : 'No requests yet. Send one from the form.';
    $('#rows').innerHTML = rows.map((r) => `
      <section class="card">
        <h2 class="dry-h">${esc(r.Title)} · ${esc(when(r.created))}</h2>
        ${r.PossibleEmergency ? `<p class="err">Possible emergency: ${esc(r.PossibleEmergency)}</p>` : ''}
        <dl class="facts">${FIELDS.map(([k, f]) => `<dt>${esc(k)}</dt><dd>${esc(f(r))}</dd>`).join('')}</dl>
      </section>`).join('');
  } catch {
    $('#status').textContent = 'Could not load. Retrying in 15 seconds.';
  }
}
load();
setInterval(load, 15000);
})();
