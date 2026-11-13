#!/usr/bin/env node
// Browser checks without a visible window (doc 12 §7.3): serves the repository over HTTP, starts headless
// Chrome/Chromium in real time (no virtual time), drives it over the DevTools protocol with Node's built-in
// WebSocket, and runs test/browser/ui-smoke.html (T-UI-*) and test/browser/a11y.html (axe-core, T-UI-07).
// Exit code 0 only if every smoke check passes and axe reports no violation.
// Chrome is taken from $CHROME_PATH, else the usual macOS / Linux locations.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { join, normalize, extname, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8' };

const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    const file = join(repoRoot, path);
    if (!file.startsWith(repoRoot) || !(await stat(file)).isFile()) throw new Error('not found');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

function findChrome() {
  const candidates = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try { return execFileSync('which', [name], { encoding: 'utf8' }).trim(); } catch { /* next */ }
  }
  return null;
}
const chromePath = findChrome();
if (!chromePath) { console.error('browser-checks: no Chrome/Chromium found (set CHROME_PATH)'); server.close(); process.exit(2); }

const profile = mkdtempSync(join(tmpdir(), 'sabbath-v2-chrome-'));
const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,900', '--no-first-run', '--no-default-browser-check', '--disable-gpu', ...(process.platform === 'linux' ? ['--no-sandbox'] : []), 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const cleanup = () => { try { chrome.kill(); } catch {} server.close(); try { rmSync(profile, { recursive: true, force: true }); } catch {} };

let ws;
for (let i = 0; i < 100 && !ws; i++) {
  try { const page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); if (page) ws = new WebSocket(page.webSocketDebuggerUrl); } catch { /* not up yet */ }
  if (!ws) await sleep(200);
}
if (!ws) { console.error('browser-checks: could not connect to Chrome'); cleanup(); process.exit(2); }
await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });

async function run(path, expression, timeoutMs = 120000) {
  await send('Page.navigate', { url: base + path });
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    await sleep(500);
    const v = (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
    if (v) return v;
  }
  return null;
}

// Debug mode: BROWSER_EVAL_PATH=/v2/index.html#j=… BROWSER_EVAL='expr returning a truthy value' prints that value and exits.
if (process.env.BROWSER_EVAL_PATH) {
  const v = await run(process.env.BROWSER_EVAL_PATH, process.env.BROWSER_EVAL || 'document.title', 30000);
  console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
  ws.close(); cleanup(); process.exit(v ? 0 : 1);
}

let failed = false;
const smoke = await run('/v2/test/browser/ui-smoke.html', `window.__smoke ? window.__smoke.map(r => ({ id: r.id, ok: r.ok, check: r.check, detail: r.detail })) : null`);
if (!smoke) { console.log('ui-smoke: TIMEOUT'); failed = true; }
else {
  for (const r of smoke) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.check}${r.ok ? '' : ' :: ' + r.detail}`);
  const bad = smoke.filter(r => !r.ok).length;
  console.log(`ui-smoke: ${smoke.length - bad}/${smoke.length} passed`);
  if (bad) failed = true;
}
const axe = await run('/v2/test/browser/a11y.html', `(() => { const m = /axe-core [\\d.]+: (\\d+) violation/.exec(document.body.innerText); return m ? { violations: Number(m[1]), text: document.body.innerText.slice(0, 1500) } : null; })()`);
if (!axe) { console.log('a11y: TIMEOUT'); failed = true; }
else { console.log(axe.text.trim().split('\n').slice(2).join('\n')); console.log(`a11y: ${axe.violations} violation rule(s)`); if (axe.violations) failed = true; }

ws.close(); cleanup();
process.exit(failed ? 1 : 0);
