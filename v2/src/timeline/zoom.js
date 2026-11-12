/* ============================================================
   Sabbath Calendar v2 — timeline/zoom.js
   The zoom ladder (doc 11 §6) and the viewport in BigInt days.
   A viewport never spans more than it can show; pixel positions
   are computed from (jdn − start), which is small enough to be
   converted to Number at any zoom for drawing purposes.
   ============================================================ */

import { toBigInt, floorDiv } from '../core/bigint-math.js';

const DAYS_PER_YEAR_X10000 = 3652425n;   // 365.2425 × 10^4
const yearsToDays = (years) => (toBigInt(years) * DAYS_PER_YEAR_X10000) / 10000n;

/** Fixed levels; beyond them, 'e<k>' levels span 10^k years. */
const FIXED = [
  { id: 'day', label: 'Day', spanDays: 21n },
  { id: 'week', label: 'Week', spanDays: 7n * 20n },
  { id: 'month', label: 'Month', spanDays: 730n },
  { id: 'year', label: 'Year', spanDays: yearsToDays(20n) },
  { id: 'decade', label: 'Decade', spanDays: yearsToDays(200n) },
  { id: 'century', label: 'Century', spanDays: yearsToDays(2000n) },
  { id: 'millennium', label: 'Millennium', spanDays: yearsToDays(20000n) },
];
export const MIN_EXP = 5, MAX_EXP = 40;

/** All level ids in order, from finest to coarsest. */
export const LEVEL_IDS = Object.freeze([...FIXED.map(l => l.id), ...Array.from({ length: MAX_EXP - MIN_EXP + 1 }, (_, i) => `e${MIN_EXP + i}`)]);

/** @param {string} id */
export function level(id) {
  const f = FIXED.find(l => l.id === id);
  if (f) return f;
  const m = /^e(\d+)$/.exec(id);
  if (m) {
    const k = Number(m[1]);
    if (k >= MIN_EXP && k <= MAX_EXP) return { id, label: `10^${k} years`, spanDays: yearsToDays(10n ** BigInt(k)) };
  }
  throw new RangeError(`unknown zoom level ${id}`);
}

export function isLevel(id) { return LEVEL_IDS.includes(id); }
export function zoomIn(id) { const i = LEVEL_IDS.indexOf(id); return LEVEL_IDS[Math.max(0, i - 1)]; }
export function zoomOut(id) { const i = LEVEL_IDS.indexOf(id); return LEVEL_IDS[Math.min(LEVEL_IDS.length - 1, i + 1)]; }

/**
 * @typedef {Object} Viewport
 * @property {bigint} start first JDN shown (inclusive)
 * @property {bigint} end last JDN shown (inclusive)
 * @property {bigint} spanDays
 * @property {number} widthPx
 * @property {number} pxPerDay
 * @property {(jdn: bigint) => number} x pixel x of the start of day jdn
 * @property {(px: number) => bigint} jdnAt JDN under pixel x
 */

/**
 * Viewport centred on the cursor.
 * @param {bigint} cursorJdn
 * @param {string} levelId
 * @param {number} widthPx
 * @returns {Viewport}
 */
export function viewport(cursorJdn, levelId, widthPx) {
  const cursor = toBigInt(cursorJdn, 'cursorJdn');
  const span = level(levelId).spanDays;
  const start = cursor - floorDiv(span, 2n);
  const end = start + span - 1n;
  const pxPerDay = widthPx / Number(span);
  return Object.freeze({
    start, end, spanDays: span, widthPx, pxPerDay,
    x: (jdn) => Number(toBigInt(jdn) - start) * pxPerDay,
    jdnAt: (px) => start + BigInt(Math.floor(px / pxPerDay)),
  });
}

/** Pan the cursor by a fraction of the viewport (negative = backward). */
export function panDays(levelId, fraction) {
  const span = level(levelId).spanDays;
  const scaled = (span * BigInt(Math.round(fraction * 1000))) / 1000n;
  return scaled === 0n ? (fraction < 0 ? -1n : 1n) : scaled;
}
