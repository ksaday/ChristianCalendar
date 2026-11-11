/* ============================================================
   Sabbath Calendar v2 — calendars/hebrew.js
   Hebrew (Jewish) calendar adapter: the fixed arithmetic
   ("calculated", rabbinic) calendar (doc 07 §4, REQ-CAL-08, ADR-005).
   Rules: 19-year cycle (leap years 3,6,8,11,14,17,19), molad of
   Tishri, the four dehiyyot, year lengths 353/354/355 and
   383/384/385, Adar I (month 12) + Adar II (13) in leap years.
   Algorithm: Dershowitz & Reingold, Calendrical Calculations,
   "Hebrew calendar" chapter, expressed in BigInt on R.D. fixed days.
   Month numbering (D&R): 1 = Nisan … 6 = Elul, 7 = Tishri, 8 = Marheshvan,
   9 = Kislev, 10 = Tevet, 11 = Shevat, 12 = Adar (Adar I in leap years), 13 = Adar II.
   Epoch: 1 Tishri AM 1 = R.D. −1,373,427 = JDN 347,998 = Monday 7 Oct 3761 BC (Julian).
   Day boundary: the label is the Hebrew date covering the civil day's
   daytime; the Hebrew day began at the previous sunset (not computed, ADR-004).
   Certainty: EXACT from 1 Tishri AM 4683 (autumn 922 CE), CONVENTIONAL
   earlier (fixed rules uncertain 359–921 CE; observational before 359 CE),
   UNSUPPORTED outside AM 1 … AM 10,000.
   ============================================================ */

import { toBigInt, floorDiv, floorMod } from '../core/bigint-math.js';
import { Certainty, unsupported, support, assertAdapter, CalendarDateError } from './adapter.js';

export const ID = 'hebrew';
export const SOURCE_ID = 'dershowitz-reingold-2018-hebrew';

/** JDN = R.D. + 1,721,425 (R.D. 1 = Monday 1 January AD 1, proleptic Gregorian). */
const RD_TO_JDN = 1721425n;
/** R.D. of 1 Tishri AM 1. */
export const HEBREW_EPOCH_RD = -1373427n;
export const HEBREW_EPOCH_JDN = HEBREW_EPOCH_RD + RD_TO_JDN;   // 347,998

export const MIN_YEAR = 1n;
export const MAX_YEAR = 10000n;

export const MONTH_NAMES = Object.freeze([
  '', 'Nisan', 'Iyyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
  'Tishri', 'Marheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar', 'Adar II']);

export const NISAN = 1, ELUL = 6, TISHRI = 7, MARHESHVAN = 8, KISLEV = 9, ADAR = 12, ADAR_II = 13;

/** Leap year: mod(7y + 1, 19) < 7. */
export function isLeapYear(year) {
  return floorMod(7n * toBigInt(year, 'year') + 1n, 19n) < 7n;
}

export function lastMonthOfYear(year) {
  return isLeapYear(year) ? ADAR_II : ADAR;
}

/** Days from the epoch's molad to the (uncorrected) molad-based new year of `year`. */
function calendarElapsedDays(year) {
  const y = toBigInt(year, 'year');
  const monthsElapsed = floorDiv(235n * y - 234n, 19n);
  const partsElapsed = 12084n + 13753n * monthsElapsed;
  const day = 29n * monthsElapsed + floorDiv(partsElapsed, 25920n);
  return floorMod(3n * (day + 1n), 7n) < 3n ? day + 1n : day;
}

/** Postponement so that no year has 356 or 382 days. */
function yearLengthCorrection(year) {
  const y = toBigInt(year, 'year');
  const ny0 = calendarElapsedDays(y - 1n), ny1 = calendarElapsedDays(y), ny2 = calendarElapsedDays(y + 1n);
  if (ny2 - ny1 === 356n) return 2n;
  if (ny1 - ny0 === 382n) return 1n;
  return 0n;
}

