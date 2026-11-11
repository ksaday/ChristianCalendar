// T-CORE-14 and T-VER-01: seeded invariant self-test is green and reproducible.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyInvariants, FIXED_INDICES } from '../src/core/index.js';

test('T-CORE-14 verifyInvariants passes and is reproducible for the same seed', () => {
  const r1 = verifyInvariants({ seed: 1, samples: 10_000 });
  const r2 = verifyInvariants({ seed: 1, samples: 10_000 });
  assert.equal(r1.allPassed, true, JSON.stringify(r1.checks.filter(c => !c.passed)));
  assert.deepEqual(r1, r2);
  assert.equal(r1.checks.length, 8);
  for (const c of r1.checks) assert.ok(c.cases >= FIXED_INDICES.length || c.id === 'I1');
});

test('different seeds still pass; magnitudes up to 10^60', () => {
  for (const seed of [2n, 12345n, 10n ** 18n]) {
    const r = verifyInvariants({ seed, samples: 2_000, magnitude: 10n ** 60n });
    assert.equal(r.allPassed, true, `seed ${seed}: ${r.digest}`);
  }
});

test('T-VER-01 digest for the canonical CI run (compare with the browser run in test/browser/invariants.html)', () => {
  const r = verifyInvariants({ seed: 1, samples: 1_000 });
  assert.equal(r.digest, 'I1:P1|I2:P1015|I3:P1015|I4:P1015|I5a:P1015|I5b:P1009|I6:P1015|I7:P1009');
});
