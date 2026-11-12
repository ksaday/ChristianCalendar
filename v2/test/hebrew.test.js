// T-CAL-30 … T-CAL-36.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  hebrew, HEBREW_EPOCH_JDN, newYearJdn, daysInYear, isLeapYear, daysInMonth, lastMonthOfYear, monthName,
  EXACT_FROM_JDN, TISHRI, NISAN,
} from '../src/calendars/hebrew.js';
import { gregorian } from '../src/calendars/gregorian.js';
import { isUnsupported } from '../src/calendars/adapter.js';
import { dayOfWeek } from '../src/core/index.js';

const vectors = JSON.parse(readFileSync(new URL('./vectors/hebrew.json', import.meta.url), 'utf8')).vectors;

test('T-CAL-30 epoch: 1 Tishri AM 1 ↔ JDN 347,998, a Monday', () => {
  assert.equal(HEBREW_EPOCH_JDN, 347_998n);
  assert.equal(newYearJdn(1n), 347_998n);
  assert.equal(dayOfWeek(347_998n), 0);
  const d = hebrew.fromJdn(347_998n);
  assert.deepEqual([d.year, d.month, d.day], [1n, TISHRI, 1]);
  assert.equal(hebrew.toJdn({ year: 1n, month: TISHRI, day: 1 }), 347_998n);
});

test('reference vectors (Hebcal holiday dates; anchor calculated label)', () => {
  for (const v of vectors) {
    const j = gregorian.toJdn({ year: BigInt(v.gregorian.year), month: v.gregorian.month, day: v.gregorian.day });
    const h = hebrew.fromJdn(j);
    assert.deepEqual([h.year, h.month, h.day], [BigInt(v.hebrew.year), v.hebrew.month, v.hebrew.day], v.note);
    assert.equal(hebrew.toJdn({ year: BigInt(v.hebrew.year), month: v.hebrew.month, day: v.hebrew.day }), j, v.note);
  }
  assert.equal(hebrew.format(hebrew.fromJdn(1_733_205n)), '15 Nisan AM 3793');
});

test('reference vectors (Hebcal converter API, 60 dates 1600–2200 and edges)', () => {
  const hv = JSON.parse(readFileSync(new URL('./vectors/hebrew-hebcal.json', import.meta.url), 'utf8')).vectors;
  assert.equal(hv.length, 60);
  for (const v of hv) {
    const j = gregorian.toJdn({ year: BigInt(v.gregorian.year), month: v.gregorian.month, day: v.gregorian.day });
    const h = hebrew.fromJdn(j);
    assert.deepEqual([h.year, h.month, h.day], [BigInt(v.hebrew.year), v.hebrew.month, v.hebrew.day], `${v.gregorian.year}-${v.gregorian.month}-${v.gregorian.day} (Hebcal ${v.hebrew.day} ${v.hebcalMonthName} ${v.hebrew.year})`);
  }
});

test('T-CAL-31 round trip: every day of every 7th year AM 1…10,000 plus every month start of every year', () => {
  for (let y = 1n; y <= 10_000n; y++) {
    const last = lastMonthOfYear(y);
    for (let m = 1; m <= last; m++) {
      const first = hebrew.toJdn({ year: y, month: m, day: 1 });
      const d = hebrew.fromJdn(first);
      assert.deepEqual([d.year, d.month, d.day], [y, m, 1], `AM ${y} month ${m}`);
      if (y % 7n !== 3n) continue;
      const n = daysInMonth(y, m);
      for (let day = 2; day <= n; day++) {
        const j = first + BigInt(day - 1);
        const e = hebrew.fromJdn(j);
        assert.deepEqual([e.year, e.month, e.day], [y, m, day], `AM ${y} ${m}/${day}`);
      }
      // day after the last of the month is the 1st of the next month in the civil order
      const after = hebrew.fromJdn(first + BigInt(n));
      assert.equal(after.day, 1);
    }
    assert.equal(hebrew.toJdn({ year: y, month: TISHRI, day: 1 }), newYearJdn(y));
  }
});

test('T-CAL-32 year lengths and leap-year positions in the 19-year cycle', () => {
  const lengths = new Set();
  for (let y = 1n; y <= 10_000n; y++) {
    const n = daysInYear(y);
    lengths.add(n);
    const leap = isLeapYear(y);
    assert.equal(n >= 383, leap, `AM ${y}`);
    const pos = Number(((y - 1n) % 19n) + 1n);
    assert.equal(leap, [3, 6, 8, 11, 14, 17, 19].includes(pos), `AM ${y} position ${pos}`);
  }
  assert.deepEqual([...lengths].sort((a, b) => a - b), [353, 354, 355, 383, 384, 385]);
});

