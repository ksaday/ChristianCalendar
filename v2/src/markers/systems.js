/* ============================================================
   Sabbath Calendar v2 — markers/systems.js
   Chronological systems for Bible events (doc 17 §3) and the
   year-to-position rule (§3.1): a dated event is a claimed DAY
   (one JDN) or a YEAR BAND (first and last JDN of a year in the
   system's own reckoning). Nothing here is used by the engine.
   ============================================================ */

import { toBigInt } from '../core/bigint-math.js';
import { jdnFromJulian } from '../calendars/julian.js';
import { jdnFromGregorian } from '../calendars/gregorian.js';
import { newYearJdn, MIN_YEAR as HEB_MIN_YEAR, MAX_YEAR as HEB_MAX_YEAR } from '../calendars/hebrew.js';
import { yearLabel, formatCivil } from '../calendars/civil-common.js';
import { dayOfWeek, DAY_NAMES } from '../core/chronology.js';

/** Certainty used for traditional and estimated datings (ADR-014; marker-only). */
export const INTERPRETATION = 'INTERPRETATION';

/** Ussher's AM 1 begins 23 Oct 4004 BC (Julian); AM y begins 23 Oct of astronomical year y − 4004. */
export const USSHER_AM1_YEAR = -4003n;

const isJulianCivil = (y, m, d) => y < 1582n || (y === 1582n && (m < 10 || (m === 10 && d < 15)));
/** JDN of a civil date in the canon convention: Julian before 15 Oct 1582, Gregorian after. */
export function civilJdn(year, month, day) {
  const y = toBigInt(year, 'year');
  return isJulianCivil(y, month, day) ? jdnFromJulian(y, month, day) : jdnFromGregorian(y, month, day);
}

/** Band of a civil year (1 Jan – 31 Dec in the canon convention). */
export function yearBand(year) {
  const y = toBigInt(year, 'year');
  return { start: civilJdn(y, 1, 1), end: civilJdn(y, 12, 31) };
}

/** Band from 1 Jan of `from` to 31 Dec of `to` (astronomical years). */
export function rangeBand(from, to) {
  return { start: yearBand(from).start, end: yearBand(to).end };
}

/** Ussher's AM year band: 23 Oct (y − 4004) → 22 Oct (y − 4003), Julian. */
export function ussherAmBand(am) {
  const a = toBigInt(am, 'am');
  const y = USSHER_AM1_YEAR + a - 1n;
  return { start: jdnFromJulian(y, 10, 23), end: jdnFromJulian(y + 1n, 10, 22) };
}

/** Hebrew AM year band (1 Tishri → 29 Elul) via the fixed calendar. */
export function hebrewAmBand(am) {
  const a = toBigInt(am, 'am');
  if (a < HEB_MIN_YEAR || a >= HEB_MAX_YEAR) throw new RangeError(`AM ${a} outside the Hebrew adapter's range`);
  return { start: newYearJdn(a), end: newYearJdn(a + 1n) - 1n };
}

/** "2349/2348 BC" for a band that straddles two civil years; "1491 BC" when it does not. */
export function bandYearLabel(band, era) {
  const { julianFromJdnYear } = helpers;
  const y1 = julianFromJdnYear(band.start), y2 = julianFromJdnYear(band.end);
  return y1 === y2 ? yearLabel(y1, era) : `${yearLabel(y1, era).replace(/ (BC|BCE|AD|CE)$/, '')}/${yearLabel(y2, era)}`;
}
// astronomical civil year of a JDN (Julian before the reform, Gregorian after), without importing the adapters' range checks
import { julianFromJdn } from '../calendars/julian.js';
import { gregorianFromJdn, REFORM_JDN } from '../calendars/gregorian.js';
const helpers = { julianFromJdnYear: (j) => (j < REFORM_JDN ? julianFromJdn(j).year : gregorianFromJdn(j).year) };

/** "Friday 3 April AD 33 (Julian)" — weekday and civil date in the canon convention. */
export function civilDayLabel(jdn, era) {
  const j = toBigInt(jdn, 'jdn');
  const d = j < REFORM_JDN ? julianFromJdn(j) : gregorianFromJdn(j);
  return `${DAY_NAMES[dayOfWeek(j)]} ${formatCivil(d, { era })}${j < REFORM_JDN ? ' (Julian)' : ''}`;
}

