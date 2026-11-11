/* ============================================================
   Sabbath Calendar v2 — calendars/gregorian.js
   Proleptic Gregorian calendar adapter (doc 07 §3, REQ-CAL-05).
   Algorithm: the baseline's js/calendar.js routines (Richards /
   Fliegel–Van Flandern form), ported to BigInt with floor division.
   Certainty: EXACT from 15 Oct 1582 (JDN 2,299,161; the Roman
   reform; national adoption dates are not modeled), CONVENTIONAL
   (proleptic) before that, UNSUPPORTED beyond ±10^9 years.
   ============================================================ */

import { toBigInt, floorDiv } from '../core/bigint-math.js';
import { Certainty, unsupported, support, assertAdapter } from './adapter.js';
import { formatCivil, validateYMD, CIVIL_FIELDS } from './civil-common.js';

export const ID = 'gregorian';
export const SOURCE_ID = 'richards-2013;baseline-js-calendar';
/** First day of the Gregorian calendar as promulgated in Rome: Friday 15 October 1582. */
export const REFORM_JDN = 2299161n;
export const DECLARED_YEAR_LIMIT = 10n ** 9n;

/** @param {bigint} y astronomical */
export function isLeapYear(y) {
  const year = toBigInt(y, 'year');
  return (year % 4n === 0n && year % 100n !== 0n) || year % 400n === 0n;
}

const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** @param {bigint} y @param {number} m 1..12 */
export function daysInMonth(y, m) {
  return m === 2 ? (isLeapYear(y) ? 29 : 28) : DIM[m - 1];
}

/** Proleptic Gregorian (astronomical year) → JDN. Pure BigInt; no range check. */
export function jdnFromGregorian(year, month, day) {
  const y0 = toBigInt(year, 'year'), m0 = BigInt(month), d0 = BigInt(day);
  const a = floorDiv(14n - m0, 12n);
  const y = y0 + 4800n - a;
  const m = m0 + 12n * a - 3n;
  return d0 + floorDiv(153n * m + 2n, 5n) + 365n * y + floorDiv(y, 4n) - floorDiv(y, 100n) + floorDiv(y, 400n) - 32045n;
}

/** JDN → proleptic Gregorian (astronomical year). Pure BigInt; no range check. */
export function gregorianFromJdn(jdn) {
  const j = toBigInt(jdn, 'jdn');
  const a = j + 32044n;
  const b = floorDiv(4n * a + 3n, 146097n);
  const c = a - floorDiv(146097n * b, 4n);
  const d = floorDiv(4n * c + 3n, 1461n);
  const e = c - floorDiv(1461n * d, 4n);
  const m = floorDiv(5n * e + 2n, 153n);
  return {
    year: 100n * b + d - 4800n + floorDiv(m, 10n),
    month: Number(m + 3n - 12n * floorDiv(m, 10n)),
    day: Number(e - floorDiv(153n * m + 2n, 5n) + 1n),
  };
}

const MIN_JDN = jdnFromGregorian(-DECLARED_YEAR_LIMIT, 1, 1);
const MAX_JDN = jdnFromGregorian(DECLARED_YEAR_LIMIT, 12, 31);
const RANGE_REASON = `label outside the declared range of ±${DECLARED_YEAR_LIMIT} years`;

function fromJdn(jdn) {
  const j = toBigInt(jdn, 'jdn');
  if (j < MIN_JDN || j > MAX_JDN) return unsupported(RANGE_REASON);
  const g = gregorianFromJdn(j);
  return Object.freeze({ calendarId: ID, ...g });
}

function toJdn(date) {
  const d = validateYMD(ID, date, daysInMonth);
  const j = jdnFromGregorian(d.year, d.month, d.day);
  if (j < MIN_JDN || j > MAX_JDN) return unsupported(RANGE_REASON);
  return j;
}

function supportOf(jdn) {
  const j = toBigInt(jdn, 'jdn');
  if (j < MIN_JDN || j > MAX_JDN) return support(Certainty.UNSUPPORTED, RANGE_REASON, SOURCE_ID);
  if (j >= REFORM_JDN) {
    return support(Certainty.EXACT, 'Gregorian calendar in force (Roman reform of 15 Oct 1582; national adoption dates vary and are not modeled)', SOURCE_ID);
  }
  return support(Certainty.CONVENTIONAL, 'proleptic Gregorian: the calendar did not exist before 15 Oct 1582; label is the standard backward extension', SOURCE_ID);
}

function nextBoundary(jdn, unit) {
  const j = toBigInt(jdn, 'jdn');
  const d = fromJdn(j);
  if (d.unsupported) return d;
  if (unit === 'month') return d.month === 12 ? toJdn({ year: d.year + 1n, month: 1, day: 1 }) : toJdn({ year: d.year, month: d.month + 1, day: 1 });
  if (unit === 'year') return toJdn({ year: d.year + 1n, month: 1, day: 1 });
  throw new TypeError(`unknown unit ${unit}`);
}

export const gregorian = assertAdapter(Object.freeze({
  id: ID,
  name: 'Gregorian',
  variant: 'proleptic Gregorian, astronomical year numbering',
  mathRange: Object.freeze({ minJdn: MIN_JDN, maxJdn: MAX_JDN }),
  fields: CIVIL_FIELDS,
  fromJdn,
  toJdn,
  support: supportOf,
  format: (d, opts) => formatCivil(d, opts),
  nextBoundary,
  isLeapYear,
  daysInMonth,
}));
