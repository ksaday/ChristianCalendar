/* ============================================================
   Sabbath Calendar v2 — core/invariants.js
   Seeded, reproducible self-test of invariants I1–I7 (doc 04 §6).
   Runs in Node and in browsers; used by CI (T-CORE-14) and by the
   application's integrity panel (T-VER-01, COMPAT-15).
   Pure: the only randomness is an in-module xorshift on BigInt
   driven by an explicit seed, so reports are identical everywhere.
   ============================================================ */

import { toBigInt, floorMod } from './bigint-math.js';
import {
  ANCHOR_JDN, CYCLE_LENGTH, SABBATH_DAY_OF_WEEK,
  sabbathJdn, sabbathIndexOf, isNotASabbath, cycleOf, cycleBounds,
  dayOfWeek, previousSabbath, nextSabbath, isSabbath,
} from './chronology.js';

const MASK64 = (1n << 64n) - 1n;

/** xorshift64 on BigInt; deterministic for a given seed. */
function makeRng(seed) {
  let s = (toBigInt(seed, 'seed') & MASK64) || 0x9E3779B97F4A7C15n;
  return {
    /** uniform-ish BigInt in [−magnitude, magnitude] */
    next(magnitude) {
      s ^= (s << 13n) & MASK64;
      s ^= s >> 7n;
      s ^= (s << 17n) & MASK64;
      // Stretch to the requested magnitude by concatenating 64-bit words.
      let acc = 0n, bits = 0n;
      const need = magnitude.toString(2).length + 1;
      while (bits < BigInt(need)) {
        s ^= (s << 13n) & MASK64; s ^= s >> 7n; s ^= (s << 17n) & MASK64;
        acc = (acc << 64n) | s; bits += 64n;
      }
      const span = 2n * magnitude + 1n;
      return floorMod(acc, span) - magnitude;
    },
  };
}

/** Fixed indices every run must cover: zero, ±1, the regression example, and large magnitudes. */
export const FIXED_INDICES = Object.freeze([
  -(10n ** 30n), -1_000_000n, -1000n, -14n, -13n, -2n, -1n, 0n, 1n, 2n, 3n,
  103_992n, 104_017n, 1_000_000n, 10n ** 30n,
]);

/**
 * @typedef {Object} InvariantCheck
 * @property {string} id
 * @property {string} statement
 * @property {boolean} passed
 * @property {number} cases
 * @property {string[]} failures first few failing cases, as text
 */

/**
 * @typedef {Object} InvariantReport
 * @property {boolean} allPassed
 * @property {string} seed decimal
 * @property {number} samples
 * @property {string} magnitude decimal
 * @property {InvariantCheck[]} checks
 * @property {string} digest short deterministic summary (for cross-engine comparison)
 */

/**
 * Run the invariant suite.
 * @param {{seed?: bigint|number|string, samples?: number, magnitude?: bigint|number|string}} [opts]
 * @returns {InvariantReport}
 */
export function verifyInvariants(opts = {}) {
  const seed = toBigInt(opts.seed ?? 1n, 'seed');
  const samples = Number(opts.samples ?? 1000);
  const magnitude = toBigInt(opts.magnitude ?? 10n ** 40n, 'magnitude');
  const rng = makeRng(seed);

  const indices = [...FIXED_INDICES];
  const days = [0n, 5n, -290_495n, ANCHOR_JDN, ANCHOR_JDN - 7n, ANCHOR_JDN - 13n, ANCHOR_JDN - 14n, 2_299_160n, 2_461_142n];
  for (let i = 0; i < samples; i++) indices.push(rng.next(magnitude));
  for (let i = 0; i < samples; i++) days.push(rng.next(magnitude));

  const checks = [];
  const run = (id, statement, items, fn) => {
    const failures = [];
    for (const x of items) {
      let ok = false, detail = '';
      try { ok = fn(x); } catch (e) { detail = ` threw ${e && e.message}`; }
      if (!ok) { if (failures.length < 5) failures.push(`${x.toString()}${detail}`); }
    }
    checks.push({ id, statement, passed: failures.length === 0, cases: items.length, failures });
  };

  run('I1', 'sabbathJdn(1) = 1733205', [1n], () => sabbathJdn(1n) === 1733205n);
  run('I2', 'sabbathJdn(n+1) − sabbathJdn(n) = 7', indices, n => sabbathJdn(n + 1n) - sabbathJdn(n) === CYCLE_LENGTH);
  run('I3', 'sabbathJdn(n) − sabbathJdn(n−1) = 7', indices, n => sabbathJdn(n) - sabbathJdn(n - 1n) === CYCLE_LENGTH);
  run('I4', 'sabbathIndexOf(sabbathJdn(n)) = n', indices, n => sabbathIndexOf(sabbathJdn(n)) === n);
  run('I5a', 'cycleOf(sabbathJdn(n)) = n and bounds are [sab−6, sab]', indices, n => {
    const sab = sabbathJdn(n), b = cycleBounds(n);
    return cycleOf(sab) === n && b.first === sab - 6n && b.last === sab && cycleOf(b.first) === n && cycleOf(b.first - 1n) === n - 1n;
  });
  run('I5b', 'cycleOf(j+7) = cycleOf(j)+1 and cycle of a day equals cycle of its next Sabbath', days,
    j => cycleOf(j + 7n) === cycleOf(j) + 1n && cycleOf(nextSabbath(j)) === cycleOf(j));
  run('I6', 'dayOfWeek(sabbathJdn(n)) = 5 (Saturday)', indices, n => dayOfWeek(sabbathJdn(n)) === SABBATH_DAY_OF_WEEK);
  run('I7', 'previousSabbath ≤ j ≤ nextSabbath; difference ∈ {0,7}; both Sabbaths; non-Sabbath marker consistent', days, j => {
    const p = previousSabbath(j), q = nextSabbath(j), d = q - p;
    if (!(p <= j && j <= q && (d === 0n || d === 7n) && isSabbath(p) && isSabbath(q))) return false;
    const r = sabbathIndexOf(j);
    if (isNotASabbath(r)) return r.previousSabbath === p && r.nextSabbath === q && r.cycle === cycleOf(j);
    return r === sabbathIndexOf(p) && d === 0n;
  });

  const allPassed = checks.every(c => c.passed);
  const digest = checks.map(c => `${c.id}:${c.passed ? 'P' : 'F'}${c.cases}`).join('|');
  return { allPassed, seed: seed.toString(), samples, magnitude: magnitude.toString(), checks, digest };
}
