'use strict';
/*
 * A store that keeps requests and photos in memory, optionally saved to a folder.
 * Used by the tests and by the local dev server (npm run dev) so the form can be tried
 * end to end with no Azure or SharePoint account. Never used in production.
 */
const fs = require('fs');
const path = require('path');
const { requestNumber } = require('./schema');

function createMemoryStore({ properties = [], dir = null } = {}) {
  const state = { nextId: 1, requests: [], photos: {} };
  const file = dir ? path.join(dir, 'requests.json') : null;
  if (file && fs.existsSync(file)) Object.assign(state, JSON.parse(fs.readFileSync(file, 'utf8')));
  const persist = () => { if (file) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file, JSON.stringify(state, null, 2)); } };
  const props = properties.map((p, i) => ({ itemId: i + 1, active: true, ...p }));

  return {
    state,
    async listProperties() { return props; },
    /* Dry run only: every request with its photo count, as the queue would show it. */
    async listRequests() {
      return state.requests.map((r) => ({ created: r.created, ...r.fields, PhotoCount: Object.keys(state.photos[r.fields.ClientId] || {}).length }));
    },
    async findRequestByClientId(clientId) {
      const r = state.requests.find((x) => x.fields.ClientId === clientId);
      return r ? { itemId: r.id, num: r.fields.Title } : null;
    },
    async createRequest(fields, { propertyItemId } = {}) {
      const id = state.nextId++;
      const num = requestNumber(id);
      state.requests.push({ id, created: new Date().toISOString(), propertyItemId: propertyItemId ?? null, fields: { ...fields, Title: num } });
      persist();
      return num;
    },
    async findOpenRepeat(key) {
      const open = ['New', 'Needs Info', 'Sent to Property'];
      const r = state.requests.filter((x) => x.fields.RepeatKey === key && open.includes(x.fields.Status) && !x.fields.RepeatOf)
        .sort((a, b) => a.id - b.id)[0];
      return r ? { itemId: r.id, num: r.fields.Title } : null;
    },
    async recordRepeat(original, num, at) {
      const r = state.requests.find((x) => x.id === original.itemId);
      if (!r) return;
      r.fields.RepeatCount = (r.fields.RepeatCount || 0) + 1;
      r.fields.LastRepeatOn = at;
      r.fields.ActivityLog = `${r.fields.ActivityLog || ''}\n${at}  Reported again as ${num}`;
      persist();
    },
    async updatePhotoCount(existing, count) {
      const r = state.requests.find((x) => x.id === existing.itemId);
      if (r) { r.fields.PhotoCount = count; r.fields.PhotosMissing = 0; persist(); }
    },
    async countPhotos(clientId) { return Object.keys(state.photos[clientId] || {}).length; },
    async deletePhoto(clientId, index) {
      if (state.photos[clientId]) delete state.photos[clientId][index];
      if (dir) {
        const d = path.join(dir, 'photos', clientId);
        if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (f.startsWith(`photo-${index + 1}.`)) fs.unlinkSync(path.join(d, f));
      }
      persist();
    },
    async putPhoto(clientId, index, ext, buf) {
      (state.photos[clientId] ||= {})[index] = { ext, bytes: buf.length };
      if (dir) {
        const d = path.join(dir, 'photos', clientId);
        fs.mkdirSync(d, { recursive: true });
        for (const f of fs.readdirSync(d)) if (f.startsWith(`photo-${index + 1}.`)) fs.unlinkSync(path.join(d, f));
        fs.writeFileSync(path.join(d, `photo-${index + 1}.${ext}`), buf);
      }
      persist();
    },
  };
}

module.exports = { createMemoryStore };
