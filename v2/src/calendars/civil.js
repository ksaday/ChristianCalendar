/* ============================================================
   Sabbath Calendar v2 — calendars/civil.js
   The civil date as written in a region at the time (doc 18):
   the Roman Julian calendar of 45 BC – AD 8 by a chosen scholarly
   reconstruction (roadmap 5.7), then Julian — with England's
   25-March legal year and Sweden's 1700–1712 calendar — then
   Gregorian from the region's own switch (roadmap 5.4).
   Only labels change; every day keeps its JDN, so the seven-day
   cycle is untouched. Pure: imports only core and sibling files.
   ============================================================ */

import { toBigInt } from '../core/bigint-math.js';
import { Certainty, CalendarDateError, unsupported, isUnsupported, support, assertAdapter } from './adapter.js';
import { MONTH_NAMES, yearLabel, CIVIL_FIELDS } from './civil-common.js';
import { jdnFromJulian, julianFromJdn } from './julian.js';
import { gregorian, jdnFromGregorian, gregorianFromJdn } from './gregorian.js';

export const SOURCE_ID = 'wikipedia-julian-calendar;wikipedia-gregorian-adoption;wikipedia-old-style-new-style';

/* ---------- 5.7: early Julian reconstructions ---------- */

/** Leap years BC (as printed) and the AD year regular leap years resume. Wikipedia "Julian calendar", retrieved 2026-11-13. */
export const RECONSTRUCTIONS = Object.freeze([
  { id: 'bennett', name: 'Bennett (2003)', leapBC: [44, 41, 38, 35, 32, 29, 26, 23, 20, 17, 14, 11, 8], resumeAD: 4 },
  { id: 'soltau', name: 'Soltau (1889)', leapBC: [45, 41, 38, 35, 32, 29, 26, 23, 20, 17, 14, 11], resumeAD: 8 },
  { id: 'matzat', name: 'Matzat (1883)', leapBC: [44, 41, 38, 35, 32, 29, 26, 23, 20, 17, 14, 11], resumeAD: 4 },
  { id: 'ideler', name: 'Ideler (1825)', leapBC: [45, 42, 39, 36, 33, 30, 27, 24, 21, 18, 15, 12, 9], resumeAD: 8 },
  { id: 'kepler', name: 'Kepler (1614)', leapBC: [43, 40, 37, 34, 31, 28, 25, 22, 19, 16, 13, 10], resumeAD: 8 },
  { id: 'harriot', name: 'Harriot (after 1610)', leapBC: [43, 40, 37, 34, 31, 28, 25, 22, 19, 16, 13, 10], resumeAD: 4 },
  { id: 'bunting', name: 'Bünting (1590)', leapBC: [45, 42, 39, 36, 33, 30, 27, 24, 21, 18, 15, 12], resumeAD: 4 },
  { id: 'christmann', name: 'Christmann (1590)', leapBC: [43, 40, 37, 34, 31, 28, 25, 22, 19, 16, 13, 10], resumeAD: 7 },
  { id: 'scaliger', name: 'Scaliger (1583)', leapBC: [42, 39, 36, 33, 30, 27, 24, 21, 18, 15, 12, 9], resumeAD: 8 },
].map(Object.freeze));
export const DEFAULT_RECONSTRUCTION = 'bennett';

const FIRST_ROMAN_YEAR = -44;          // 45 BC, astronomical
const ANCHOR_YEAR = 12;                // every reconstruction agrees with the proleptic calendar by AD 12
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const prolepticLeap = (y) => ((y % 4) + 4) % 4 === 0;

/** Day of year (0-based) → month/day, the leap day being a doubled 24 February (dies bissextus). */
function monthDayBis(doy, leap) {
  if (leap) { if (doy === 55) return { month: 2, day: 24, bis: true }; if (doy > 55) doy -= 1; }
  let m = 0; while (doy >= DIM[m]) { doy -= DIM[m]; m++; }
  return { month: m + 1, day: doy + 1, bis: false };
}
function dayOfYearBis(month, day, bis, leap) {
  let doy = 0; for (let m = 1; m < month; m++) doy += DIM[m - 1];
  doy += day - 1;
  if (leap && (month > 2 || (month === 2 && (day > 24 || (day === 24 && bis))))) doy += 1;
  return doy;
}

