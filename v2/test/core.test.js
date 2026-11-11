// T-CORE-01 … T-CORE-13 (doc 12 §2)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANCHOR_JDN, CYCLE_LENGTH, sabbathJdn, sabbathIndexOf, isNotASabbath, isSabbath,
  cycleOf, cycleBounds, positionInCycle, dayOfWeek, previousSabbath, nextSabbath,
  previousSabbathStrict, nextSabbathStrict, weeksBetween, daysBetween, daysSinceAnchor,
  describeDay, DAY_NAMES, ChronologyInputError, toBigInt, floorDiv, floorMod,
} from '../src/core/index.js';

const A = ANCHOR_JDN;
const SET = [-(10n ** 30n), -(10n ** 6n), -1000n, -1n, 0n, 1n, 2n, 103_992n, 10n ** 6n, 10n ** 30n];

test('T-CORE-01 anchor', () => {
  assert.equal(A, 1733205n);
  assert.equal(sabbathJdn(1n), 1733205n);
  assert.equal(sabbathJdn(1), 1733205n);
  assert.equal(sabbathJdn('1'), 1733205n);
  assert.equal(CYCLE_LENGTH, 7n);
});

test('T-CORE-02 spacing is exactly 7 for positive, zero and negative indices', () => {
  for (const n of SET) {
    assert.equal(sabbathJdn(n + 1n) - sabbathJdn(n), 7n, `n=${n}`);
    assert.equal(sabbathJdn(n) - sabbathJdn(n - 1n), 7n, `n=${n}`);
  }
});

test('T-CORE-03 Sabbath #0, #−1, #−1000', () => {
  assert.equal(sabbathJdn(0n), 1733198n);
  assert.equal(sabbathJdn(-1n), 1733191n);
  assert.equal(sabbathJdn(-1000n), 1726198n);
  assert.equal(sabbathJdn('−1000'), 1726198n);  // U+2212
});

test('T-CORE-04 sabbathIndexOf on anchor ± 0..6: index at 0, typed NotASabbath otherwise', () => {
  assert.equal(sabbathIndexOf(A), 1n);
  for (let k = 1n; k <= 6n; k++) {
    const r = sabbathIndexOf(A + k);
    assert.ok(isNotASabbath(r), `A+${k}`);
    assert.equal(r.cycle, 2n);
    assert.equal(r.previousSabbath, A);
    assert.equal(r.nextSabbath, A + 7n);
    assert.equal(r.positionInCycle, Number(k));        // A+1 is the Sunday of cycle 2
    const q = sabbathIndexOf(A - k);
    assert.ok(isNotASabbath(q), `A-${k}`);
    assert.equal(q.cycle, 1n);
    assert.equal(q.previousSabbath, A - 7n);
    assert.equal(q.nextSabbath, A);
    assert.equal(q.positionInCycle, 7 - Number(k));
  }
  assert.equal(sabbathIndexOf(A + 7n), 2n);
  assert.equal(sabbathIndexOf(A - 7n), 0n);
});

test('T-CORE-05 round trip index → jdn → index', () => {
  for (const n of SET) assert.equal(sabbathIndexOf(sabbathJdn(n)), n, `n=${n}`);
});

test('T-CORE-06 cycleOf is a partition into consecutive 7-day blocks (exhaustive around three anchors)', () => {
  for (const center of [A, 0n, -290_495n]) {
    let prev = cycleOf(center - 7000n);
    let runLength = 0, partialFirstRun = true;   // the sweep starts mid-cycle, so the first block is short
    for (let j = center - 7000n; j <= center + 7000n; j++) {
      const c = cycleOf(j);
      if (c === prev) runLength++;
      else {
        assert.equal(c, prev + 1n, `jump at ${j}`);
        if (!partialFirstRun) assert.equal(runLength, 7, `run before ${j}`);
        partialFirstRun = false; runLength = 1; prev = c;
      }
      const b = cycleBounds(c);
      assert.ok(b.first <= j && j <= b.last, `bounds at ${j}`);
      assert.equal(b.last - b.first, 6n);
      assert.ok(isSabbath(b.last));
      assert.equal(positionInCycle(j), Number(j - b.first) + 1);
      if (isSabbath(j)) assert.equal(c, sabbathIndexOf(j));
    }
  }
  for (const n of SET) assert.equal(cycleOf(sabbathJdn(n)), n);
});

test('T-CORE-07 previous/next Sabbath properties over 10^4 seeded pseudo-random days in ±10^20', () => {
  let s = 0x2545F4914F6CDD1Dn;
  const M = 10n ** 20n;
  for (let i = 0; i < 10_000; i++) {
    s ^= (s << 13n) & ((1n << 64n) - 1n); s ^= s >> 7n; s ^= (s << 17n) & ((1n << 64n) - 1n);
    const j = (s % (2n * M + 1n)) - M;
    const p = previousSabbath(j), q = nextSabbath(j);
    assert.ok(p <= j && j <= q);
    assert.ok(q - p === 0n || q - p === 7n);
    assert.ok(isSabbath(p) && isSabbath(q));
    assert.equal(previousSabbathStrict(j), isSabbath(j) ? j - 7n : p);
    assert.equal(nextSabbathStrict(j), isSabbath(j) ? j + 7n : q);
  }
});

