/* ============================================================
   Sabbath Calendar v2 — markers/eclipses.js
   Calculated eclipses from the NASA Five Millennium Canon
   (doc 17 §4): parsing of data/eclipses/*.json, O(log n + k)
   viewport queries, ΔT uncertainty, and descriptions. Pure: no
   DOM, no fetch — the UI loads the JSON and hands it over.
   Credit: Eclipse Predictions by Fred Espenak and Jean Meeus (NASA's GSFC).
   ============================================================ */

import { toBigInt } from '../core/bigint-math.js';
import { julianFromJdn } from '../calendars/julian.js';
import { gregorianFromJdn, REFORM_JDN } from '../calendars/gregorian.js';

export const CANON_CREDIT = "Eclipse Predictions by Fred Espenak and Jean Meeus (NASA's GSFC)";
export const CANON_FIRST_YEAR = -1999, CANON_LAST_YEAR = 3000;

export const SOLAR_TYPES = Object.freeze({ P: 'partial', A: 'annular', T: 'total', H: 'hybrid (annular–total)' });
export const LUNAR_TYPES = Object.freeze({ N: 'penumbral', P: 'partial', T: 'total' });

/**
 * @typedef {Object} Eclipse
 * @property {'solar'|'lunar'} kind
 * @property {bigint} jdn UT civil day of greatest eclipse
 * @property {number} jdnNum same, as a Number (the canon lies well inside the safe range)
 * @property {number} utMinutes minutes after 0h UT of greatest eclipse
 * @property {string} type canon type code with suffix ('T', 'A-', 'Pb', 'N', 'T+' …)
 * @property {string} typeName
 * @property {boolean} central total / annular / hybrid (solar) or total (lunar)
 * @property {number} magnitude eclipse magnitude (solar) or umbral magnitude (lunar; penumbral for N)
 * @property {number} deltaT seconds
 * @property {number} saros
 * @property {number} lat latitude of greatest eclipse (solar) or sub-lunar point (lunar)
 * @property {number} lon
 */

/**
 * Parse one canon file ({kind, rows, …}) into a frozen, sorted set.
 * @returns {{kind: string, source: string, credit: string, count: number, rows: Eclipse[], jdns: number[]}}
 */
export function parseCanon(json) {
  if (!json || !Array.isArray(json.rows) || (json.kind !== 'solar' && json.kind !== 'lunar')) throw new TypeError('not a canon file');
  const names = json.kind === 'solar' ? SOLAR_TYPES : LUNAR_TYPES;
  const rows = new Array(json.rows.length);
  let prev = -Infinity;
  for (let i = 0; i < json.rows.length; i++) {
    const r = json.rows[i];
    const t = String(r[2]);
    const letter = t[0];
    if (!(letter in names)) throw new RangeError(`unknown ${json.kind} eclipse type ${t} at row ${i}`);
    if (!(r[0] > prev)) throw new RangeError(`canon rows not strictly increasing at row ${i}`);
    prev = r[0];
    rows[i] = Object.freeze({
      kind: json.kind, jdn: BigInt(r[0]), jdnNum: r[0], utMinutes: r[1], type: t, typeName: names[letter],
      central: json.kind === 'solar' ? letter !== 'P' : letter === 'T',
      magnitude: r[3], deltaT: r[4], saros: r[5], lat: r[6], lon: r[7],
    });
  }
  return Object.freeze({ kind: json.kind, source: json.source, credit: json.credit || CANON_CREDIT, count: rows.length, rows, jdns: rows.map(e => e.jdnNum) });
}

/** First index i with jdns[i] >= x. */
function lowerBound(jdns, x) {
  let lo = 0, hi = jdns.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (jdns[mid] < x) lo = mid + 1; else hi = mid; }
  return lo;
}

/** Clamp a BigInt day to a Number just outside the canon's span (viewports can be 10^40 years wide). */
function clampNum(set, j) {
  const b = toBigInt(j, 'jdn');
  const min = set.jdns[0] - 1, max = set.jdns[set.jdns.length - 1] + 1;
  if (b <= BigInt(min)) return min;
  if (b >= BigInt(max)) return max;
  return Number(b);
}

/** Index range [i0, i1) of eclipses with start ≤ jdn ≤ end. */
export function indexRange(set, start, end) {
  const s = clampNum(set, start), e = clampNum(set, end);
  if (e < s) return [0, 0];
  return [lowerBound(set.jdns, s), lowerBound(set.jdns, e + 1)];
}

