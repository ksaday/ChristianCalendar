/* ============================================================
   Sabbath Calendar v2 — ui/format.js
   Presentation helpers ported from the baseline (COMPAT-12):
   thousands separators, U+2212 for negatives, ordinals.
   ============================================================ */

import { toBigInt } from '../core/bigint-math.js';

/** "−1,234,567" — baseline fmt(), BigInt-capable. */
export function fmtInt(value) {
  const v = toBigInt(value, 'value');
  const neg = v < 0n;
  let s = (neg ? -v : v).toString(), out = '';
  while (s.length > 3) { out = ',' + s.slice(-3) + out; s = s.slice(0, -3); }
  return (neg ? '−' : '') + s + out;
}

/** Scientific-ish grouping for very long integers: "≈ −1.23 × 10^30" (digits > 15). */
export function fmtIntCompact(value) {
  const v = toBigInt(value, 'value');
  const s = (v < 0n ? -v : v).toString();
  if (s.length <= 15) return fmtInt(v);
  return `${v < 0n ? '−' : ''}${s[0]}.${s.slice(1, 3)} × 10^${s.length - 1}`;
}

/** 1st, 2nd, 3rd, 4th … (baseline ord(); defined for n ≥ 1). */
export function ordinal(n) {
  const v = Number(n), r = v % 100;
  if (r >= 11 && r <= 13) return v + 'th';
  switch (v % 10) { case 1: return v + 'st'; case 2: return v + 'nd'; case 3: return v + 'rd'; default: return v + 'th'; }
}

/** "Sabbath #104,017" */
export function sabbathLabel(n) { return `Sabbath #${fmtInt(n)}`; }

/** Approximate mean-Gregorian years for a day count: "≈ 1,993.4 years". */
export function approxYears(days) {
  const d = toBigInt(days, 'days');
  const neg = d < 0n; const abs = neg ? -d : d;
  if (abs.toString().length > 15) return `≈ ${fmtIntCompact(abs / 365n)} years${neg ? ' before' : ''}`;
  const y = Number(abs) / 365.2425;
  return `≈ ${y.toLocaleString('en-US', { maximumFractionDigits: 1 })} years${neg ? ' before' : ''}`;
}
