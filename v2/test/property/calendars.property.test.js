// P-04 … P-06 (doc 12 §6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { adapters } from '../../src/calendars/registry.js';
import { isUnsupported } from '../../src/calendars/adapter.js';
import { dayOfWeek } from '../../src/core/index.js';

const SEED = 20261111;

for (const a of adapters) {
  test(`P-04 ${a.id}: toJdn(fromJdn(j)) = j for j in the math range`, () => {
    fc.assert(fc.property(fc.bigInt({ min: a.mathRange.minJdn, max: a.mathRange.maxJdn }), (j) => {
      const d = a.fromJdn(j);
      return !isUnsupported(d) && a.toJdn(d) === j;
    }), { seed: SEED, numRuns: 10_000 });
  });

  test(`P-05 ${a.id}: UNSUPPORTED ⇔ fromJdn is Unsupported`, () => {
    fc.assert(fc.property(fc.bigInt({ min: -(10n ** 15n), max: 10n ** 15n }), (j) => {
      const unsup = a.support(j).certainty === 'UNSUPPORTED';
      return unsup === isUnsupported(a.fromJdn(j));
    }), { seed: SEED, numRuns: 5_000 });
  });
}

test('P-06 civil adapters never contradict the core day of week (month boundaries advance by whole days)', () => {
  const civil = adapters.filter(x => x.id === 'gregorian' || x.id === 'julian');
  fc.assert(fc.property(fc.bigInt({ min: -(10n ** 7n), max: 10n ** 7n }), (j) => {
    for (const a of civil) {
      const nb = a.nextBoundary(j, 'month');
      if (nb <= j || nb - j > 31n) return false;
      if (dayOfWeek(nb) !== Number(((nb % 7n) + 7n) % 7n)) return false;
    }
    return true;
  }), { seed: SEED, numRuns: 5_000 });
});