export function countBetween(set, start, end) { const [a, b] = indexRange(set, start, end); return b - a; }

/** Eclipses in [start, end], in day order. O(log n + k). */
export function eclipsesBetween(set, start, end) { const [a, b] = indexRange(set, start, end); return set.rows.slice(a, b); }

export function eclipsesOn(set, jdn) { return eclipsesBetween(set, jdn, jdn); }

/** First eclipse strictly after jdn, or null. */
export function nextEclipse(set, jdn) { const i = lowerBound(set.jdns, clampNum(set, toBigInt(jdn) + 1n)); return i < set.rows.length ? set.rows[i] : null; }
/** Last eclipse strictly before jdn, or null. */
export function previousEclipse(set, jdn) { const i = lowerBound(set.jdns, clampNum(set, jdn)); return i > 0 ? set.rows[i - 1] : null; }

/** Astronomical civil year of a day (Julian before the 1582 reform, Gregorian after). */
export function civilYearOf(jdn) { const j = toBigInt(jdn, 'jdn'); return Number(j < REFORM_JDN ? julianFromJdn(j).year : gregorianFromJdn(j).year); }

/**
 * Standard error of ΔT in seconds (doc 17 §4.2). Morrison & Stephenson 2004 (σ = 0.8 t², t in
 * centuries from 1820) between −1000 and 2005; Huber's Brownian model outside, with the
 * calibration years NASA uses (−500 before 500 BCE, 2005 after).
 */
export function deltaTSigma(year) {
  const y = Number(year);
  if (y >= -1000 && y <= 2005) { const t = (y - 1820) / 100; return 0.8 * t * t; }
  const cal = y < -1000 ? -500 : 2005;
  const N = Math.abs(y - cal), Q = 0.058, M = 2500;
  return 365.25 * N * Math.sqrt((N * Q / 3) * (1 + N / M)) / 1000;
}

/** Whether ±σ(ΔT) around the UT instant crosses midnight (civil day could shift by one). */
export function dayUncertain(e) {
  const sigmaMin = deltaTSigma(civilYearOf(e.jdn)) / 60;
  return e.utMinutes - sigmaMin < 0 || e.utMinutes + sigmaMin >= 1440;
}

const pad2 = (n) => String(n).padStart(2, '0');
const fmtCoord = (v, pos, neg) => `${Math.abs(v).toFixed(1).replace(/\.0$/, '')}°${v < 0 ? neg : pos}`;

/** Presentation strings for one eclipse. */
export function describeEclipse(e) {
  const year = civilYearOf(e.jdn);
  const sigma = deltaTSigma(year);
  const uncertain = dayUncertain(e);
  const glyph = e.kind === 'solar' ? '☉' : '☾';
  const kindName = e.kind === 'solar' ? 'solar' : 'lunar';
  const title = `${glyph} ${e.typeName[0].toUpperCase()}${e.typeName.slice(1)} ${kindName} eclipse`;
  const time = `${pad2(Math.floor(e.utMinutes / 60))}:${pad2(e.utMinutes % 60)} UT`;
  const magLabel = e.kind === 'solar' ? 'magnitude' : (e.type.startsWith('N') ? 'penumbral magnitude' : 'umbral magnitude');
  const place = e.kind === 'solar'
    ? `greatest eclipse at ${fmtCoord(e.lat, 'N', 'S')} ${fmtCoord(e.lon, 'E', 'W')}`
    : `Moon overhead at ${fmtCoord(e.lat, 'N', 'S')} ${fmtCoord(e.lon, 'E', 'W')}`;
  const deltaTText = `ΔT = ${Math.round(e.deltaT).toLocaleString('en-US')} s ± ${sigma < 10 ? sigma.toFixed(1) : Math.round(sigma).toLocaleString('en-US')} s`;
  const detail = `${title} · greatest at ${time} · ${magLabel} ${e.magnitude.toFixed(3)} · Saros ${e.saros} · ${place} · ${deltaTText}${uncertain ? ' · civil day ±1 (ΔT uncertainty)' : ''} · canon type ${e.type}`;
  return { glyph, title, time, magLabel, place, deltaTText, sigma, uncertain, detail, year };
}