/**
 * @typedef {Object} System
 * @property {string} id
 * @property {string} name
 * @property {string} short
 * @property {string} unit  what a bare number means in this system ('AM' | 'year')
 * @property {(am: number|bigint) => {start: bigint, end: bigint}} [amBand]
 * @property {string} description
 * @property {string[]} sources ids into SOURCES
 */

/** @type {readonly System[]} */
export const SYSTEMS = Object.freeze([
  {
    id: 'ussher', name: 'Ussher, Annales Veteris Testamenti (1650)', short: 'Ussher', unit: 'AM',
    amBand: ussherAmBand,
    amLabel: (am) => `AM ${am} (Ussher)`,
    description: 'Masoretic chronology; Creation on Sunday 23 October 4004 BC (Julian); BC year = 4004 − AM for events after the autumn new year.',
    sources: ['wiki-ussher', 'abr-ussher', 'gen-mt'],
  },
  {
    id: 'seder-olam', name: 'Seder Olam Rabbah / traditional Jewish reckoning', short: 'Seder Olam', unit: 'AM',
    amBand: hebrewAmBand,
    amLabel: (am) => `AM ${am}`,
    description: 'The rabbinic count behind the Hebrew calendar year; events placed in the Hebrew AM year that popular Jewish chronology assigns them (Exodus AM 2448 = 1313 BCE). Seder Olam\'s own count of Adam as "year 0" and the calendar\'s year of chaos are not re-applied.',
    sources: ['je-seder-olam', 'wiki-seder-olam', 'gen-mt'],
  },
  {
    id: 'early-date', name: 'Early-date conservative chronology (Thiele / Wood / ESV Study Bible, as tabulated by Bible Hub)', short: 'Early-date', unit: 'year',
    description: 'Exodus 1446 BC from 1 Kings 6:1 and Temple 966 BC; the primeval and patriarchal ages are given only as "before 4000 / 2500 / 2100 BC" and are therefore not placed.',
    sources: ['biblehub'],
  },
  {
    id: 'historical', name: 'Critical / historical dating (external synchronisms)', short: 'Historical', unit: 'year',
    description: 'Only what Assyrian, Babylonian, Persian, Greek and Roman records fix or bracket. No historical date exists for the primeval and patriarchal narratives; the Exodus, if historical, is usually placed in the 13th century BCE.',
    sources: ['wiki-597', 'wiki-587', 'wiki-babylon', 'wiki-2nd-temple', 'wiki-jesus', 'wiki-monarchy', 'wiki-ezra', 'wiki-exodus', 'wiki-solomon-temple', 'wiki-chronology-bible'],
  },
]);

export const DEFAULT_SYSTEM = 'ussher';

export function getSystem(id) {
  const s = SYSTEMS.find(x => x.id === id);
  if (!s) throw new RangeError(`unknown chronological system ${id}`);
  return s;
}

