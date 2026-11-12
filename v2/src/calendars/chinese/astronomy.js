/* ============================================================
   Sabbath Calendar v2 — calendars/chinese/astronomy.js
   Floating-point astronomy for the Chinese calendar adapter:
   ΔT, apparent solar longitude, new-moon instants, and the
   instants when the Sun reaches a given longitude.
   Sources: Meeus, Astronomical Algorithms, 2nd ed. (1998):
   ch. 22 (nutation, low accuracy), ch. 25 (solar coordinates,
   low accuracy ≈ 0.01°), ch. 49 (phases of the Moon);
   Espenak & Meeus, NASA TP-2006-214141 (ΔT polynomials).
   All instants are Julian Ephemeris Days (TT) unless named *Ut.
   Accuracy target: new moons to ~1 minute, solar longitude to
   ~0.01° (≈ 15 minutes of time) — sufficient for day-resolution
   calendar rules; borderline cases are flagged by the adapter.
   Pure: no Date, no DOM.
   ============================================================ */

const DEG = Math.PI / 180;
export const J2000 = 2451545.0;
export const MEAN_SYNODIC_MONTH = 29.530588853;
export const MEAN_TROPICAL_YEAR = 365.242189;

const sinD = (x) => Math.sin(x * DEG);
const cosD = (x) => Math.cos(x * DEG);
const mod360 = (x) => ((x % 360) + 360) % 360;

/* ---------- ΔT = TT − UT (seconds), Espenak & Meeus 2006 ---------- */
/** @param {number} year decimal year */
export function deltaT(year) {
  const y = year;
  let t;
  if (y < -500) { const u = (y - 1820) / 100; return -20 + 32 * u * u; }
  if (y < 500) { t = y / 100; return 10583.6 - 1014.41 * t + 33.78311 * t ** 2 - 5.952053 * t ** 3 - 0.1798452 * t ** 4 + 0.022174192 * t ** 5 + 0.0090316521 * t ** 6; }
  if (y < 1600) { t = (y - 1000) / 100; return 1574.2 - 556.01 * t + 71.23472 * t ** 2 + 0.319781 * t ** 3 - 0.8503463 * t ** 4 - 0.005050998 * t ** 5 + 0.0083572073 * t ** 6; }
  if (y < 1700) { t = y - 1600; return 120 - 0.9808 * t - 0.01532 * t ** 2 + t ** 3 / 7129; }
  if (y < 1800) { t = y - 1700; return 8.83 + 0.1603 * t - 0.0059285 * t ** 2 + 0.00013336 * t ** 3 - t ** 4 / 1174000; }
  if (y < 1860) { t = y - 1800; return 13.72 - 0.332447 * t + 0.0068612 * t ** 2 + 0.0041116 * t ** 3 - 0.00037436 * t ** 4 + 0.0000121272 * t ** 5 - 0.0000001699 * t ** 6 + 0.000000000875 * t ** 7; }
  if (y < 1900) { t = y - 1860; return 7.62 + 0.5737 * t - 0.251754 * t ** 2 + 0.01680668 * t ** 3 - 0.0004473624 * t ** 4 + t ** 5 / 233174; }
  if (y < 1920) { t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4; }
  if (y < 1941) { t = y - 1920; return 21.20 + 0.84493 * t - 0.076100 * t ** 2 + 0.0020936 * t ** 3; }
  if (y < 1961) { t = y - 1950; return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547; }
  if (y < 1986) { t = y - 1975; return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718; }
  if (y < 2005) { t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5; }
  if (y < 2050) { t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t ** 2; }
  if (y < 2150) { return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y); }
  const u = (y - 1820) / 100; return -20 + 32 * u * u;
}

/** Decimal year of a Julian Day (for ΔT only). */
export function decimalYear(jd) { return 2000 + (jd - J2000) / 365.25; }

/** TT (JDE) → UT (JD). */
export function utFromTt(jde) { return jde - deltaT(decimalYear(jde)) / 86400; }
/** UT (JD) → TT (JDE). */
export function ttFromUt(jd) { return jd + deltaT(decimalYear(jd)) / 86400; }

/* ---------- Nutation and obliquity (Meeus ch. 22, low accuracy) ---------- */
function nutationLongitude(T) {
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000;
  const L = 280.4665 + 36000.7698 * T;
  const Lp = 218.3165 + 481267.8813 * T;
  return (-17.20 * sinD(omega) - 1.32 * sinD(2 * L) - 0.23 * sinD(2 * Lp) + 0.21 * sinD(2 * omega)) / 3600;
}

/* ---------- Solar longitude (Meeus ch. 25) ---------- */
/**
 * Apparent geocentric longitude of the Sun, degrees in [0, 360), at JDE (TT).
 * @param {number} jde
 */
export function solarLongitude(jde) {
  const T = (jde - J2000) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M)
          + (0.019993 - 0.000101 * T) * sinD(2 * M)
          + 0.000289 * sinD(3 * M);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const apparent = trueLong - 0.00569 - 0.00478 * sinD(omega);   // aberration + nutation (Meeus 25.8)
  return mod360(apparent);
}

