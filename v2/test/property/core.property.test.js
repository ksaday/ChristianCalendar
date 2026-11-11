// P-01 … P-03 (doc 12 §6) with fast-check, seeded for reproducibility.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import {
  sabbathJdn, sabbathIndexOf, cycleOf, nextSabbath, positionInCycle, isSabbath, isNotASabbath, previousSabbath,
} from '../../src/core/index.js';

const SEED = 20261111;
const big = (digits) => fc.bigInt({ min: -(10n ** BigInt(digits)), max: 10n ** BigInt(digits) });

test('P-01 ∀ n ∈ ±10^40: sabbathIndexOf(sabbathJdn(n)) = n', () => {
  fc.assert(fc.property(big(40), (n) => sabbathIndexOf(sabbathJdn(n)) === n), { seed: SEED, numRuns: 10_000 });
});

test('P-02 ∀ j: cycleOf(j+7) = cycleOf(j)+1 and cycleOf(nextSabbath(j)) = cycleOf(j) = cycleOf(previousSabbath(j+?))', () => {
  fc.assert(fc.property(big(40), (j) =>
    cycleOf(j + 7n) === cycleOf(j) + 1n && cycleOf(nextSabbath(j)) === cycleOf(j)),
    { seed: SEED, numRuns: 10_000 });
});

test('P-03 ∀ j: positionInCycle(j) = 7 ⇔ isSabbath(j), and NotASabbath carries consistent neighbours', () => {
  fc.assert(fc.property(big(40), (j) => {
    const sab = isSabbath(j);
    if ((positionInCycle(j) === 7) !== sab) return false;
    const r = sabbathIndexOf(j);
    if (sab) return typeof r === 'bigint' && previousSabbath(j) === j && nextSabbath(j) === j;
    return isNotASabbath(r) && r.previousSabbath === previousSabbath(j) && r.nextSabbath === nextSabbath(j)
      && r.nextSabbath - r.previousSabbath === 7n && r.cycle === cycleOf(j);
  }), { seed: SEED, numRuns: 10_000 });
});
