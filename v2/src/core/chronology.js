/* ============================================================
   Sabbath Calendar v2 — core/chronology.js
   The Chronology Core (doc 06). Pure integer arithmetic on
   Julian Day Numbers (JDN) and Sabbath indices, both BigInt.

   AXIOMS (immutable; inherited from the ChristianCalendar project):
     ANCHOR_JDN   = 1733205   Sabbath #1 = Saturday, 4 April AD 33 (Julian)
     CYCLE_LENGTH = 7
     SabbathJDN(n) = ANCHOR_JDN + 7 × (n − 1)   for every integer n

   Conventions:
     Day of week = floorMod(JDN, 7): 0 = Mon … 5 = Sat, 6 = Sun (baseline, ADR-012)
     Cycle n     = [SabbathJDN(n) − 6, SabbathJDN(n)], Sunday → Saturday,
                   numbered by the Sabbath that ends it (ADR-003)

   This module contains no calendar, Creation, sunset, location,
   clock, locale or DOM logic (REQ-CORE-01, REQ-CORE-13, REQ-GEN-01).
   ============================================================ */

import { toBigInt, floorDiv, floorMod } from './bigint-math.js';

/** Sabbath #1. JDN of Saturday, 4 April AD 33 (Julian) = 2 April AD 33 (proleptic Gregorian). */
export const ANCHOR_JDN = 1733205n;

/** Length of one cycle in days. */
export const CYCLE_LENGTH = 7n;

