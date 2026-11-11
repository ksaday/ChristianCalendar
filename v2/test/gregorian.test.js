// T-CAL-10 … T-CAL-14 and reference vectors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gregorian, jdnFromGregorian, gregorianFromJdn, isLeapYear } from '../src/calendars/gregorian.js';
import { isUnsupported } from '../src/calendars/adapter.js';
import { dayOfWeek } from '../src/core/index.js';
import { yearLabel, astronomicalYear } from '../src/calendars/civil-common.js';

const vectors = JSON.parse(readFileSync(new URL('./vectors/gregorian-julian.json', import.meta.url), 'utf8')).vectors;

test('reference vectors (Meeus / Richards / USNO / baseline)', () => {
  for (const v of vectors) {
    const j = BigInt(v.jdn);
    assert.equal(dayOfWeek(j), v.dayOfWeek, `dow ${v.note}`);
    if (!v.gregorian) continue;
    const g = gregorian.fromJdn(j);
    assert.deepEqual({ year: g.year, month: g.month, day: g.day }, { year: BigInt(v.gregorian.year), month: v.gregorian.month, day: v.gregorian.day }, v.note);
    assert.equal(gregorian.toJdn({ year: BigInt(v.gregorian.year), month: v.gregorian.month, day: v.gregorian.day }), j, v.note);
  }
});

test('T-CAL-10 round trip: exhaustive for astronomical years −2000…+4000, strided elsewhere, property for ±10^9 years', () => {
  let count = 0;
  for (let j = jdnFromGregorian(-2000n, 1, 1); j <= jdnFromGregorian(4000n, 12, 31); j++) {
    const g = gregorianFromJdn(j);
    assert.equal(jdnFromGregorian(g.year, g.month, g.day), j, `jdn ${j}`);
    count++;
  }
  assert.ok(count > 2_000_000);
  for (let j = jdnFromGregorian(-10000n, 1, 1); j <= jdnFromGregorian(10000n, 12, 31); j += 997n) {
    const g = gregorianFromJdn(j);
    assert.equal(jdnFromGregorian(g.year, g.month, g.day), j);
    assert.ok(g.month >= 1 && g.month <= 12 && g.day >= 1 && g.day <= 31);
  }
  for (let y = -(10n ** 9n); y <= 10n ** 9n; y += 12_345_677n) {
    for (const [m, d] of [[1, 1], [2, 28], [3, 1], [12, 31]]) {
      const j = jdnFromGregorian(y, m, d);
      assert.deepEqual(gregorianFromJdn(j), { year: y, month: m, day: d });
    }
  }
});

test('T-CAL-11 leap rule', () => {
  const cases = [[1900n, false], [2000n, true], [2100n, false], [1600n, true], [0n, true], [-1n, false], [-4n, true], [2024n, true], [2026n, false]];
  for (const [y, exp] of cases) assert.equal(isLeapYear(y), exp, `year ${y}`);
  assert.equal(gregorian.daysInMonth(2024n, 2), 29);
  assert.equal(gregorian.daysInMonth(2023n, 2), 28);
  assert.throws(() => gregorian.toJdn({ year: 2023n, month: 2, day: 29 }), /day must be/);
  assert.throws(() => gregorian.toJdn({ year: 2023n, month: 13, day: 1 }), /month must be/);
});

test('T-CAL-12 era labels: never "0"', () => {
  assert.equal(yearLabel(0n), '1 BC');
  assert.equal(yearLabel(-3760n), '3761 BC');
  assert.equal(yearLabel(33n), 'AD 33');
  assert.equal(yearLabel(2026n), '2026');
  assert.equal(yearLabel(0n, 'BCE/CE'), '1 BCE');
  assert.equal(yearLabel(33n, 'BCE/CE'), '33 CE');
  assert.equal(astronomicalYear('BC', 1n), 0n);
  assert.equal(astronomicalYear('BC', 4004n), -4003n);
  assert.equal(astronomicalYear('AD', 33n), 33n);
  assert.throws(() => astronomicalYear('BC', 0n), /no year 0/);
  assert.equal(gregorian.format(gregorian.fromJdn(1733205n)), '2 April AD 33');
  assert.equal(gregorian.format(gregorian.fromJdn(-290495n)), '19 July 5509 BC');
  assert.equal(gregorian.format(gregorian.fromJdn(2461142n)), '11 April 2026');
});

test('T-CAL-13 JDN 0 and R.D. 1', () => {
  assert.equal(gregorian.format(gregorian.fromJdn(0n)), '24 November 4714 BC');
  assert.equal(gregorian.format(gregorian.fromJdn(1721426n)), '1 January AD 1');
  assert.equal(gregorian.format(gregorian.fromJdn(1721425n)), '31 December 1 BC');
});

test('T-CAL-14 nextBoundary is the first of the next month / next year (10^4 seeded days)', () => {
  let s = 0x9E3779B97F4A7C15n;
  for (let i = 0; i < 10_000; i++) {
    s ^= (s << 13n) & ((1n << 64n) - 1n); s ^= s >> 7n; s ^= (s << 17n) & ((1n << 64n) - 1n);
    const j = (s % 4_000_000n) - 1_000_000n;
    const d = gregorian.fromJdn(j);
    const nm = gregorian.nextBoundary(j, 'month');
    const nmd = gregorian.fromJdn(nm);
    assert.equal(nmd.day, 1);
    assert.equal(nmd.month, d.month === 12 ? 1 : d.month + 1);
    assert.equal(nmd.year, d.month === 12 ? d.year + 1n : d.year);
    assert.ok(nm > j && nm - j <= 31n);
    const ny = gregorian.fromJdn(gregorian.nextBoundary(j, 'year'));
    assert.deepEqual([ny.year, ny.month, ny.day], [d.year + 1n, 1, 1]);
  }
});

test('declared range: beyond ±10^9 years is Unsupported, not a fabricated label', () => {
  assert.ok(isUnsupported(gregorian.fromJdn(gregorian.mathRange.maxJdn + 1n)));
  assert.ok(isUnsupported(gregorian.fromJdn(-(10n ** 30n))));
  assert.equal(gregorian.support(10n ** 30n).certainty, 'UNSUPPORTED');
});