/** R.D. of 1 Tishri of `year`. */
export function newYearRd(year) {
  const y = toBigInt(year, 'year');
  return HEBREW_EPOCH_RD + calendarElapsedDays(y) + yearLengthCorrection(y);
}

/** JDN of 1 Tishri of `year`. */
export function newYearJdn(year) {
  return newYearRd(year) + RD_TO_JDN;
}

export function daysInYear(year) {
  const y = toBigInt(year, 'year');
  return Number(newYearRd(y + 1n) - newYearRd(y));
}

export function isLongMarheshvan(year) { const n = daysInYear(year); return n === 355 || n === 385; }
export function isShortKislev(year) { const n = daysInYear(year); return n === 353 || n === 383; }

/** @param {bigint} year @param {number} month 1..13 */
export function daysInMonth(year, month) {
  const y = toBigInt(year, 'year');
  if (month === 2 || month === 4 || month === 6 || month === 10 || month === ADAR_II) return 29;
  if (month === ADAR && !isLeapYear(y)) return 29;
  if (month === MARHESHVAN && !isLongMarheshvan(y)) return 29;
  if (month === KISLEV && isShortKislev(y)) return 29;
  return 30;
}

/** Kind of year by length: deficient (353/383), regular (354/384), complete (355/385). */
export function yearType(year) {
  const n = daysInYear(year) % 30;   // 23, 24, 25
  return n === 23 ? 'deficient' : n === 24 ? 'regular' : 'complete';
}

/** Hebrew date → R.D. (no range check; validation done by the adapter). */
export function rdFromHebrew(year, month, day) {
  const y = toBigInt(year, 'year');
  let rd = newYearRd(y) + BigInt(day) - 1n;
  if (month < TISHRI) {
    const last = lastMonthOfYear(y);
    for (let m = TISHRI; m <= last; m++) rd += BigInt(daysInMonth(y, m));
    for (let m = NISAN; m < month; m++) rd += BigInt(daysInMonth(y, m));
  } else {
    for (let m = TISHRI; m < month; m++) rd += BigInt(daysInMonth(y, m));
  }
  return rd;
}

/** R.D. → Hebrew date {year, month, day}. */
export function hebrewFromRd(rd) {
  const r = toBigInt(rd, 'rd');
  const approx = floorDiv((r - HEBREW_EPOCH_RD) * 98496n, 35975351n) + 1n;
  let year = approx - 1n;
  while (newYearRd(year + 1n) <= r) year += 1n;
  const start = r < rdFromHebrew(year, NISAN, 1) ? TISHRI : NISAN;
  let month = start;
  while (r > rdFromHebrew(year, month, daysInMonth(year, month))) month += 1;
  const day = Number(r - rdFromHebrew(year, month, 1) + 1n);
  return { year, month, day };
}

/* ---------- adapter ---------- */

const MIN_JDN = newYearJdn(MIN_YEAR);
const MAX_JDN = newYearJdn(MAX_YEAR + 1n) - 1n;
const RANGE_REASON = `outside the declared range AM ${MIN_YEAR} – AM ${MAX_YEAR}`;

/** 1 Tishri AM 4683 = autumn 922 CE: fixed rules documented and followed from here (Stern 2019). */
export const EXACT_FROM_JDN = newYearJdn(4683n);
/** 1 Tishri AM 4120 = autumn 359 CE: traditional date of Hillel II's fixed calendar. */
export const FIXED_TRADITION_FROM_JDN = newYearJdn(4120n);

function validate(d) {
  if (d.calendarId !== undefined && d.calendarId !== ID) throw new CalendarDateError(`expected a hebrew date, got ${d.calendarId}`);
  const year = toBigInt(d.year, 'year');
  const month = Number(d.month), day = Number(d.day);
  const last = lastMonthOfYear(year);
  if (!Number.isInteger(month) || month < 1 || month > last) throw new CalendarDateError(`month must be 1..${last} for AM ${year}, got ${d.month}`);
  const dim = daysInMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > dim) throw new CalendarDateError(`day must be 1..${dim} for month ${month} of AM ${year}, got ${d.day}`);
  return { year, month, day };
}

