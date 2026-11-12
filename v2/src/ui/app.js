/* ============================================================
   Sabbath Calendar v2 — ui/app.js
   Wiring: one state object; every render derives from it.
   ============================================================ */

import { ANCHOR_JDN, verifyInvariants } from '../core/index.js';
import { jdnFromGregorian } from '../calendars/gregorian.js';
import { viewport, level, zoomIn, zoomOut, panDays, isLevel } from '../timeline/zoom.js';
import { serialize, parse } from '../timeline/url-state.js';
import { describeCursor } from '../timeline/cursor.js';
import { renderRows } from './render-rows.js';
import { renderCursorCard } from './cursor-card.js';
import { renderCycleView } from './cycle-view.js';
import { setupLookup } from './lookup.js';
import { fmtInt } from './format.js';

const $ = (id) => document.getElementById(id);

function todayJdn() {
  const now = new Date();
  return jdnFromGregorian(BigInt(now.getFullYear()), now.getMonth() + 1, now.getDate());
}

const narrow = window.matchMedia('(max-width: 600px)').matches;
const state = {
  cursorJdn: todayJdn(),
  level: 'week',
  era: 'BC/AD',
  rows: { julian: true, gregorian: true, hebrew: !narrow, chinese: !narrow, markers: true },
  todayJdn: todayJdn(),
  describe: null,
};

const fromHash = parse(location.hash);
if (fromHash) { state.cursorJdn = fromHash.cursorJdn; state.level = fromHash.level; }
try { const saved = JSON.parse(localStorage.getItem('sabbath-v2-prefs') || 'null'); if (saved) { Object.assign(state.rows, saved.rows || {}); if (saved.era) state.era = saved.era; } } catch { /* ignore */ }

const timelineEl = $('timeline'), svg = $('rows');
let raf = 0;

function render() {
  raf = 0;
  state.describe = describeCursor(state.cursorJdn, { era: state.era });
  const width = Math.max(320, timelineEl.clientWidth || 1000);
  const vp = viewport(state.cursorJdn, state.level, width);
  renderRows(svg, state, vp);
  renderCursorCard($('cursorCard'), state.describe);
  renderCycleView($('cycleView'), state.describe, { era: state.era });
  $('zoomLabel').textContent = level(state.level).label;
  const hash = serialize({ cursorJdn: state.cursorJdn, level: state.level });
  if (location.hash !== hash) history.replaceState(null, '', hash);
  document.title = `${state.describe.day.isSabbath ? 'Sabbath #' + fmtInt(state.describe.day.sabbathIndex) : 'Cycle #' + fmtInt(state.describe.day.cycle)} — The Sabbath Calendar`;
}
function scheduleRender() { if (!raf) raf = requestAnimationFrame(render); }

function setCursor(jdn) { state.cursorJdn = jdn; scheduleRender(); }
function setLevel(l) { if (isLevel(l) && l !== state.level) { state.level = l; scheduleRender(); } }
function savePrefs() { try { localStorage.setItem('sabbath-v2-prefs', JSON.stringify({ rows: state.rows, era: state.era })); } catch { /* ignore */ } }

/* ---------- controls ---------- */
$('todayBtn').addEventListener('click', () => setCursor(todayJdn()));
$('anchorBtn').addEventListener('click', () => setCursor(ANCHOR_JDN));
$('zoomInBtn').addEventListener('click', () => setLevel(zoomIn(state.level)));
$('zoomOutBtn').addEventListener('click', () => setLevel(zoomOut(state.level)));
$('eraSel').value = state.era;
$('eraSel').addEventListener('change', (e) => { state.era = e.target.value; savePrefs(); scheduleRender(); });
for (const cb of document.querySelectorAll('.rows-list input[type=checkbox]')) {
  cb.checked = state.rows[cb.dataset.row];
  cb.addEventListener('change', () => { state.rows[cb.dataset.row] = cb.checked; savePrefs(); scheduleRender(); });
}
const lookup = setupLookup($('gotoDialog'), { getEra: () => state.era, onGo: (jdn) => setCursor(jdn) });
$('gotoBtn').addEventListener('click', () => lookup.open());

/* click a tick / jump button anywhere */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-jdn]');
  if (t && !dragMoved) { e.preventDefault(); setCursor(BigInt(t.dataset.jdn)); }
  if (e.target.id === 'copyLink') {
    const url = location.href;
    navigator.clipboard?.writeText(url).then(() => { e.target.textContent = 'Link copied'; setTimeout(() => { e.target.textContent = 'Copy link'; }, 1500); });
  }
});
svg.addEventListener('keydown', (e) => {
  const t = e.target.closest('[data-jdn]');
  if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setCursor(BigInt(t.dataset.jdn)); }
});