const reconCache = new Map();
/** Year starts, leap rule, first Roman day and first aligned day of a reconstruction. */
export function reconstruction(id = DEFAULT_RECONSTRUCTION) {
  if (reconCache.has(id)) return reconCache.get(id);
  const r = RECONSTRUCTIONS.find(x => x.id === id);
  if (!r) throw new RangeError(`unknown reconstruction ${id}`);
  const leapSet = new Set(r.leapBC.map(bc => 1 - bc));
  const isLeap = (y) => (y >= r.resumeAD ? prolepticLeap(y) : leapSet.has(y));
  const starts = new Map();
  let s = Number(jdnFromJulian(BigInt(ANCHOR_YEAR), 1, 1));
  starts.set(ANCHOR_YEAR, s);
  for (let y = ANCHOR_YEAR - 1; y >= FIRST_ROMAN_YEAR; y--) { s -= 365 + (isLeap(y) ? 1 : 0); starts.set(y, s); }
  const label = (j) => { let y = FIRST_ROMAN_YEAR; while (y < ANCHOR_YEAR && starts.get(y + 1) <= j) y++; return { year: y, ...monthDayBis(j - starts.get(y), isLeap(y)) }; };
  const prolepticBis = (j) => { const y = Number(julianFromJdn(BigInt(j)).year); return { year: y, ...monthDayBis(j - Number(jdnFromJulian(BigInt(y), 1, 1)), prolepticLeap(y)) }; };
  // first aligned day: from here on the Roman label equals the proleptic one (same bissextile convention)
  let aligned = starts.get(ANCHOR_YEAR);
  for (let j = aligned - 1; j >= starts.get(FIRST_ROMAN_YEAR); j--) {
    const a = label(j), b = prolepticBis(j);
    if (a.year !== b.year || a.month !== b.month || a.day !== b.day || a.bis !== b.bis) break;
    aligned = j;
  }
  const out = Object.freeze({ ...r, isLeap, startJdn: BigInt(starts.get(FIRST_ROMAN_YEAR)), alignedJdn: BigInt(aligned), label: (j) => label(Number(j)), yearStart: (y) => starts.get(Number(y)) });
  reconCache.set(id, out);
  return out;
}

/* ---------- 5.4: regions ---------- */