test('T-CAL-33 dehiyyot: 1 Tishri is never Sunday, Wednesday or Friday', () => {
  for (let y = 1n; y <= 10_000n; y++) {
    const dow = dayOfWeek(newYearJdn(y));   // 0 = Mon … 5 = Sat, 6 = Sun
    assert.ok(dow !== 6 && dow !== 2 && dow !== 4, `AM ${y} new year on dow ${dow}`);
  }
});

test('T-CAL-35 certainty bands', () => {
  const j921 = gregorian.toJdn({ year: 921n, month: 6, day: 1 });
  const j923 = gregorian.toJdn({ year: 923n, month: 6, day: 1 });
  assert.equal(hebrew.support(j921).certainty, 'CONVENTIONAL');
  assert.equal(hebrew.support(j923).certainty, 'EXACT');
  assert.equal(hebrew.support(EXACT_FROM_JDN - 1n).certainty, 'CONVENTIONAL');
  assert.equal(hebrew.support(EXACT_FROM_JDN).certainty, 'EXACT');
  const anchor = hebrew.support(1_733_205n);
  assert.equal(anchor.certainty, 'CONVENTIONAL');
  assert.match(anchor.reason, /observ/);
  assert.equal(hebrew.support(gregorian.toJdn({ year: 500n, month: 1, day: 1 })).reason.startsWith('359–921'), true);
  assert.ok(isUnsupported(hebrew.fromJdn(347_997n)));
  assert.equal(hebrew.support(hebrew.mathRange.maxJdn + 1n).certainty, 'UNSUPPORTED');
});

test('month names, leap-month flag, nextBoundary', () => {
  assert.equal(monthName(5784n, 12), 'Adar I');
  assert.equal(monthName(5784n, 13), 'Adar II');
  assert.equal(monthName(5785n, 12), 'Adar');
  const adar2 = hebrew.fromJdn(hebrew.toJdn({ year: 5784n, month: 13, day: 1 }));
  assert.equal(adar2.leapMonth, true);
  const elul = hebrew.toJdn({ year: 5786n, month: 6, day: 29 });
  assert.equal(hebrew.nextBoundary(elul, 'month'), newYearJdn(5787n));
  assert.equal(hebrew.nextBoundary(elul, 'year'), newYearJdn(5787n));
  const adar = hebrew.toJdn({ year: 5785n, month: 12, day: 3 });
  assert.equal(hebrew.nextBoundary(adar, 'month'), hebrew.toJdn({ year: 5785n, month: NISAN, day: 1 }));
  assert.throws(() => hebrew.toJdn({ year: 5785n, month: 13, day: 1 }), /month must be 1\.\.12/);
  assert.throws(() => hebrew.toJdn({ year: 5785n, month: 2, day: 30 }), /day must be 1\.\.29/);
});

test('T-CAL-36 cross-check against ICU (Intl hebrew calendar) for 2,000 seeded days 1900–2100, when available', (t) => {
  const has = typeof Intl.supportedValuesOf === 'function' && Intl.supportedValuesOf('calendar').includes('hebrew');
  if (!has) { t.skip('Intl hebrew calendar not available in this engine'); return; }
  const fmt = new Intl.DateTimeFormat('en-u-ca-hebrew', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const alias = { tishri: 'tishri', tishrei: 'tishri', heshvan: 'marheshvan', cheshvan: 'marheshvan', marheshvan: 'marheshvan', kislev: 'kislev', tevet: 'tevet', shevat: 'shevat', 'adar i': 'adar i', adar: 'adar', 'adar ii': 'adar ii', nisan: 'nisan', iyar: 'iyyar', iyyar: 'iyyar', sivan: 'sivan', tamuz: 'tammuz', tammuz: 'tammuz', av: 'av', elul: 'elul' };
  const start = gregorian.toJdn({ year: 1900n, month: 1, day: 1 }), span = Number(gregorian.toJdn({ year: 2100n, month: 12, day: 31 }) - start);
  let x = 42, compared = 0;
  for (let i = 0; i < 2000; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const j = start + BigInt(x % span);
    const date = new Date(Number(j - 2440588n) * 86400000);
    const parts = Object.fromEntries(fmt.formatToParts(date).filter(p => ['year', 'month', 'day'].includes(p.type)).map(p => [p.type, p.value]));
    const h = hebrew.fromJdn(j);
    const ours = alias[monthName(h.year, h.month).toLowerCase()];
    const icu = alias[parts.month.toLowerCase()];
    assert.ok(icu, `unmapped ICU month name ${parts.month}`);
    assert.equal(`${h.year} ${ours} ${h.day}`, `${parts.year.replace(/\D/g, '')} ${icu} ${Number(parts.day)}`, `jdn ${j}`);
    compared++;
  }
  assert.equal(compared, 2000);
});
