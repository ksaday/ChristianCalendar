/* ============================================================
   Sabbath Calendar v2 — timeline/ticks.js
   O(visible) tick generation per row (REQ-UI-08, ADR-011). Ticks
   are found by arithmetic (Sabbath row) or by adapter boundaries
   (calendar rows), never by scanning days. Every tick carries the
   certainty of its label.
   ============================================================ */

import { sabbathJdn, cycleOf, ANCHOR_JDN } from '../core/chronology.js';
import { floorDiv } from '../core/bigint-math.js';
import { isUnsupported } from '../calendars/adapter.js';
import { yearLabel } from '../calendars/civil-common.js';
import { fmtInt, fmtIntCompact } from '../ui/format.js';
import { anniversaryOf, isMilestone } from './sabbath-row-rules.js';

const MIN_PX_MAJOR = 72;   // minimum pixel spacing between labelled calendar ticks
const MIN_PX_SEAL = 56;    // minimum pixel spacing between Sabbath seals
const MIN_PX_DAY = 26;

/**
 * @typedef {Object} Tick
 * @property {bigint} jdn
 * @property {string} label
 * @property {'major'|'minor'} weight
 * @property {string} [certainty]
 * @property {string} [kind] 'sabbath' | 'anniversary' | 'milestone' | 'anchor' | 'month' | 'year' | 'day'
 * @property {string} [title] tooltip
 */

/** Nice step sizes in Sabbaths (cycles): 1, 2, 4, 13, 52, 520, 5 200, … */
function sabbathStep(pxPerDay) {
  const need = MIN_PX_SEAL / (7 * pxPerDay);           // cycles per labelled tick
  const nice = [1n, 2n, 4n, 13n, 26n, 52n, 104n, 520n, 1040n, 5200n];
  for (const s of nice) if (Number(s) >= need) return s;
  // powers of ten of 5 200 (≈ 100 years) beyond the list
  let s = 5200n;
  while (Number(s) < need) s *= 10n;
  return s;
}

/**
 * Sabbath-row ticks.
 * @param {import('./zoom.js').Viewport} vp
 * @returns {Tick[]}
 */
export function sabbathTicks(vp, opts = {}) {
  const step = sabbathStep(vp.pxPerDay);
  const first = cycleOf(vp.start), last = cycleOf(vp.end);
  const ticks = [];
  const wanted = new Set();   // cycles that must be labelled even when seals are thinned (the cursor's own)
  if (opts.alwaysLabel !== undefined) wanted.add(opts.alwaysLabel);
  // align to multiples of step so labels are stable while panning
  let n = floorDiv(first, step) * step;
  if (n < first) n += step;
  const compact = (last - first) > 10n ** 15n;
  const labelled = [];
  for (; n <= last; n += step) labelled.push(n);
  for (const w of wanted) if (w >= first && w <= last && !labelled.includes(w)) labelled.push(w);
  labelled.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const n of labelled) {
    const j = sabbathJdn(n);
    if (j < vp.start || j > vp.end) continue;
    const ann = step === 1n ? anniversaryOf(j) : null;
    const kind = j === ANCHOR_JDN ? 'anchor' : (ann !== null && ann > 0n) ? 'anniversary' : isMilestone(n) ? 'milestone' : 'sabbath';
    ticks.push({ jdn: j, label: `#${compact ? fmtIntCompact(n) : fmtInt(n)}`, weight: 'major', certainty: 'EXACT', kind,
      title: ann !== null && ann > 0n ? `✦ Anniversary Sabbath — ${ann}th year since the Resurrection week` : undefined });
  }
  // minor ticks: every Sabbath when they are at least 6 px apart and the step is > 1
  if (step > 1n && 7 * vp.pxPerDay >= 6) {
    for (let m = first; m <= last; m++) {
      if (m % step === 0n || wanted.has(m)) continue;
      const j = sabbathJdn(m);
      if (j >= vp.start && j <= vp.end) ticks.push({ jdn: j, label: '', weight: 'minor', kind: 'sabbath' });
    }
  }
  return ticks;
}

/** Year label for an adapter's date. */
export function yearLabelFor(adapter, date, era) {
  if (adapter.id === 'hebrew') return `AM ${date.year}`;
  if (adapter.id === 'chinese') return `${date.year} ${date.extras.stemBranch}`;
  return yearLabel(date.year, era);
}