/**
 * First instant (JDE) at or after `jde` when the Sun's apparent longitude equals `lambda` degrees.
 * Uses a mean-motion estimate then Newton iterations on the periodic longitude.
 * @param {number} jde
 * @param {number} lambda 0..360
 */
export function solarLongitudeAtOrAfter(jde, lambda) {
  const rate = 360 / MEAN_TROPICAL_YEAR;  // deg/day
  let t = jde + mod360(lambda - solarLongitude(jde)) / rate;
  for (let i = 0; i < 20; i++) {
    const diff = mod360(solarLongitude(t) - lambda + 180) - 180;  // signed, in (−180, 180]
    const corr = diff / rate;
    t -= corr;
    if (Math.abs(corr) < 1e-7) break;
  }
  // guarantee "at or after": if the solution landed slightly before jde, move to the next cycle
  if (t < jde - 1e-6) t = solarLongitudeAtOrAfter(jde + 1, lambda);
  return t;
}

/* ---------- New moons (Meeus ch. 49) ---------- */
/**
 * JDE (TT) of the new moon with lunation number k (k = 0 ↔ 6 Jan 2000; integer).
 * Full set of periodic corrections from Meeus table 49.A (new moon column).
 * @param {number} k integer lunation number
 */
export function newMoonJde(k) {
  const T = k / 1236.85;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  let jde = 2451550.09766 + MEAN_SYNODIC_MONTH * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = mod360(2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3);
  const Mp = mod360(201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4);
  const F = mod360(160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4);
  const Om = mod360(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3);
  let corr =
      -0.40720 * sinD(Mp)
    + 0.17241 * E * sinD(M)
    + 0.01608 * sinD(2 * Mp)
    + 0.01039 * sinD(2 * F)
    + 0.00739 * E * sinD(Mp - M)
    - 0.00514 * E * sinD(Mp + M)
    + 0.00208 * E * E * sinD(2 * M)
    - 0.00111 * sinD(Mp - 2 * F)
    - 0.00057 * sinD(Mp + 2 * F)
    + 0.00056 * E * sinD(2 * Mp + M)
    - 0.00042 * sinD(3 * Mp)
    + 0.00042 * E * sinD(M + 2 * F)
    + 0.00038 * E * sinD(M - 2 * F)
    - 0.00024 * E * sinD(2 * Mp - M)
    - 0.00017 * sinD(Om)
    - 0.00007 * sinD(Mp + 2 * M)
    + 0.00004 * sinD(2 * Mp - 2 * F)
    + 0.00004 * sinD(3 * M)
    + 0.00003 * sinD(Mp + M - 2 * F)
    + 0.00003 * sinD(2 * Mp + 2 * F)
    - 0.00003 * sinD(Mp + M + 2 * F)
    + 0.00003 * sinD(Mp - M + 2 * F)
    - 0.00002 * sinD(Mp - M - 2 * F)
    - 0.00002 * sinD(3 * Mp + M)
    + 0.00002 * sinD(4 * Mp);
  // planetary arguments (Meeus 49.A additional corrections)
  const A1 = 299.77 + 0.107408 * k - 0.009173 * T2, A2 = 251.88 + 0.016321 * k, A3 = 251.83 + 26.651886 * k,
        A4 = 349.42 + 36.412478 * k, A5 = 84.66 + 18.206239 * k, A6 = 141.74 + 53.303771 * k, A7 = 207.14 + 2.453732 * k,
        A8 = 154.84 + 7.306860 * k, A9 = 34.52 + 27.261239 * k, A10 = 207.19 + 0.121824 * k, A11 = 291.34 + 1.844379 * k,
        A12 = 161.72 + 24.198154 * k, A13 = 239.56 + 25.513099 * k, A14 = 331.55 + 3.592518 * k;
  corr += 0.000325 * sinD(A1) + 0.000165 * sinD(A2) + 0.000164 * sinD(A3) + 0.000126 * sinD(A4) + 0.000110 * sinD(A5)
        + 0.000062 * sinD(A6) + 0.000060 * sinD(A7) + 0.000056 * sinD(A8) + 0.000047 * sinD(A9) + 0.000042 * sinD(A10)
        + 0.000040 * sinD(A11) + 0.000037 * sinD(A12) + 0.000035 * sinD(A13) + 0.000023 * sinD(A14);
  return jde + corr;
}

/** Lunation number estimate for a JD. */
function lunationNear(jd) { return Math.floor((jd - 2451550.09766) / MEAN_SYNODIC_MONTH); }

/** First new moon (as UT JD) at or after the UT instant `jdUt`. */
export function newMoonAtOrAfterUt(jdUt) {
  let k = lunationNear(jdUt) - 1;
  let t = utFromTt(newMoonJde(k));
  while (t < jdUt) { k += 1; t = utFromTt(newMoonJde(k)); }
  return t;
}

/** Last new moon (as UT JD) strictly before the UT instant `jdUt`. */
export function newMoonBeforeUt(jdUt) {
  let k = lunationNear(jdUt) + 1;
  let t = utFromTt(newMoonJde(k));
  while (t >= jdUt) { k -= 1; t = utFromTt(newMoonJde(k)); }
  return t;
}
