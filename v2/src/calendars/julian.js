/* ============================================================
   Sabbath Calendar v2 — calendars/julian.js
   Proleptic Julian calendar adapter (doc 07 §3, REQ-CAL-06).
   Leap year every 4th year (astronomical year divisible by 4),
   applied proleptically; the 45 BC – AD 8 irregularity is NOT
   modeled (approved default D9). Certainty: EXACT from 1 Jan AD 8
   to 4 Oct 1582 (Rome), CONVENTIONAL elsewhere within range
   (proleptic before 45 BC; regularized 45 BC – AD 8; after the
   1582 reform the Julian rule is unchanged but civil use varies by
   country), UNSUPPORTED beyond ±10^9 years.
   The anchor reads 4 April AD 33 in this calendar (COMPAT-06).
   ============================================================ */

import { toBigInt, floorDiv } from '../core/bigint-math.js';
import { Certainty, unsupported, support, assertAdapter } from './adapter.js';
import { formatCivil, validateYMD, CIVIL_FIELDS } from './civil-common.js';

export const ID = 'julian';
export const SOURCE_ID = 'richards-2013;meeus-1998';
export const DECLARED_YEAR_LIMIT = 10n ** 9n;

/** @param {bigint} y astronomical */
export function isLeapYear(y) {
  return toBigInt(y, 'year') % 4n === 0n;
}

const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export function daysInMonth(y, m) {
  return m === 2 ? (isLeapYear(y) ? 29 : 28) : DIM[m - 1];
}

/** Proleptic Julian (astronomical year) → JDN. */
export function jdnFromJulian(year, month, day) {
  const y0 = toBigInt(year, 'year'), m0 = BigInt(month), d0 = BigInt(day);
  const a = floorDiv(14n - m0, 12n);
  const y = y0 + 4800n - a;
  const m = m0 + 12n * a - 3n;
  return d0 + floorDiv(153n * m + 2n, 5n) + 365n * y + floorDiv(y, 4n) - 32083n;
}

/** JDN → proleptic Julian (astronomical year). */
export function julianFromJdn(jdn) {
  const j = toBigInt(jdn, 'jdn');
  const c = j + 32082n;
  const d = floorDiv(4n * c + 3n, 1461n);
  const e = c - floorDiv(1461n * d, 4n);
  const m = floorDiv(5n * e + 2n, 153n);
  return {
    year: d - 4800n + floorDiv(m, 10n),
    month: Number(m + 3n - 12n * floorDiv(m, 10n)),
    day: Number(e - floorDiv(153n * m + 2n, 5n) + 1n),
  };
}

/** 1 January 45 BC (astronomical −44): institution of the Julian calendar. */
export const INSTITUTION_JDN = jdnFromJulian(-44n, 1, 1);     // 1,704,987
/** 1 January AD 8: leap-year rule regular from here (Augustan correction complete). */
export const REGULAR_FROM_JDN = jdnFromJulian(8n, 1, 1);
/** 4 October 1582: last Julian day of the Roman civil calendar. */
export const LAST_ROMAN_JDN = jdnFromJulian(1582n, 10, 4);     // 2,299,160

const MIN_JDN = jdnFromJulian(-DECLARED_YEAR_LIMIT, 1, 1);
const MAX_JDN = jdnFromJulian(DECLARED_YEAR_LIMIT, 12, 31);
const RANGE_REASON = `label outside the declared range of ±${DECLARED_YEAR_LIMIT} years`;

function fromJdn(jdn) {
  const j = toBigInt(jdn, 'jdn');
  if (j < MIN_JDN || j > MAX_JDN) return unsupported(RANGE_REASON);
  return Object.freeze({ calendarId: ID, ...julianFromJdn(j) });
}

function toJdn(date) {
  const d = validateYMD(ID, date, daysInMonth);
  const j = jdnFromJulian(d.year, d.month, d.day);
  if (j < MIN_JDN || j > MAX_JDN) return unsupported(RANGE_REASON);
  return j;
}

function supportOf(jdn) {
  const j = toBigInt(jdn, 'jdn');
  if (j < MIN_JDN || j > MAX_JDN) return support(Certainty.UNSUPPORTED, RANGE_REASON, SOURCE_ID);
  if (j < INSTITUTION_JDN) return support(Certainty.CONVENTIONAL, 'proleptic Julian: the calendar was instituted on 1 Jan 45 BC', SOURCE_ID);
  if (j < REGULAR_FROM_JDN) return support(Certainty.CONVENTIONAL, '45 BC – AD 8: leap days were applied irregularly; shown with the regular proleptic rule', SOURCE_ID);
  if (j <= LAST_ROMAN_JDN) return support(Certainty.EXACT, 'Julian calendar in civil use (Rome) until 4 Oct 1582', SOURCE_ID);
  return support(Certainty.CONVENTIONAL, 'after the 1582 reform: the Julian rule is unchanged, but civil use varies by country (e.g. Russia to 1918) and is not modeled', SOURCE_ID);
}

function nextBoundary(jdn, unit) {
  const d = fromJdn(toBigInt(jdn, 'jdn'));
  if (d.unsupported) return d;
  if (unit === 'month') return d.month === 12 ? toJdn({ year: d.year + 1n, month: 1, day: 1 }) : toJdn({ year: d.year, month: d.month + 1, day: 1 });
  if (unit === 'year') return toJdn({ year: d.year + 1n, month: 1, day: 1 });
  throw new TypeError(`unknown unit ${unit}`);
}

export const julian = assertAdapter(Object.freeze({
  id: ID,
  name: 'Julian',
  variant: 'proleptic Julian, astronomical year numbering, regular leap rule',
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
