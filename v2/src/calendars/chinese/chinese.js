/* ============================================================
   Sabbath Calendar v2 — calendars/chinese/chinese.js
   Chinese calendar adapter, modern rules (doc 07 §5, REQ-CAL-09,
   ADR-006): months begin on the civil day of the astronomical new
   moon; the winter solstice falls in month 11; a leap month is the
   first month of a 13-month sui without a major solar term (zhongqi);
   true (apparent) sun for solar terms. Algorithm: Dershowitz &
   Reingold, Calendrical Calculations, "Chinese calendar" chapter,
   on JDN day numbers with the astronomy in ./astronomy.js.
   Reference meridian: UTC+8 (120°E) from 1929; Beijing local mean
   time (116°25′E = UTC+7:45:40) before 1929, as in D&R and in the
   Hong Kong Observatory tables.
   Certainty: EXACT 1929–2100 (downgraded to APPROXIMATE when the
   month's new moon is within 2 minutes of local midnight, or a
   major solar term within 15 minutes of a month-boundary midnight);
   APPROXIMATE 1645–1928 and 2101–2200; UNSUPPORTED otherwise —
   no fabricated dynastic dates.
   Year representation (doc 10 §5): `year` is the Gregorian year in
   which the Chinese year began; extras carry the sexagenary name,
   cycle number (2637 BCE epoch convention) and year in cycle.
   ============================================================ */

import { toBigInt } from '../../core/bigint-math.js';
import { Certainty, unsupported, support, assertAdapter, CalendarDateError } from '../adapter.js';
import { jdnFromGregorian, gregorianFromJdn } from '../gregorian.js';
import {
  MEAN_SYNODIC_MONTH, MEAN_TROPICAL_YEAR, solarLongitude, solarLongitudeAtOrAfter,
  newMoonAtOrAfterUt, newMoonBeforeUt, ttFromUt, utFromTt,
} from './astronomy.js';

export const ID = 'chinese';
export const SOURCE_ID = 'dershowitz-reingold-2018-chinese;meeus-1998;hko-tables';