/** Citations. Every dating points at one of these by id. */
export const SOURCES = Object.freeze({
  'gen-mt': 'Genesis 5; 7:11; 11:10–32; 12:4; 21:5; 25:26; 37:2; 41:46; 45:6; 47:9; Exodus 7:7; 12:40–41; Numbers 14:33; 1 Kings 6:1, 38; 11:42; 2 Samuel 5:4; Acts 7:4; 13:21 (Masoretic figures, KJV text checked 2026-11-12)',
  'wiki-ussher': 'Wikipedia, "Ussher chronology" (retrieved 2026-11-12): Creation Sunday 23 Oct 4004 BC; periods 4004→1922, 1922→1012, 1012→588 BC; Nativity 5 BC; Herod † 4 BC',
  'ussher-annals': 'Ussher, J., The Annals of the World (1658; English text on archive.org, item AnnalsOfTheWorld, checked 2026-11-12): every entry is headed by its Anno Mundi, Julian Period and BC/AD year; paragraph numbers (§) are those of that text',
  'abr-ussher': 'Associates for Biblical Research, "Ussher, Explained and Corrected", biblearchaeology.org/?p=71771 (retrieved 2026-11-12): Flood AM 1656 = 2349 BC; Terah AM 1878; Abram AM 2008; descent into Egypt AM 2298; Exodus AM 2513 = 1491 BC',
  'je-seder-olam': 'Jewish Encyclopedia (1906), "Seder Olam Rabbah": Babel 1,996 years after creation; Temple 480 years after the Exodus; First Temple 410 years, destroyed 3,338 years after creation; captivity 70 years; Second Temple 420 years, destroyed AM 3828; Saul two years, David forty, Solomon four years to the Temple',
  'wiki-seder-olam': 'Wikipedia, "Seder Olam Rabbah" (retrieved 2026-11-12): Exodus AM 2448; destruction of the First Temple AM 3338 = 423/422 BCE; Jehoiachin\'s exile 433 BCE; return under Cyrus 370 BCE; Samaria destroyed AM 3205; Second Temple destroyed AM 3828 = 68 CE',
  'seder-olam-sojourn': 'Seder Olam Rabbah ch. 3 and Rashi on Gen 42:2: 210 years in Egypt (the traditional reading of Exodus 12:40)',
  'biblehub': 'Bible Hub, "Bible Timeline", biblehub.com/timeline (retrieved 2026-11-12; states it follows Wood, Thiele and the ESV Study Bible)',
  'wiki-597': 'Wikipedia, "Siege of Jerusalem (597 BC)": Nebuchadnezzar captured Jerusalem on 16 March 597 BC (2 Adar; Babylonian Chronicle BM 21946)',
  'wiki-587': 'Wikipedia, "Siege of Jerusalem (587 BC)": the city fell in Tammuz and the Temple burned in Av of 587 BC (Albright, Young) or 586 BC (Thiele)',
  'wiki-babylon': 'Wikipedia, "Fall of Babylon": the Babylonian Chronicle records the capture on 16 Tašrîtu = 12 October 539 BC (Julian); Cyrus entered on 28/29 October',
  'wiki-2nd-temple': 'Wikipedia, "Second Temple": foundations laid 535 BCE; ready for consecration in spring 516 BCE (3 Adar, Darius year 6); rededication 164 BCE (25 Kislev); destroyed 70 CE on Tisha B\'Av, 4 or 30 August',
  'wiki-jesus': 'Wikipedia, "Chronology of Jesus": birth between 6 BC and 4 BC; Herod died in 4 BC after the lunar eclipse of 13 March; crucifixion Friday 7 April AD 30 or Friday 3 April AD 33',
  'wiki-monarchy': 'Wikipedia, "Kingdom of Israel (united monarchy)": Galil — Saul c. 1030–1010, David c. 1008–970, Solomon c. 970–931 BCE; division c. 930 (also 926)',
  'wiki-ezra': 'Wikipedia, "Ezra–Nehemiah": Ezra 458 BCE (Artaxerxes I) or 398 BCE (Artaxerxes II); Nehemiah 445 BCE',
  'wiki-exodus': 'Wikipedia, "The Exodus": if historical, 13th century BCE under Ramesses II; proposals also include 1130 and 1525 BCE; no scholarly consensus on historicity',
  'wiki-solomon-temple': 'Wikipedia, "Solomon\'s Temple": construction c. 958/9 BCE (Josephus-based) within Solomon\'s reign 970–931; destroyed 587/586 BCE',
  'wiki-chronology-bible': 'Wikipedia, "Chronology of the Bible": Edict of Cyrus 538 BCE; Maccabean rededication 164 BCE',
  'wiki-samaria': 'Wikipedia, "Kingdom of Israel (Samaria)": conquered by the Neo-Assyrian Empire c. 722–720 BCE (Shalmaneser V / Sargon II)',
  'hw-1983': 'Humphreys, C. J. & Waddington, W. G., "Dating the Crucifixion", Nature 306 (1983) 743–746 — the anchor\'s existing justification (not re-examined)',
  'doc-08': 'docs/sabbath-calendar-v2/08-CREATION-WEEK-RESEARCH.md §2–4 (Creation-epoch conventions: Hebrew AM epoch, Byzantine era)',
});
