// T-CAL-20 … T-CAL-24 and reference vectors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { julian, jdnFromJulian, julianFromJdn, isLeapYear, INSTITUTION_JDN, LAST_ROMAN_JDN } from '../src/calendars/julian.js';
import { gregorian } from '../src/calendars/gregorian.js';
import { dayOfWeek, isSabbath, sabbathIndexOf } from '../src/core/index.js';

const vectors = JSON.parse(readFileSync(new URL('./vectors/gregorian-julian.json', import.meta.url), 'utf8')).vectors;

test('reference vectors', () => {
  for (const v of vectors) {
    if (!v.julian) continue;
    const j = BigInt(v.jdn);
    const d = julian.fromJdn(j);
    assert.deepEqual({ year: d.year, month: d.month, day: d.day }, { year: BigInt(v.julian.year), month: v.julian.month, day: v.julian.day }, v.note);
    assert.equal(julian.toJdn({ year: BigInt(v.julian.year), month: v.julian.month, day: v.julian.day }), j, v.note);
  }
});

test('T-CAL-20 round trip exhaustive −2000…+4000, strided to ±10^4, sampled to ±10^9 years', () => {
  for (let j = jdnFromJulian(-2000n, 1, 1); j <= jdnFromJulian(4000n, 12, 31); j++) {
    const d = julianFromJdn(j);
    assert.equal(jdnFromJulian(d.year, d.month, d.day), j, `jdn ${j}`);
  }
  for (let j = jdnFromJulian(-10000n, 1, 1); j <= jdnFromJulian(10000n, 12, 31); j += 991n) {
    const d = julianFromJdn(j);
    assert.equal(jdnFromJulian(d.year, d.month, d.day), j);
  }
  for (let y = -(10n ** 9n); y <= 10n ** 9n; y += 12_345_677n) {
    for (const [m, d] of [[1, 1], [2, 28], [3, 1], [12, 31]]) assert.deepEqual(julianFromJdn(jdnFromJulian(y, m, d)), { year: y, month: m, day: d });
  }
});

test('T-CAL-21 anchor, JDN 0, 1582, leap years', () => {
  assert.equal(julian.format(julian.fromJdn(1733205n)), '4 April AD 33');
  assert.equal(julian.format(julian.fromJdn(0n)), '1 January 4713 BC');
  assert.equal(julian.format(julian.fromJdn(2299160n)), '4 October 1582');
  assert.equal(INSTITUTION_JDN, 1704987n);
  assert.equal(LAST_ROMAN_JDN, 2299160n);
  for (const [y, exp] of [[100n, true], [1900n, true], [-4n, true], [-3n, false], [0n, true], [4n, true], [2026n, false]]) assert.equal(isLeapYear(y), exp, `year ${y}`);
});

test('T-CAL-22 Gregorian label minus Julian label for the same JDN: −2 in AD 33, 0 in AD 250, +10 in 1582, +13 in 2026', () => {
  // Read the Gregorian label of day j as if it were a Julian date and subtract j: this is
  // (Gregorian label) − (Julian label) in days, since both labels name the same physical day.
  const labelDiff = (j) => { const g = gregorian.fromJdn(j); return julian.toJdn({ year: g.year, month: g.month, day: g.day }) - j; };
  assert.equal(labelDiff(1733205n), -2n);                                        // 2 Apr (G) vs 4 Apr (J) AD 33
  assert.equal(labelDiff(gregorian.toJdn({ year: 250n, month: 6, day: 1 })), 0n); // labels coincide 1 Mar 200 – 28 Feb 300
  assert.equal(labelDiff(2299161n), 10n);                                         // 15 Oct (G) vs 5 Oct (J) 1582
  assert.equal(labelDiff(2461142n), 13n);                                         // 11 Apr (G) vs 29 Mar (J) 2026
});

test('T-CAL-24 the 1582 reform does not touch the week or the Sabbath cycle', () => {
  assert.equal(dayOfWeek(2299160n), 3);   // Thursday 4 Oct 1582 (Julian)
  assert.equal(dayOfWeek(2299161n), 4);   // Friday 15 Oct 1582 (Gregorian)
  assert.equal(julian.format(julian.fromJdn(2299160n)), '4 October 1582');
  assert.equal(gregorian.format(gregorian.fromJdn(2299161n)), '15 October 1582');
  // Sabbaths straddling the reform: one Saturday before (9 Oct Gregorian = 29 Sep Julian ... ) and after
  const sabBefore = 2299155n, sabAfter = 2299162n;
  assert.ok(isSabbath(sabBefore) && isSabbath(sabAfter));
  assert.equal(sabbathIndexOf(sabAfter) - sabbathIndexOf(sabBefore), 1n);
  assert.equal(julian.format(julian.fromJdn(sabBefore)), '29 September 1582');
  assert.equal(gregorian.format(gregorian.fromJdn(sabAfter)), '16 October 1582');
});

test('T-CAL-23 support bands', () => {
  assert.equal(julian.support(INSTITUTION_JDN - 1n).reason.startsWith('proleptic'), true);
  assert.equal(julian.support(jdnFromJulian(8n, 1, 1)).certainty, 'EXACT');
  assert.equal(julian.support(jdnFromJulian(7n, 12, 31)).certainty, 'CONVENTIONAL');
  assert.equal(julian.support(LAST_ROMAN_JDN).certainty, 'EXACT');
  assert.equal(julian.support(LAST_ROMAN_JDN + 1n).certainty, 'CONVENTIONAL');
});
