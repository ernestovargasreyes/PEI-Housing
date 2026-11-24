'use strict';
/*
 * Local server for trying the form with no Azure or SharePoint account:
 *
 *   npm run dev            → http://localhost:8080  (QR test: http://localhost:8080/?p=test-vld)
 *
 * Serves web/ and the same API handlers the Azure Functions use, backed by the in-memory
 * store. Requests and photos are saved under app/.data/ so they survive a restart.
 * PEI_DATA_DIR=none keeps everything in memory (used by the browser tests).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createHandlers } = require('../api/src/lib/handlers');
const { createMemoryStore } = require('../api/src/lib/store-memory');

const WEB = path.join(__dirname, '..', 'web');
// The same security headers Azure sends (web/staticwebapp.config.json), so a CSP violation
// shows up locally and in the browser tests instead of first appearing in production.
const SWA = JSON.parse(fs.readFileSync(path.join(WEB, 'staticwebapp.config.json'), 'utf8'));
const SEC_HEADERS = SWA.globalHeaders || {};
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function createServer({ dataDir = path.join(__dirname, '..', '.data'), properties = require('../api/src/lib/properties.sample.json'), config = null, dryRunKey = process.env.PEI_DRYRUN_KEY || 'local-dry-run-key' } = {}) {
  const store = createMemoryStore({ properties, dir: dataDir });
  const handlers = createHandlers(store, { log: (lvl, msg, err) => console.error(msg, err && err.message) });
  const ctl = { failNext: 0, propertiesDown: false };   // test hooks

  const send = (res, status, json, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
    res.end(json == null ? '' : JSON.stringify(json));
  };
  const readBody = (req, limit) => new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > limit) { reject(new Error('too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const ip = req.socket.remoteAddress || 'local';
    try {
      if (url.pathname.startsWith('/api/')) {
        if (ctl.failNext > 0 && req.method === 'POST' && url.pathname === '/api/requests') { ctl.failNext--; return send(res, 503, { error: 'unavailable' }); }
        // Local only: no Microsoft sign-in here, so the dashboard is open. It only ever holds test
        // data. On Azure, staticwebapp.config.json and api/src/index.js require the coordinator role.
        if (url.pathname === '/api/dashboard' && req.method === 'GET') {
          const r = await handlers.dashboard(); return send(res, r.status, r.json);
        }
        if (url.pathname === '/api/dryrun/requests' && req.method === 'GET') {
          const r = await handlers.dryRunList({ key: url.searchParams.get('key') || '', expected: dryRunKey }); return send(res, r.status, r.json);
        }
        if (url.pathname === '/api/properties' && req.method === 'GET') {
          if (ctl.propertiesDown) return send(res, 503, { error: 'unavailable' });
          const r = await handlers.getProperties(); return send(res, r.status, r.json, r.headers);
        }
        if (url.pathname === '/api/requests' && req.method === 'POST') {
          let body; try { body = JSON.parse((await readBody(req, 64 * 1024)).toString('utf8')); } catch { return send(res, 400, { error: 'invalid_json' }); }
          const r = await handlers.postRequest({ body, ip }); return send(res, r.status, r.json);
        }
        if (url.pathname === '/api/photos' && req.method === 'POST') {
          let body; try { body = await readBody(req, 4 * 1024 * 1024); } catch { return send(res, 413, { error: 'too_large' }); }
          const r = await handlers.postPhoto({ query: Object.fromEntries(url.searchParams), body, ip }); return send(res, r.status, r.json);
        }
        if (url.pathname === '/api/photos' && req.method === 'DELETE') {
          const r = await handlers.deletePhoto({ query: Object.fromEntries(url.searchParams) }); return send(res, r.status, r.json);
        }
        return send(res, 404, { error: 'not_found' });
      }
      let file = path.normalize(path.join(WEB, decodeURIComponent(url.pathname)));
      if (!file.startsWith(WEB)) { res.writeHead(403); return res.end(); }
      if (url.pathname === '/dashboard') file = path.join(WEB, 'dashboard.html');
      else if (url.pathname === '/' || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(WEB, 'index.html');
      if (config && path.basename(file) === 'config.js') {
        res.writeHead(200, { 'Content-Type': TYPES['.js'], ...SEC_HEADERS });
        return res.end(`window.PEI_CONFIG = ${JSON.stringify(config)};`);
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...SEC_HEADERS });
      fs.createReadStream(file).pipe(res);
    } catch (err) {
      console.error(err);
      send(res, 500, { error: 'server' });
    }
  });
  return { server, store, ctl };
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 8080;
  const dir = process.env.PEI_DATA_DIR === 'none' ? null : process.env.PEI_DATA_DIR || path.join(__dirname, '..', '.data');
  createServer({ dataDir: dir }).server.listen(port, () => {
    console.log(`Plateau form: http://localhost:${port}   (QR test: http://localhost:${port}/?p=test-vld)`);
    console.log(dir ? `Requests saved to ${path.join(dir, 'requests.json')}` : 'Requests kept in memory only');
  });
}

module.exports = { createServer };