test('T-CORE-08 distances', () => {
  assert.equal(weeksBetween(1n, 103_992n), 103_991n);
  assert.equal(weeksBetween(103_992n, 1n), -103_991n);
  assert.equal(weeksBetween(-5n, 5n), 10n);
  assert.equal(daysBetween(A, 2_461_142n), 727_937n);
  assert.equal(daysSinceAnchor(2_461_142n), 727_937n);
  assert.equal(daysSinceAnchor(A - 1n), -1n);
});

test('T-CORE-09 day of week on known days', () => {
  const cases = [[0n, 0], [5n, 5], [1733205n, 5], [2299160n, 3], [2299161n, 4], [2451545n, 5], [2461142n, 5], [-290495n, 5]];
  for (const [j, d] of cases) assert.equal(dayOfWeek(j), d, `jdn ${j}`);
  assert.equal(DAY_NAMES[dayOfWeek(2299160n)], 'Thursday');
  assert.equal(DAY_NAMES[dayOfWeek(2299161n)], 'Friday');
});

test('T-CORE-10 very large magnitudes are exact', () => {
  for (const n of [10n ** 30n, -(10n ** 30n), 10n ** 100n, -(10n ** 100n)]) {
    const j = sabbathJdn(n);
    assert.equal(sabbathIndexOf(j), n);
    assert.equal(cycleOf(j), n);
    assert.equal(dayOfWeek(j), 5);
    assert.equal(j, A + 7n * (n - 1n));
  }
});

test('T-CORE-11 floor semantics on negative operands', () => {
  assert.equal(floorDiv(-15n, 7n), -3n);
  assert.equal(floorMod(-15n, 7n), 6n);
  assert.equal(floorDiv(15n, -7n), -3n);
  assert.equal(floorMod(15n, -7n), -6n);
  assert.equal(floorDiv(-14n, 7n), -2n);
  assert.equal(floorMod(-14n, 7n), 0n);
  assert.equal(floorMod(-290495n, 7n), 5n);
  assert.equal(cycleOf(A - 7n), 0n);
  assert.equal(cycleOf(A - 13n), 0n);
  assert.equal(cycleOf(A - 14n), -1n);
  assert.equal(previousSabbath(A - 1n), A - 7n);
  assert.equal(nextSabbath(A - 1n), A);
});

test('T-CORE-12 direct computation is O(1): 10^5 calls at |n| = 10^18 in well under 1 ms each', () => {
  const n = 10n ** 18n;
  const t0 = performance.now();
  let acc = 0n;
  for (let i = 0; i < 100_000; i++) acc ^= sabbathJdn(n + BigInt(i));
  const perCall = (performance.now() - t0) / 100_000;
  assert.ok(acc !== 0n);
  assert.ok(perCall < 1, `per call ${perCall} ms`);
});

test('T-CORE-13 invalid inputs are rejected, never coerced', () => {
  for (const bad of [1.5, NaN, Infinity, '12a', '', ' ', null, undefined, {}, [], true, 2 ** 53, -(2 ** 53), '1.0', '0x10']) {
    assert.throws(() => sabbathJdn(bad), ChronologyInputError, `input ${String(bad)}`);
    assert.throws(() => cycleOf(bad), ChronologyInputError, `input ${String(bad)}`);
  }
  assert.equal(toBigInt('  +1,733,205 '), 1733205n);
  assert.equal(toBigInt('−1_000'), -1000n);
  assert.equal(toBigInt(2 ** 53 - 1), 9007199254740991n);
});

test('describeDay bundles every field consistently', () => {
  const d = describeDay(2_461_142n);
  assert.equal(d.isSabbath, true);
  assert.equal(d.sabbathIndex, 103_992n);
  assert.equal(d.cycle, 103_992n);
  assert.equal(d.positionInCycle, 7);
  assert.equal(d.dayName, 'Saturday');
  assert.equal(d.cycleFirst, 2_461_136n);
  assert.equal(d.cycleLast, 2_461_142n);
  assert.equal(d.previousSabbath, d.jdn);
  assert.equal(d.nextSabbath, d.jdn);
  const w = describeDay(2_461_139n);   // Wednesday of that cycle
  assert.equal(w.isSabbath, false);
  assert.equal(w.sabbathIndex, null);
  assert.equal(w.cycle, 103_992n);
  assert.equal(w.positionInCycle, 4);
  assert.equal(w.dayName, 'Wednesday');
  assert.equal(w.previousSabbath, 2_461_135n);
  assert.equal(w.nextSabbath, 2_461_142n);
  assert.ok(Object.isFrozen(w));
});
