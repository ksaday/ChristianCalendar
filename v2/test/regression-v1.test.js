// T-REG-* : v2 core versus the original application's functions (verbatim fixture).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v1 from './fixtures/baseline-v1.js';
import { ANCHOR_JDN, sabbathJdn, sabbathIndexOf, isSabbath, dayOfWeek, isNotASabbath } from '../src/core/index.js';

test('T-REG-01 COMPAT-05: 11 Apr 2026 → JDN 2,461,142 → Sabbath #103,992 (baseline self-check)', () => {
  const j = v1.jdnFromGregorian(2026, 4, 11);
  assert.equal(j, 2461142);
  assert.equal(v1.sabbathNumber(j), 103992);
  assert.equal(sabbathIndexOf(BigInt(j)), 103_992n);
  assert.equal(sabbathJdn(103_992n), 2_461_142n);
});

test('T-REG-02 COMPAT-01/02: anchor', () => {
  assert.equal(BigInt(v1.ANCHOR_JDN), ANCHOR_JDN);
  assert.ok(v1.isSabbath(v1.ANCHOR_JDN));
  assert.equal(v1.sabbathNumber(v1.ANCHOR_JDN), 1);
  assert.equal(v1.annivJdnOfYear(33), v1.ANCHOR_JDN);
  assert.equal(sabbathIndexOf(ANCHOR_JDN), 1n);
});

test('T-REG-06 COMPAT-09: January AD 33 Saturdays are #−12 … #−8; Sabbath #0 is 26 Mar AD 33 (proleptic Gregorian)', () => {
  const expected = [-12, -11, -10, -9, -8];
  const found = [];
  for (let d = 1; d <= 31; d++) {
    const j = v1.jdnFromGregorian(33, 1, d);
    if (v1.isSabbath(j)) { found.push(v1.sabbathNumber(j)); assert.equal(sabbathIndexOf(BigInt(j)), BigInt(v1.sabbathNumber(j))); }
  }
  assert.deepEqual(found, expected);
  assert.equal(v1.jdnFromGregorian(33, 3, 26), Number(sabbathJdn(0n)));
});

test('T-REG-08 COMPAT-03/11: dayOfWeek equals baseline dow for 10^6 pseudo-random safe JDNs incl. negatives', () => {
  let x = 123456789;
  for (let i = 0; i < 1_000_000; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const j = (x - 1073741824) * 4096 + (i % 4096);   // spans about ±4.4e12 days
    assert.equal(dayOfWeek(BigInt(j)), v1.dow(j));
    if (v1.isSabbath(j)) { assert.ok(isSabbath(BigInt(j))); assert.equal(sabbathIndexOf(BigInt(j)), BigInt(v1.sabbathNumber(j))); }
    else assert.ok(isNotASabbath(sabbathIndexOf(BigInt(j))));
  }
});

test('T-REG-09 concept drawing: 3 Oct 2026 → Sabbath #104,017', () => {
  const j = v1.jdnFromGregorian(2026, 10, 3);
  assert.equal(j, 2461317);
  assert.equal(sabbathIndexOf(BigInt(j)), 104_017n);
});

test('every Saturday in the baseline navigation range (years 33–3000) agrees with v2', () => {
  let count = 0;
  for (let y = 33; y <= 3000; y++) for (let m = 1; m <= 12; m++) {
    const n = v1.daysInMonth(y, m);
    for (let d = 1; d <= n; d++) {
      const j = v1.jdnFromGregorian(y, m, d);
      if (!v1.isSabbath(j)) continue;
      assert.equal(sabbathIndexOf(BigInt(j)), BigInt(v1.sabbathNumber(j)));
      count++;
    }
  }
  assert.ok(count > 154_000, `saw ${count} Saturdays`);
});

// Deferred to the phases that port the corresponding presentation/adapter modules:
test.todo('T-REG-03 COMPAT-06 Gregorian/Julian adapter labels of the anchor (Phase 2)');
test.todo('T-REG-04 COMPAT-07 anniversary rule, exhaustive 33–3000 (Phase 3, sabbath-row-rules)');
test.todo('T-REG-05 COMPAT-08 milestone rule (Phase 3)');
test.todo('T-REG-07 COMPAT-12 fmtInt with U+2212 (Phase 3, format)');
test.todo('T-REG-20 COMPAT-04 v2 Gregorian adapter vs baseline, exhaustive 33–3000 (Phase 2)');