export const STEMS = Object.freeze(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']);
export const BRANCHES = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']);
export const STEMS_PINYIN = Object.freeze(['jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui']);
export const BRANCHES_PINYIN = Object.freeze(['zi', 'chou', 'yin', 'mao', 'chen', 'si', 'wu', 'wei', 'shen', 'you', 'xu', 'hai']);
export const ANIMALS = Object.freeze(['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig']);

/** Conventional epoch: 15 February 2637 BC (proleptic Gregorian), start of cycle 1 (Number JDN). */
export const EPOCH_JDN = Number(jdnFromGregorian(-2636n, 2, 15));

/** Declared ranges (Gregorian years). */
export const MIN_YEAR = 1645, MAX_YEAR = 2200, EXACT_FROM = 1929, EXACT_TO = 2100;
const MIN_JDN = jdnFromGregorian(BigInt(MIN_YEAR), 1, 1);
const MAX_JDN = jdnFromGregorian(BigInt(MAX_YEAR), 12, 31);
const RANGE_REASON = `no defensible Chinese calendar label outside ${MIN_YEAR}–${MAX_YEAR} CE (pre-1645 calendars used different definitions and are not reconstructed in this version)`;

/** Borderline thresholds. New-moon instants are good to ~1 minute (Meeus ch. 49 + ΔT); solar
 * longitude to ~15 minutes (Meeus ch. 25 low-accuracy series). Every month start 1929–2100 was
 * verified against the Hong Kong Observatory tables, so these only guard the residual uncertainty. */
const NEW_MOON_BORDERLINE_MINUTES = 2;
const SOLAR_TERM_BORDERLINE_MINUTES = 15;

/* ---------- time zone of the Chinese calendar ---------- */

/** Hours east of UTC used for the civil day containing JDN `d`. */
export function zoneHours(d) {
  return gregorianYearOf(d) < 1929 ? 1397 / 180 : 8;   // 7h45m40s Beijing LMT, else UTC+8
}
function gregorianYearOf(d) { return Number(gregorianFromJdn(BigInt(d)).year); }

/** UT Julian Date of local midnight that begins civil day `d`. */
function midnightUt(d) { return d - 0.5 - zoneHours(d) / 24; }
/** Civil day (JDN) containing the UT instant, in the zone that applies around it. */
function localDayOf(jdUt) {
  const guess = Math.floor(jdUt + 8 / 24 + 0.5);
  return Math.floor(jdUt + zoneHours(guess) / 24 + 0.5);
}

/* ---------- astronomical day-level primitives (D&R) ---------- */

/** Civil day of the first new moon on or after day `d`. */
export function newMoonOnOrAfter(d) { return localDayOf(newMoonAtOrAfterUt(midnightUt(d))); }
/** Civil day of the last new moon before day `d`. */
export function newMoonBefore(d) { return localDayOf(newMoonBeforeUt(midnightUt(d))); }

/** Apparent solar longitude at the local midnight that begins day `d`. */
function longitudeAtMidnight(d) { return solarLongitude(ttFromUt(midnightUt(d))); }

/** Index 1..12 of the last major solar term (zhongqi) on or before day `d` (1 = 330°, Yushui; 12 = 300°). */
export function currentMajorSolarTerm(d) {
  const s = longitudeAtMidnight(d);
  return ((2 + Math.floor(s / 30) - 1) % 12 + 12) % 12 + 1;   // amod(2 + floor(s/30), 12)
}

/** Civil day containing the last winter solstice on or before day `d`. */
export function winterSolsticeOnOrBefore(d) {
  const m = midnightUt(d + 1);
  let s = utFromTt(solarLongitudeAtOrAfter(ttFromUt(m - 370), 270));
  const s2 = utFromTt(solarLongitudeAtOrAfter(ttFromUt(s + 300), 270));
  if (s2 < m) s = s2;
  return localDayOf(s);
}

/** The month beginning on day `d` (a new-moon day) contains no major solar term. */
function noMajorSolarTerm(d) {
  return currentMajorSolarTerm(d) === currentMajorSolarTerm(newMoonOnOrAfter(d + 1));
}

/** Is there a leap month on or after the month starting `mPrime` and before the month starting `m`? */
function priorLeapMonth(mPrime, m) {
  while (m >= mPrime) {
    if (noMajorSolarTerm(m)) return true;
    m = newMoonBefore(m);
  }
  return false;
}

/** Chinese New Year in the sui (solstice-to-solstice year) containing day `d`. */
export function newYearInSui(d) {
  const s1 = winterSolsticeOnOrBefore(d);
  const s2 = winterSolsticeOnOrBefore(s1 + 370);
  const m12 = newMoonOnOrAfter(s1 + 1);
  const m13 = newMoonOnOrAfter(m12 + 1);
  const nextM11 = newMoonBefore(s2 + 1);
  const leapSui = Math.round((nextM11 - m12) / MEAN_SYNODIC_MONTH) === 12;
  if (leapSui && (noMajorSolarTerm(m12) || noMajorSolarTerm(m13))) return newMoonOnOrAfter(m13 + 1);
  return m13;
}

/** Chinese New Year on or before day `d`. */
export function newYearOnOrBefore(d) {
  const ny = newYearInSui(d);
  return d >= ny ? ny : newYearInSui(d - 180);
}

/**
 * Chinese date of civil day `d` (Number JDN).
 * @returns {{cycle: number, yearInCycle: number, month: number, leap: boolean, day: number, monthStart: number, nextMonthStart: number}}
 */
export function chineseFromJdn(d) {
  const s1 = winterSolsticeOnOrBefore(d);
  const s2 = winterSolsticeOnOrBefore(s1 + 370);
  const m12 = newMoonOnOrAfter(s1 + 1);
  const nextM11 = newMoonBefore(s2 + 1);
  const m = newMoonBefore(d + 1);
  const leapYear = Math.round((nextM11 - m12) / MEAN_SYNODIC_MONTH) === 12;
  let month = Math.round((m - m12) / MEAN_SYNODIC_MONTH) - (leapYear && priorLeapMonth(m12, m) ? 1 : 0);
  month = ((month - 1) % 12 + 12) % 12 + 1;   // amod(…, 12)
  const leap = leapYear && noMajorSolarTerm(m) && !priorLeapMonth(m12, newMoonBefore(m));
  const elapsedYears = Math.floor(1.5 - month / 12 + (d - EPOCH_JDN) / MEAN_TROPICAL_YEAR);
  const cycle = Math.floor((elapsedYears - 1) / 60) + 1;
  const yearInCycle = ((elapsedYears - 1) % 60 + 60) % 60 + 1;
  return { cycle, yearInCycle, month, leap, day: d - m + 1, monthStart: m, nextMonthStart: newMoonOnOrAfter(m + 1) };
}

/** JDN of a Chinese date given by cycle/year-in-cycle (D&R fixed-from-chinese). */
export function jdnFromChineseCycle(cycle, yearInCycle, month, leap, day) {
  const midYear = Math.floor(EPOCH_JDN + ((cycle - 1) * 60 + yearInCycle - 1 + 0.5) * MEAN_TROPICAL_YEAR);
  const newYear = newYearOnOrBefore(midYear);
  const p = newMoonOnOrAfter(newYear + (month - 1) * 29);
  const dd = chineseFromJdn(p);
  const priorNewMoon = (dd.month === month && dd.leap === leap) ? p : newMoonOnOrAfter(p + 1);
  return priorNewMoon + day - 1;
}

/** Sexagenary name of year-in-cycle 1..60, e.g. 43 → 丙午 (bing-wu), Horse. */
export function sexagenary(yearInCycle) {
  const s = (yearInCycle - 1) % 10, b = (yearInCycle - 1) % 12;
  return { stem: STEMS[s], branch: BRANCHES[b], name: STEMS[s] + BRANCHES[b], pinyin: `${STEMS_PINYIN[s]}-${BRANCHES_PINYIN[b]}`, animal: ANIMALS[b] };
}

/* ---------- borderline detection ---------- */

/** Minutes between the new moon that starts the month containing `d` and the local midnight that starts its civil day. */
function newMoonMarginMinutes(monthStart) {
  const nm = newMoonAtOrAfterUt(midnightUt(monthStart) - 1.5);  // the new moon falls within the civil day monthStart
  const local = nm + zoneHours(monthStart) / 24 + 0.5;
  const frac = local - Math.floor(local);
  return Math.min(frac, 1 - frac) * 1440;
}

/** Minutes between the nearest major solar term and the local midnight starting a month-boundary day, for the month containing d. */
function solarTermMarginMinutes(monthStart, nextMonthStart) {
  let worst = Infinity;
  for (const boundary of [monthStart, nextMonthStart]) {
    const m = midnightUt(boundary);
    const lam = Math.floor(longitudeAtMidnight(boundary) / 30) * 30;
    for (const target of [lam, (lam + 30) % 360]) {
      const t = utFromTt(solarLongitudeAtOrAfter(ttFromUt(m - 2), target));
      worst = Math.min(worst, Math.abs(t - m) * 1440);
    }
  }
  return worst;
}

/* ---------- adapter ---------- */

function inRange(j) { return j >= MIN_JDN && j <= MAX_JDN; }

function fromJdn(jdn) {
  const j = toBigInt(jdn, 'jdn');
  if (!inRange(j)) return unsupported(RANGE_REASON);
  const d = Number(j);
  const c = chineseFromJdn(d);
  const ny = newYearOnOrBefore(d);
  const gy = gregorianYearOf(ny);
  const sx = sexagenary(c.yearInCycle);
  return Object.freeze({
    calendarId: ID,
    year: BigInt(gy),
    month: c.month,
    day: c.day,
    leapMonth: c.leap,
    era: { name: 'cycle', yearInEra: BigInt(c.cycle) },
    extras: Object.freeze({
      cycle: c.cycle, yearInCycle: c.yearInCycle, stemBranch: sx.name, pinyin: sx.pinyin, animal: sx.animal,
      newYearJdn: BigInt(ny), monthStartJdn: BigInt(c.monthStart), nextMonthStartJdn: BigInt(c.nextMonthStart),
      newMoonMarginMinutes: Math.round(newMoonMarginMinutes(c.monthStart) * 10) / 10,
    }),
  });
}

function validate(date) {
  if (date.calendarId !== undefined && date.calendarId !== ID) throw new CalendarDateError(`expected a chinese date, got ${date.calendarId}`);
  const year = Number(toBigInt(date.year, 'year'));
  const month = Number(date.month), day = Number(date.day), leap = Boolean(date.leapMonth);
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new CalendarDateError(`month must be 1..12, got ${date.month}`);
  if (!Number.isInteger(day) || day < 1 || day > 30) throw new CalendarDateError(`day must be 1..30, got ${date.day}`);
  return { year, month, day, leap };
}

function toJdn(date) {
  const v = validate(date);
  // A Chinese year that began in December/January of MIN_YEAR − 1 still has days inside the range.
  if (v.year < MIN_YEAR - 1 || v.year > MAX_YEAR) return unsupported(RANGE_REASON);
  const ny = newYearOnOrBefore(Number(jdnFromGregorian(BigInt(v.year), 7, 1)));
  const p = newMoonOnOrAfter(ny + (v.month - 1) * 29);
  const dd = chineseFromJdn(p);
  const monthStart = (dd.month === v.month && dd.leap === v.leap) ? p : newMoonOnOrAfter(p + 1);
  const j = monthStart + v.day - 1;
  const back = chineseFromJdn(j);
  if (back.month !== v.month || back.leap !== v.leap || back.day !== v.day) {
    throw new CalendarDateError(`no such date: year ${v.year}, ${v.leap ? 'leap ' : ''}month ${v.month}, day ${v.day}`);
  }
  if (!inRange(BigInt(j))) return unsupported(RANGE_REASON);
  return BigInt(j);
}

function supportOf(jdn) {
  const j = toBigInt(jdn, 'jdn');
  if (!inRange(j)) return support(Certainty.UNSUPPORTED, RANGE_REASON, SOURCE_ID);
  const d = Number(j);
  const gy = gregorianYearOf(d);
  if (gy < EXACT_FROM) return support(Certainty.APPROXIMATE, '1645–1928: Beijing local mean time and historical computation differences can shift a month start by a day near midnight new moons', SOURCE_ID);
  if (gy > EXACT_TO) return support(Certainty.APPROXIMATE, '2101–2200: ΔT and ephemeris uncertainty', SOURCE_ID);
  const c = chineseFromJdn(d);
  const nmMargin = newMoonMarginMinutes(c.monthStart);
  if (nmMargin < NEW_MOON_BORDERLINE_MINUTES) return support(Certainty.APPROXIMATE, `the month's new moon is ${nmMargin.toFixed(1)} minutes from local midnight; the official month start could differ by a day`, SOURCE_ID);
  const stMargin = solarTermMarginMinutes(c.monthStart, c.nextMonthStart);
  if (stMargin < SOLAR_TERM_BORDERLINE_MINUTES) return support(Certainty.APPROXIMATE, `a major solar term is ${stMargin.toFixed(1)} minutes from a month-boundary midnight; leap-month assignment could differ`, SOURCE_ID);
  return support(Certainty.EXACT, 'modern rules (GB/T 33661-2017 definitions), UTC+8, ephemeris accurate for 1929–2100', SOURCE_ID);
}

function nextBoundary(jdn, unit) {
  const j = toBigInt(jdn, 'jdn');
  if (!inRange(j)) return unsupported(RANGE_REASON);
  const d = Number(j);
  if (unit === 'month') return BigInt(newMoonOnOrAfter(d + 1));
  if (unit === 'year') return BigInt(newYearOnOrBefore(newYearOnOrBefore(d) + 400));
  throw new TypeError(`unknown unit ${unit}`);
}

function format(d) {
  return `${d.extras.stemBranch} (${d.extras.pinyin}, ${d.extras.animal}) year ${d.year}, ${d.leapMonth ? 'leap ' : ''}month ${d.month}, day ${d.day}`;
}

export const chinese = assertAdapter(Object.freeze({
  id: ID,
  name: 'Chinese',
  variant: 'modern astronomical rules (post-1645 definitions), UTC+8 from 1929 / Beijing LMT before',
  mathRange: Object.freeze({ minJdn: MIN_JDN, maxJdn: MAX_JDN }),
  fields: Object.freeze([
    { key: 'year', label: 'Gregorian year in which the Chinese year began', min: MIN_YEAR, max: MAX_YEAR },
    { key: 'month', label: 'Month', min: 1, max: 12 },
    { key: 'leapMonth', label: 'Leap month (閏)' },
    { key: 'day', label: 'Day', min: 1, max: 30 },
  ]),
  fromJdn,
  toJdn,
  support: supportOf,
  format,
  nextBoundary,
}));