const J = 'julian';
/** last: the last day of the old calendar as printed; first: the first Gregorian day. Astronomical years. */
export const REGIONS = Object.freeze([
  { id: 'rome', name: 'Rome (Papal States) and Italy', short: 'Rome', prev: J, last: [1582, 10, 4], first: [1582, 10, 15] },
  { id: 'spain', name: 'Spain and the Spanish Empire', short: 'Spain', prev: J, last: [1582, 10, 4], first: [1582, 10, 15] },
  { id: 'portugal', name: 'Portugal and the Portuguese Empire', short: 'Portugal', prev: J, last: [1582, 10, 4], first: [1582, 10, 15] },
  { id: 'poland', name: 'Poland (Crown)', short: 'Poland', prev: J, last: [1582, 10, 4], first: [1582, 10, 15] },
  { id: 'france', name: 'France', short: 'France', prev: J, last: [1582, 12, 9], first: [1582, 12, 20] },
  { id: 'brabant', name: 'Southern Netherlands (Brabant, Zeeland, Flanders)', short: 'Brabant', prev: J, last: [1582, 12, 14], first: [1582, 12, 25] },
  { id: 'holland', name: 'Netherlands: Holland', short: 'Holland', prev: J, last: [1583, 1, 1], first: [1583, 1, 12] },
  { id: 'bavaria', name: 'Bavaria', short: 'Bavaria', prev: J, last: [1583, 10, 5], first: [1583, 10, 16] },
  { id: 'austria', name: 'Austria (Lower and Upper)', short: 'Austria', prev: J, last: [1583, 10, 20], first: [1583, 10, 31] },
  { id: 'catholic-germany', name: 'Catholic German states (e.g. Mainz)', short: 'Cath. Germany', prev: J, last: [1583, 11, 11], first: [1583, 11, 22] },
  { id: 'bohemia', name: 'Bohemia', short: 'Bohemia', prev: J, last: [1584, 1, 6], first: [1584, 1, 17] },
  { id: 'hungary', name: 'Hungary', short: 'Hungary', prev: J, last: [1587, 10, 21], first: [1587, 11, 1] },
  { id: 'protestant-germany', name: 'Protestant German states', short: 'Prot. Germany', prev: J, last: [1700, 2, 18], first: [1700, 3, 1] },
  { id: 'denmark-norway', name: 'Denmark–Norway', short: 'Denmark–Norway', prev: J, last: [1700, 2, 18], first: [1700, 3, 1], weekdays: ['Sunday', 'Monday'] },
  { id: 'iceland', name: 'Iceland', short: 'Iceland', prev: J, last: [1700, 11, 16], first: [1700, 11, 28] },
  { id: 'swiss-protestant', name: 'Protestant Switzerland (Basel, Bern, Zürich, Geneva)', short: 'Prot. Switzerland', prev: J, last: [1700, 12, 31], first: [1701, 1, 12] },
  { id: 'britain', name: 'Great Britain (England and Wales), Ireland and the colonies', short: 'Britain', prev: J, last: [1752, 9, 2], first: [1752, 9, 14], weekdays: ['Wednesday', 'Thursday'], marchYear: [1156, 1751] },
  { id: 'scotland', name: 'Scotland', short: 'Scotland', prev: J, last: [1752, 9, 2], first: [1752, 9, 14], weekdays: ['Wednesday', 'Thursday'], marchYear: [1156, 1599] },
  { id: 'sweden', name: 'Sweden and Finland', short: 'Sweden', prev: J, last: [1753, 2, 17], first: [1753, 3, 1], weekdays: ['Wednesday', 'Thursday'], swedish: true },
  { id: 'albania', name: 'Albania', short: 'Albania', prev: J, last: [1912, 11, 14], first: [1912, 11, 28] },
  { id: 'bulgaria', name: 'Bulgaria', short: 'Bulgaria', prev: J, last: [1916, 3, 31], first: [1916, 4, 14] },
  { id: 'russia', name: 'Russia', short: 'Russia', prev: J, last: [1918, 1, 31], first: [1918, 2, 14], weekdays: ['Wednesday', 'Thursday'] },
  { id: 'ukraine-estonia', name: 'Ukraine and Estonia', short: 'Ukraine/Estonia', prev: J, last: [1918, 2, 15], first: [1918, 3, 1] },
  { id: 'serbia', name: 'Serbia and Montenegro', short: 'Serbia', prev: J, last: [1919, 1, 14], first: [1919, 1, 28] },
  { id: 'romania', name: 'Romania', short: 'Romania', prev: J, last: [1919, 3, 31], first: [1919, 4, 14] },
  { id: 'greece', name: 'Greece', short: 'Greece', prev: J, last: [1923, 2, 15], first: [1923, 3, 1], weekdays: ['Wednesday', 'Thursday'] },
  { id: 'egypt', name: 'Egypt', short: 'Egypt', prev: 'the Coptic calendar', first: [1875, 9, 11] },
  { id: 'japan', name: 'Japan', short: 'Japan', prev: 'the Japanese lunisolar calendar', first: [1873, 1, 1] },
  { id: 'korea', name: 'Korea', short: 'Korea', prev: 'the Korean lunisolar calendar', first: [1896, 1, 1] },
  { id: 'china', name: 'China', short: 'China', prev: 'the Chinese lunisolar calendar (see the Chinese row)', first: [1912, 1, 1] },
].map(r => Object.freeze({
  ...r,
  switchJdn: r.prev === J ? jdnFromJulian(BigInt(r.last[0]), r.last[1], r.last[2]) + 1n : jdnFromGregorian(BigInt(r.first[0]), r.first[1], r.first[2]),
})));
export const DEFAULT_REGION = 'rome';

export function getRegion(id) { const r = REGIONS.find(x => x.id === id); if (!r) throw new RangeError(`unknown region ${id}`); return r; }

// Sweden: 29 Feb 1700 was omitted, so from (Julian) 29 Feb 1700 the Swedish label is one day ahead of Julian,
// until 30 February 1712 (= Julian 29 Feb 1712) brought it back. Wikipedia "Swedish calendar", retrieved 2026-11-13.
const SWEDISH_FROM = jdnFromJulian(1700n, 2, 29);
const SWEDISH_FEB30 = jdnFromJulian(1712n, 2, 29);

/* ---------- the adapter ---------- */

