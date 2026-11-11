/* ============================================================
   Sabbath Calendar v2 — calendars/civil-common.js
   Shared helpers for the Gregorian and Julian adapters: month
   names, era labels (astronomical year ↔ BC/AD), date validation,
   formatting. Astronomical year numbering internally: 0 = 1 BC,
   −1 = 2 BC (ADR-013). "Year 0" is never printed.
   ============================================================ */

import { toBigInt } from '../core/bigint-math.js';
import { CalendarDateError } from './adapter.js';

export const MONTH_NAMES = Object.freeze([
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']);

/**
 * Era label for an astronomical year.
 * @param {bigint} year astronomical
 * @param {'BC/AD'|'BCE/CE'} [style]
 * @returns {{name: string, yearInEra: bigint}}
 */
export function eraOf(year, style = 'BC/AD') {
  const y = toBigInt(year, 'year');
  if (y <= 0n) return { name: style === 'BCE/CE' ? 'BCE' : 'BC', yearInEra: 1n - y };
  return { name: style === 'BCE/CE' ? 'CE' : 'AD', yearInEra: y };
}

/**
 * Convert an era-based year to astronomical: ("BC", 5) → −4; ("AD", 33) → 33.
 * @param {string} eraName 'BC' | 'BCE' | 'AD' | 'CE'
 * @param {bigint|number|string} yearInEra ≥ 1
 */
export function astronomicalYear(eraName, yearInEra) {
  const y = toBigInt(yearInEra, 'yearInEra');
  if (y < 1n) throw new CalendarDateError('year in era must be ≥ 1 (there is no year 0)');
  if (eraName === 'BC' || eraName === 'BCE') return 1n - y;
  if (eraName === 'AD' || eraName === 'CE') return y;
  throw new CalendarDateError(`unknown era ${eraName}`);
}

/**
 * Year label following the baseline's convention: "AD 33" for years 1–999,
 * plain "2026" from 1000 on, "19 BC" for years ≤ 0 (astronomical).
 * @param {bigint} year astronomical
 * @param {'BC/AD'|'BCE/CE'} [style]
 */
export function yearLabel(year, style = 'BC/AD') {
  const y = toBigInt(year, 'year');
  const era = eraOf(y, style);
  if (y <= 0n) return `${era.yearInEra} ${era.name}`;
  if (y < 1000n) return style === 'BCE/CE' ? `${y} CE` : `AD ${y}`;
  return `${y}`;
}

/**
 * Validate month/day against a month-length function; throws CalendarDateError.
 * @param {string} calendarId
 * @param {{calendarId?: string, year: any, month: number, day: number}} d
 * @param {(year: bigint, month: number) => number} daysInMonth
 * @returns {{year: bigint, month: number, day: number}}
 */
export function validateYMD(calendarId, d, daysInMonth) {
  if (d.calendarId !== undefined && d.calendarId !== calendarId) {
    throw new CalendarDateError(`expected a ${calendarId} date, got ${d.calendarId}`);
  }
  const year = toBigInt(d.year, 'year');
  const month = Number(d.month), day = Number(d.day);
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new CalendarDateError(`month must be 1..12, got ${d.month}`);
  const dim = daysInMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > dim) throw new CalendarDateError(`day must be 1..${dim} for month ${month}, got ${d.day}`);
  return { year, month, day };
}

/**
 * "4 April AD 33", "19 July 5509 BC", "11 April 2026".
 * @param {{year: bigint, month: number, day: number}} d
 * @param {{era?: 'BC/AD'|'BCE/CE'}} [opts]
 */
export function formatCivil(d, opts = {}) {
  return `${d.day} ${MONTH_NAMES[d.month - 1]} ${yearLabel(d.year, opts.era)}`;
}

/** Field specification for the lookup form (doc 10 §2). */
export const CIVIL_FIELDS = Object.freeze([
  { key: 'year', label: 'Year (with era)', min: 1 },
  { key: 'month', label: 'Month', min: 1, max: 12 },
  { key: 'day', label: 'Day', min: 1, max: 31 },
]);
