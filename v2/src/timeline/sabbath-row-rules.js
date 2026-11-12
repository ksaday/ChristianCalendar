/* ============================================================
   Sabbath Calendar v2 — timeline/sabbath-row-rules.js
   Presentation rules of the Sabbath row, ported verbatim in
   behavior from the baseline (COMPAT-07, COMPAT-08):
   - Anniversary Sabbath: first Saturday on/after proleptic-Gregorian
     4 April of a year; year 33 → the anchor; labelled "Nth year since
     the Resurrection week".
   - Milestone: every 1,000th Sabbath, n ≥ 1.
   ============================================================ */

import { ANCHOR_JDN, isSabbath, nextSabbath } from '../core/chronology.js';
import { toBigInt } from '../core/bigint-math.js';
import { jdnFromGregorian, gregorianFromJdn } from '../calendars/gregorian.js';

/** JDN of the Anniversary Sabbath of proleptic-Gregorian year y (baseline annivJdnOfYear). */
export function anniversaryJdnOfYear(year) {
  const y = toBigInt(year, 'year');
  if (y === 33n) return ANCHOR_JDN;
  return nextSabbath(jdnFromGregorian(y, 4, 4));
}

/**
 * Baseline annivInfo(): 0 for the anchor itself, N ≥ 1 for the Nth anniversary,
 * null for any other day (including anniversaries of years ≤ 33 other than the anchor).
 * @param {bigint} jdn
 * @returns {bigint|null}
 */
export function anniversaryOf(jdn) {
  const j = toBigInt(jdn, 'jdn');
  if (j === ANCHOR_JDN) return 0n;
  if (!isSabbath(j)) return null;
  const g = gregorianFromJdn(j);
  if (g.month !== 4 || g.day < 2 || g.day > 10) return null;
  if (j !== anniversaryJdnOfYear(g.year)) return null;
  const years = g.year - 33n;
  return years > 0n ? years : null;
}

/** Baseline milestone rule. */
export function isMilestone(n) {
  const v = toBigInt(n, 'n');
  return v >= 1n && v % 1000n === 0n;
}