function yearStartJdn(adapter, year) {
  try {
    if (adapter.id === 'hebrew') return adapter.toJdn({ year, month: 7, day: 1 });
    if (adapter.id === 'chinese') return adapter.toJdn({ year, month: 1, leapMonth: false, day: 1 });
    return adapter.toJdn({ year, month: 1, day: 1 });
  } catch { return { unsupported: true, reason: 'no such year' }; }
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function monthLabelFor(adapter, date) {
  if (adapter.id === 'hebrew') return date.extras.monthName;
  if (adapter.id === 'chinese') return `${date.leapMonth ? '閏' : ''}${date.month}月`;
  return MONTH_SHORT[date.month - 1];
}

/**
 * Calendar-row ticks for one adapter.
 * @returns {{ticks: Tick[], collapsed: null | {reason: string}}}
 */
export function calendarTicks(adapter, vp, opts = {}) {
  const era = opts.era;
  const sStart = adapter.support(vp.start), sEnd = adapter.support(vp.end);
  const startDate = adapter.fromJdn(vp.start);
  if (isUnsupported(startDate) && sEnd.certainty === 'UNSUPPORTED') return { ticks: [], collapsed: { reason: sStart.reason } };

  const ticks = [];
  const push = (jdn, label, weight, kind, title) => {
    if (jdn < vp.start || jdn > vp.end) return;
    ticks.push({ jdn, label, weight, kind, certainty: adapter.support(jdn).certainty, title });
  };
  const ppd = vp.pxPerDay;

  if (ppd >= MIN_PX_DAY) {
    // day labels, month names at month starts
    for (let j = vp.start; j <= vp.end; j++) {
      const d = adapter.fromJdn(j);
      if (isUnsupported(d)) continue;
      push(j, d.day === 1 ? `${d.day} ${monthLabelFor(adapter, d)}` : String(d.day), d.day === 1 ? 'major' : 'minor', d.day === 1 ? 'month' : 'day', adapter.format(d, { era }));
    }
    return { ticks, collapsed: null };
  }
  if (30 * ppd >= MIN_PX_MAJOR * 0.6) {
    // month boundaries
    let j = isUnsupported(startDate) ? vp.start : adapter.nextBoundary(vp.start - 1n, 'month');
    let guard = 0;
    while (!isUnsupported(j) && j <= vp.end && guard++ < 400) {
      const d = adapter.fromJdn(j);
      if (isUnsupported(d)) break;
      const label = (d.month === 1 || (adapter.id === 'hebrew' && d.month === 7)) ? `${monthLabelFor(adapter, d)} ${yearLabelFor(adapter, d, era)}` : monthLabelFor(adapter, d);
      push(j, label, 'major', 'month', adapter.format(d, { era }));
      j = adapter.nextBoundary(j, 'month');
    }
    return { ticks, collapsed: null };
  }
  // year boundaries at a nice multiple of years
  const need = MIN_PX_MAJOR / (365.2425 * ppd);
  let stepYears = 1n;
  for (const s of [1n, 2n, 5n, 10n, 20n, 50n, 100n, 200n, 500n, 1000n, 2000n, 5000n, 10000n]) { stepYears = s; if (Number(s) >= need) break; }
  while (Number(stepYears) < need) stepYears *= 10n;
  const anyDate = isUnsupported(startDate) ? adapter.fromJdn(adapter.mathRange.minJdn) : startDate;
  if (isUnsupported(anyDate)) return { ticks: [], collapsed: { reason: sStart.reason } };
  let y = floorDiv(anyDate.year, stepYears) * stepYears;
  let guard = 0;
  while (guard++ < 400) {
    const j = yearStartJdn(adapter, y);
    if (!isUnsupported(j)) {
      if (j > vp.end) break;
      if (j >= vp.start) {
        const d = adapter.fromJdn(j);
        if (!isUnsupported(d)) push(j, yearLabelFor(adapter, d, era), 'major', 'year', adapter.format(d, { era }));
      }
    } else if (y > anyDate.year + stepYears * 400n) break;
    y += stepYears;
    if (!isUnsupported(j) && j > vp.end) break;
  }
  if (ticks.length === 0 && adapter.support(vp.start).certainty === 'UNSUPPORTED' && adapter.support(vp.end).certainty === 'UNSUPPORTED') {
    return { ticks: [], collapsed: { reason: sStart.reason } };
  }
  return { ticks, collapsed: null };
}

/** Built-in reference markers (REQ-UI-10). `today` is added by the UI. */
export const REFERENCE_MARKERS = Object.freeze([
  { id: 'sabbath-1', jdn: 1_733_205n, label: 'Sabbath #1', detail: 'Saturday, 4 April AD 33 (Julian) — the anchor', certainty: 'EXACT' },
  { id: 'sabbath-0', jdn: 1_733_198n, label: 'Sabbath #0', detail: 'Saturday, 28 March AD 33 (Julian)', certainty: 'EXACT' },
  { id: 'reform-1582', jdn: 2_299_161n, label: '1582 reform', detail: 'Thu 4 Oct (Julian) → Fri 15 Oct 1582 (Gregorian), Rome', certainty: 'EXACT' },
  { id: 'year-1', jdn: 1_721_424n, label: '1 BC → AD 1', detail: '1 January AD 1 (Julian); there is no year 0', certainty: 'CONVENTIONAL' },
  { id: 'jdn-0', jdn: 0n, label: 'JDN 0', detail: 'Monday, 1 January 4713 BC (Julian)', certainty: 'CONVENTIONAL' },
]);

/** Markers visible in the viewport, with x positions. */
export function markerTicks(vp, extra = []) {
  return [...REFERENCE_MARKERS, ...extra].filter(m => m.jdn >= vp.start && m.jdn <= vp.end).map(m => ({ ...m, weight: 'major' }));
}