const sameLabel = (a, b) => a.year === b.year && a.month === b.month && a.day === b.day && Boolean(a.bis) === Boolean(b.bis);
const cache = new Map();

/**
 * Civil-date adapter for a region and an early-Julian reconstruction.
 * @param {string} [regionId]
 * @param {string} [reconId]
 */
export function civilAdapter(regionId = DEFAULT_REGION, reconId = DEFAULT_RECONSTRUCTION) {
  const key = `${regionId}|${reconId}`;
  if (cache.has(key)) return cache.get(key);
  const region = getRegion(regionId);
  const recon = reconstruction(reconId);
  const julianLineage = region.prev === J;
  const minJdn = julianLineage ? recon.startJdn : region.switchJdn;
  const maxJdn = gregorian.mathRange.maxJdn;

  function fromJdn(jdn) {
    const j = toBigInt(jdn, 'jdn');
    if (j > maxJdn) return unsupported('label outside the declared range');
    if (j >= region.switchJdn) { const g = gregorianFromJdn(j); return Object.freeze({ calendarId: 'civil', calendar: 'gregorian', ...g }); }
    if (!julianLineage) return unsupported(`${region.name} used ${region.prev} before ${region.first[2]} ${MONTH_NAMES[region.first[1] - 1]} ${region.first[0]}`);
    if (j < recon.startJdn) return unsupported('before 1 January 45 BC: the pre-Julian Roman republican calendar is not modeled');
    if (j < recon.alignedJdn) { const r = recon.label(j); return Object.freeze({ calendarId: 'civil', calendar: 'roman', year: BigInt(r.year), month: r.month, day: r.day, bis: r.bis }); }
    if (region.swedish && j >= SWEDISH_FROM && j <= SWEDISH_FEB30) {
      if (j === SWEDISH_FEB30) return Object.freeze({ calendarId: 'civil', calendar: 'swedish', year: 1712n, month: 2, day: 30 });
      return Object.freeze({ calendarId: 'civil', calendar: 'swedish', ...julianFromJdn(j + 1n) });
    }
    const d = julianFromJdn(j);
    const mr = region.marchYear;
    const dual = mr && d.year >= BigInt(mr[0]) && d.year <= BigInt(mr[1]) && (d.month < 3 || (d.month === 3 && d.day < 25));
    return Object.freeze({ calendarId: 'civil', calendar: 'julian', ...d, ...(dual ? { legalYear: d.year - 1n } : {}) });
  }

  function toJdn(date) {
    const year = toBigInt(date.year, 'year');
    const month = Number(date.month), day = Number(date.day), bis = Boolean(date.bis);
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new CalendarDateError(`month must be 1..12, got ${date.month}`);
    if (!Number.isInteger(day) || day < 1 || day > 31) throw new CalendarDateError(`day must be 1..31, got ${date.day}`);
    const want = { year, month, day, bis };
    const candidates = [];
    candidates.push(jdnFromGregorian(year, month, day), jdnFromJulian(year, month, day));
    if (region.swedish) { candidates.push(jdnFromJulian(year, month, day) - 1n); if (year === 1712n && month === 2 && day === 30) candidates.push(SWEDISH_FEB30); }
    const y = Number(year);
    if (julianLineage && y >= FIRST_ROMAN_YEAR && y <= ANCHOR_YEAR) candidates.push(BigInt(recon.yearStart(y) + dayOfYearBis(month, day, bis, recon.isLeap(y))));
    for (const c of candidates) {
      const d = fromJdn(c);
      if (!isUnsupported(d) && sameLabel(d, want)) return c;
    }
    // a date whose Julian reading is on or after the switch but whose Gregorian reading is before it was skipped
    if (julianLineage && jdnFromJulian(year, month, day) >= region.switchJdn && jdnFromGregorian(year, month, day) < region.switchJdn) {
      return unsupported(`${day} ${MONTH_NAMES[month - 1]} ${year} did not occur in ${region.short}: skipped at the change to the Gregorian calendar`);
    }
    return unsupported(`no such date in ${region.short}`);
  }

  function supportOf(jdn) {
    const j = toBigInt(jdn, 'jdn');
    const d = fromJdn(j);
    if (isUnsupported(d)) return support(Certainty.UNSUPPORTED, d.reason, SOURCE_ID);
    if (d.calendar === 'roman') return support(Certainty.APPROXIMATE, `Roman Julian calendar 45 BC – AD 8 as reconstructed by ${recon.name}: leap days every third year, then suspended; other reconstructions differ by up to two days`, SOURCE_ID);
    if (d.calendar === 'swedish') return support(Certainty.EXACT, 'Swedish calendar 1700–1712: one day ahead of the Julian calendar after the omitted leap day of 1700', SOURCE_ID);
    if (d.calendar === 'julian') return support(Certainty.EXACT, `Julian calendar in civil use in ${region.short} until ${region.last[2]} ${MONTH_NAMES[region.last[1] - 1]} ${region.last[0]}${d.legalYear !== undefined ? '; the legal year began on 25 March' : ''}`, SOURCE_ID);
    return support(Certainty.EXACT, `Gregorian calendar in civil use in ${region.short} from ${region.first[2]} ${MONTH_NAMES[region.first[1] - 1]} ${region.first[0]}`, SOURCE_ID);
  }

  function format(d, opts = {}) {
    if (d.calendar === 'roman') return `${d.day} ${MONTH_NAMES[d.month - 1]}${d.bis ? ' (bis)' : ''} ${yearLabel(d.year, opts.era)} (Roman, ${recon.name})`;
    if (d.calendar === 'swedish') return `${d.day} ${MONTH_NAMES[d.month - 1]} ${d.year} (Swedish calendar)`;
    if (d.calendar === 'julian') {
      let y = yearLabel(d.year, opts.era);
      if (d.legalYear !== undefined) {
        const a = String(d.legalYear), b = String(d.year);
        y = a.slice(0, -2) === b.slice(0, -2) ? `${a}/${b.slice(-2)}` : `${a}/${b}`;
      }
      return `${d.day} ${MONTH_NAMES[d.month - 1]} ${y} (Julian${region.id === 'britain' || region.id === 'scotland' ? ', Old Style' : ''})`;
    }
    return `${d.day} ${MONTH_NAMES[d.month - 1]} ${yearLabel(d.year, opts.era)} (Gregorian)`;
  }

  function nextBoundary(jdn, unit) {
    const j = toBigInt(jdn, 'jdn');
    const cur = fromJdn(j);
    if (isUnsupported(cur)) return j < minJdn ? minJdn : cur;
    if (unit === 'month') {
      for (let k = j + 1n; k <= j + 64n; k++) {
        const d = fromJdn(k);
        if (isUnsupported(d)) return d;
        if (d.month !== cur.month || d.year !== cur.year) return k;
      }
      return unsupported('no month boundary found');
    }
    if (unit === 'year') {
      const t = toJdn({ year: cur.year + 1n, month: 1, day: 1 });
      if (!isUnsupported(t) && t > j) return t;
      let k = j;
      for (let i = 0; i < 14; i++) { k = nextBoundary(k, 'month'); if (isUnsupported(k)) return k; if (fromJdn(k).year !== cur.year) return k; }
      return unsupported('no year boundary found');
    }
    throw new TypeError(`unknown unit ${unit}`);
  }

  const adapter = assertAdapter(Object.freeze({
    id: 'civil', region, reconstruction: recon,
    name: `Civil · ${region.short}`,
    variant: `civil date as written in ${region.name}`,
    mathRange: Object.freeze({ minJdn, maxJdn }),
    fields: CIVIL_FIELDS,
    fromJdn, toJdn, support: supportOf, format, nextBoundary,
  }));
  cache.set(key, adapter);
  return adapter;
}

/** Labels of one day under every reconstruction (for the cursor card), or null outside 45 BC – AD 4. */
export function romanLabels(jdn, era) {
  const j = toBigInt(jdn, 'jdn');
  const any = RECONSTRUCTIONS.some(r => { const x = reconstruction(r.id); return j >= x.startJdn - 2n && j < x.alignedJdn; });
  if (!any) return null;
  return RECONSTRUCTIONS.map(r => {
    const a = civilAdapter(DEFAULT_REGION, r.id);
    const d = a.fromJdn(j);
    return { id: r.id, name: r.name, label: isUnsupported(d) ? null : a.format(d, { era }).replace(/ \(Roman, .*\)$/, '').replace(/ \(Julian\)$/, ''), roman: !isUnsupported(d) && d.calendar === 'roman', reason: isUnsupported(d) ? d.reason : null };
  });
}