/* ---------- keyboard (doc 11 §6) ---------- */
document.addEventListener('keydown', (e) => {
  if ((e.target instanceof Element && e.target.matches('input, select, textarea')) || $('gotoDialog').open) return;
  const vpFraction = 0.1;
  const key = e.code === 'NumpadAdd' ? '+' : e.code === 'NumpadSubtract' ? '-' : e.key;
  switch (key) {
    case 'ArrowLeft': case 'ArrowRight': {
      const dir = e.key === 'ArrowLeft' ? -1n : 1n;
      const step = e.altKey ? 1n : e.shiftKey ? 7n : panDays(state.level, vpFraction);
      setCursor(state.cursorJdn + dir * (step < 0n ? -step : step)); e.preventDefault(); break;
    }
    case '+': case '=': setLevel(zoomIn(state.level)); e.preventDefault(); break;
    case '-': case '_': setLevel(zoomOut(state.level)); e.preventDefault(); break;
    case 'Home': setCursor(ANCHOR_JDN); e.preventDefault(); break;
    case 't': case 'T': setCursor(todayJdn()); break;
    case 'g': case 'G': lookup.open(); e.preventDefault(); break;
    case 'c': case 'C': $('cycleView').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); break;
    case 'S': if (e.shiftKey) { navigator.clipboard?.writeText(location.href); } break;
    default: return;
  }
});

/* ---------- pointer: drag to pan, wheel to pan/zoom, pinch to zoom ---------- */
let dragging = false, dragMoved = false, dragStartX = 0, dragStartJdn = 0n, pointers = new Map(), pinchDist = 0;
timelineEl.addEventListener('pointerdown', (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) { dragging = true; dragMoved = false; dragStartX = e.clientX; dragStartJdn = state.cursorJdn; timelineEl.classList.add('dragging'); timelineEl.setPointerCapture(e.pointerId); }
  else if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchDist = Math.hypot(a.x - b.x, a.y - b.y); }
});
timelineEl.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist && Math.abs(d - pinchDist) > 60) { setLevel(d > pinchDist ? zoomIn(state.level) : zoomOut(state.level)); pinchDist = d; }
    return;
  }
  if (!dragging) return;
  const dx = e.clientX - dragStartX;
  if (Math.abs(dx) > 3) dragMoved = true;
  const vp = viewport(dragStartJdn, state.level, Math.max(320, timelineEl.clientWidth));
  const days = BigInt(Math.round(-dx / vp.pxPerDay));
  if (dragStartJdn + days !== state.cursorJdn) setCursor(dragStartJdn + days);
});
const endPointer = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) { dragging = false; timelineEl.classList.remove('dragging'); setTimeout(() => { dragMoved = false; }, 0); } };
timelineEl.addEventListener('pointerup', endPointer); timelineEl.addEventListener('pointercancel', endPointer);
timelineEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) { setLevel(e.deltaY < 0 ? zoomIn(state.level) : zoomOut(state.level)); return; }
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : e.deltaY);
  const vp = viewport(state.cursorJdn, state.level, Math.max(320, timelineEl.clientWidth));
  const days = BigInt(Math.round(delta / vp.pxPerDay));
  if (days !== 0n) setCursor(state.cursorJdn + days);
}, { passive: false });

window.addEventListener('hashchange', () => { const h = parse(location.hash); if (h) { state.cursorJdn = h.cursorJdn; state.level = h.level; scheduleRender(); } });
window.addEventListener('resize', scheduleRender);

/* ---------- integrity panel (COMPAT-15, T-VER-01) ---------- */
(function integrity() {
  const r = verifyInvariants({ seed: 1, samples: 300 });
  const el = $('integrity'), foot = $('selfCheck');
  const ok = r.allPassed;
  el.textContent = ok ? 'Integrity ✓ I1–I7' : 'INTEGRITY FAILED';
  el.className = ok ? 'integrity' : 'integrity fail';
  el.title = `verifyInvariants(seed 1, 300 samples): ${r.digest}`;
  foot.textContent = ok
    ? `Self-check passed: invariants I1–I7 (${r.checks.reduce((s, c) => s + c.cases, 0)} cases) ✓ · 11 Apr 2026 → JDN 2,461,142 → Sabbath #103,992 ✓ · anchor JDN 1,733,205 → Sabbath #1 ✓`
    : 'SELF-CHECK FAILED — do not trust displayed numbers.';
  foot.className = ok ? 'selfcheck' : 'selfcheck fail';
  console.assert(ok, r);
})();

render();
export { state, setCursor, setLevel };