/** Day-of-week names indexed by dayOfWeek(): 0 = Monday … 6 = Sunday. */
export const DAY_NAMES = Object.freeze(
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

/** Day-of-week value of every Sabbath. */
export const SABBATH_DAY_OF_WEEK = 5;

/** Position of the Sabbath within its cycle (Sunday = 1 … Saturday = 7). */
export const SABBATH_POSITION = 7;

/* ---------- Sabbath index ↔ JDN ---------- */

/**
 * D1. JDN of Sabbath #n: ANCHOR_JDN + 7 × (n − 1). Direct computation, O(1).
 * @param {bigint|number|string} n Sabbath index (any integer: negative, zero, positive)
 * @returns {bigint} JDN
 */
export function sabbathJdn(n) {
  const index = toBigInt(n, 'sabbath index');
  return ANCHOR_JDN + CYCLE_LENGTH * (index - 1n);
}

/**
 * D2. Whether a JDN is a Sabbath (a Saturday of the unbroken cycle).
 * @param {bigint|number|string} jdn
 * @returns {boolean}
 */
export function isSabbath(jdn) {
  const j = toBigInt(jdn, 'jdn');
  return floorMod(j - ANCHOR_JDN, CYCLE_LENGTH) === 0n;
}

/**
 * Marker returned by sabbathIndexOf() for a day that is not a Sabbath.
 * It is a value, not an exception, and carries enough to recover without a
 * second call (doc 06 §5).
 * @typedef {Object} NotASabbath
 * @property {'NotASabbath'} kind
 * @property {bigint} jdn
 * @property {bigint} cycle
 * @property {number} positionInCycle 1..6
 * @property {bigint} previousSabbath strictly before jdn
 * @property {bigint} nextSabbath strictly after jdn
 */

/**
 * @param {unknown} x
 * @returns {x is NotASabbath}
 */
export function isNotASabbath(x) {
  return typeof x === 'object' && x !== null && x.kind === 'NotASabbath';
}

/**
 * D3. Sabbath index of a Sabbath day; a NotASabbath value otherwise.
 * Never returns a fraction (REQ-CORE-05).
 * @param {bigint|number|string} jdn
 * @returns {bigint|NotASabbath}
 */
export function sabbathIndexOf(jdn) {
  const j = toBigInt(jdn, 'jdn');
  const offset = j - ANCHOR_JDN;
  const r = floorMod(offset, CYCLE_LENGTH);
  if (r === 0n) return offset / CYCLE_LENGTH + 1n;   // exact: offset is a multiple of 7
  return Object.freeze({
    kind: 'NotASabbath',
    jdn: j,
    cycle: cycleOf(j),
    positionInCycle: positionInCycle(j),
    previousSabbath: j - r,
    nextSabbath: j + (CYCLE_LENGTH - r),
  });
}

/* ---------- Cycles ---------- */

/**
 * D4. Cycle index of any day: floorDiv(j − A + 6, 7) + 1.
 * Cycle n is the closed interval [sabbathJdn(n) − 6, sabbathJdn(n)].
 * @param {bigint|number|string} jdn
 * @returns {bigint}
 */
export function cycleOf(jdn) {
  const j = toBigInt(jdn, 'jdn');
  return floorDiv(j - ANCHOR_JDN + (CYCLE_LENGTH - 1n), CYCLE_LENGTH) + 1n;
}

/**
 * First (Sunday) and last (Saturday = the Sabbath) JDN of cycle n.
 * @param {bigint|number|string} n
 * @returns {{first: bigint, last: bigint}}
 */
export function cycleBounds(n) {
  const last = sabbathJdn(n);
  return { first: last - (CYCLE_LENGTH - 1n), last };
}

/**
 * D6. Position within the cycle: Sunday = 1 … Saturday = 7, i.e. floorMod(j − A + 6, 7) + 1.
 * @param {bigint|number|string} jdn
 * @returns {number} 1..7
 */
export function positionInCycle(jdn) {
  const j = toBigInt(jdn, 'jdn');
  const r = floorMod(j - ANCHOR_JDN, CYCLE_LENGTH);   // 0 on a Sabbath, 1 on the Sunday after, … 6 on Friday
  return r === 0n ? SABBATH_POSITION : Number(r);
}

/**
 * D5. Day of week: floorMod(jdn, 7) with 0 = Monday … 5 = Saturday, 6 = Sunday.
 * @param {bigint|number|string} jdn
 * @returns {number} 0..6
 */
export function dayOfWeek(jdn) {
  const j = toBigInt(jdn, 'jdn');
  return Number(floorMod(j, CYCLE_LENGTH));
}

/* ---------- Adjacent Sabbaths ---------- */

/**
 * D7. Latest Sabbath on or before jdn (returns jdn itself when it is a Sabbath).
 * @param {bigint|number|string} jdn
 * @returns {bigint}
 */
export function previousSabbath(jdn) {
  const j = toBigInt(jdn, 'jdn');
  return j - floorMod(j - ANCHOR_JDN, CYCLE_LENGTH);
}

/**
 * D7. Earliest Sabbath on or after jdn (returns jdn itself when it is a Sabbath).
 * @param {bigint|number|string} jdn
 * @returns {bigint}
 */
export function nextSabbath(jdn) {
  const j = toBigInt(jdn, 'jdn');
  return j + floorMod(ANCHOR_JDN - j, CYCLE_LENGTH);
}

/** Latest Sabbath strictly before jdn. */
export function previousSabbathStrict(jdn) {
  return previousSabbath(toBigInt(jdn, 'jdn') - 1n);
}

/** Earliest Sabbath strictly after jdn. */
export function nextSabbathStrict(jdn) {
  return nextSabbath(toBigInt(jdn, 'jdn') + 1n);
}

/* ---------- Distances ---------- */

/** Number of seven-day periods from Sabbath #n to Sabbath #m (m − n). */
export function weeksBetween(n, m) {
  return toBigInt(m, 'm') - toBigInt(n, 'n');
}

/** Number of days from JDN a to JDN b (b − a). */
export function daysBetween(a, b) {
  return toBigInt(b, 'b') - toBigInt(a, 'a');
}

/** Days from the anchor to jdn (jdn − ANCHOR_JDN); the baseline popover's "Days since anchor". */
export function daysSinceAnchor(jdn) {
  return toBigInt(jdn, 'jdn') - ANCHOR_JDN;
}

/* ---------- Bundle ---------- */

/**
 * @typedef {Object} DayDescriptor
 * @property {bigint} jdn
 * @property {number} dayOfWeek 0 = Mon … 6 = Sun
 * @property {string} dayName
 * @property {boolean} isSabbath
 * @property {bigint|null} sabbathIndex null unless isSabbath
 * @property {bigint} cycle
 * @property {number} positionInCycle 1 = Sun … 7 = Sat
 * @property {bigint} cycleFirst Sunday of the cycle
 * @property {bigint} cycleLast Saturday of the cycle (= sabbathJdn(cycle))
 * @property {bigint} previousSabbath ≤ jdn
 * @property {bigint} nextSabbath ≥ jdn
 * @property {bigint} daysSinceAnchor
 */

/**
 * Everything the core knows about one day, computed directly.
 * @param {bigint|number|string} jdn
 * @returns {DayDescriptor}
 */
export function describeDay(jdn) {
  const j = toBigInt(jdn, 'jdn');
  const r = floorMod(j - ANCHOR_JDN, CYCLE_LENGTH);
  const sabbath = r === 0n;
  const cycle = floorDiv(j - ANCHOR_JDN + (CYCLE_LENGTH - 1n), CYCLE_LENGTH) + 1n;
  const cycleLast = ANCHOR_JDN + CYCLE_LENGTH * (cycle - 1n);
  const dow = Number(floorMod(j, CYCLE_LENGTH));
  return Object.freeze({
    jdn: j,
    dayOfWeek: dow,
    dayName: DAY_NAMES[dow],
    isSabbath: sabbath,
    sabbathIndex: sabbath ? (j - ANCHOR_JDN) / CYCLE_LENGTH + 1n : null,
    cycle,
    positionInCycle: r === 0n ? SABBATH_POSITION : Number(r),
    cycleFirst: cycleLast - (CYCLE_LENGTH - 1n),
    cycleLast,
    previousSabbath: j - r,
    nextSabbath: sabbath ? j : j + (CYCLE_LENGTH - r),
    daysSinceAnchor: j - ANCHOR_JDN,
  });
}