function fromJdn(jdn) {
  const j = toBigInt(jdn, 'jdn');
  if (j < MIN_JDN || j > MAX_JDN) return unsupported(RANGE_REASON);
  const h = hebrewFromRd(j - RD_TO_JDN);
  const leap = isLeapYear(h.year);
  return Object.freeze({
    calendarId: ID,
    year: h.year,
    month: h.month,
    day: h.day,
    leapMonth: leap && h.month === ADAR_II,
    era: { name: 'AM', yearInEra: h.year },
    extras: Object.freeze({ isLeapYear: leap, yearType: yearType(h.year), monthName: monthName(h.year, h.month) }),
  });
}

function toJdn(date) {
  const d = validate(date);
  if (d.year < MIN_YEAR || d.year > MAX_YEAR) return unsupported(RANGE_REASON);
  return rdFromHebrew(d.year, d.month, d.day) + RD_TO_JDN;
}

/** "Adar I" / "Adar II" in leap years, "Adar" otherwise. */
export function monthName(year, month) {
  if (month === ADAR) return isLeapYear(year) ? 'Adar I' : 'Adar';
  return MONTH_NAMES[month];
}

function supportOf(jdn) {
  const j = toBigInt(jdn, 'jdn');
  if (j < MIN_JDN || j > MAX_JDN) return support(Certainty.UNSUPPORTED, RANGE_REASON, SOURCE_ID);
  if (j >= EXACT_FROM_JDN) return support(Certainty.EXACT, 'fixed arithmetic calendar in its modern form (documented from the 921/2 CE controversy)', SOURCE_ID);
  if (j >= FIXED_TRADITION_FROM_JDN) return support(Certainty.CONVENTIONAL, '359–921 CE: a fixed calendar existed in some form, but its exact rules are uncertain; calculated label may differ from the historical one', SOURCE_ID);
  return support(Certainty.CONVENTIONAL, 'before 359 CE the calendar was observational; this is the calculated (proleptic) label and the historically observed date may differ by a day or a month', SOURCE_ID);
}

function nextBoundary(jdn, unit) {
  const d = fromJdn(toBigInt(jdn, 'jdn'));
  if (d.unsupported) return d;
  if (unit === 'year') return d.year + 1n > MAX_YEAR ? unsupported(RANGE_REASON) : newYearJdn(d.year + 1n);
  if (unit === 'month') {
    if (d.month === ELUL) return toJdn({ year: d.year + 1n, month: TISHRI, day: 1 });
    if (d.month === lastMonthOfYear(d.year)) return toJdn({ year: d.year, month: NISAN, day: 1 });
    return toJdn({ year: d.year, month: d.month + 1, day: 1 });
  }
  throw new TypeError(`unknown unit ${unit}`);
}

function format(d) {
  return `${d.day} ${monthName(d.year, d.month)} AM ${d.year}`;
}

export const hebrew = assertAdapter(Object.freeze({
  id: ID,
  name: 'Hebrew',
  variant: 'fixed arithmetic (rabbinic) calendar, Dershowitz–Reingold formulation',
  mathRange: Object.freeze({ minJdn: MIN_JDN, maxJdn: MAX_JDN }),
  fields: Object.freeze([
    { key: 'year', label: 'Year (AM)', min: 1, max: 10000 },
    { key: 'month', label: 'Month (1 = Nisan … 7 = Tishri … 12 = Adar/Adar I, 13 = Adar II)', min: 1, max: 13 },
    { key: 'day', label: 'Day', min: 1, max: 30 },
  ]),
  fromJdn,
  toJdn,
  support: supportOf,
  format,
  nextBoundary,
  isLeapYear,
  daysInMonth,
  daysInYear,
  newYearJdn,
}));
