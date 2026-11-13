// Phase 5 — civil date by region (5.4) and the early Julian calendar (5.7); doc 18 §5
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayOfWeek, DAY_NAMES, ANCHOR_JDN } from '../src/core/chronology.js';
import { isUnsupported, assertAdapter } from '../src/calendars/adapter.js';
import { julian, jdnFromJulian, julianFromJdn } from '../src/calendars/julian.js';
import { gregorian, jdnFromGregorian } from '../src/calendars/gregorian.js';
import { RECONSTRUCTIONS, REGIONS, reconstruction, civilAdapter, romanLabels } from '../src/calendars/civil.js';

const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const julText = (j) => { const d = julianFromJdn(j); return `${d.day} ${M[d.month - 1]} ${d.year <= 0n ? `${1n - d.year} BC` : `AD ${d.year}`}`; };

// Wikipedia "Julian calendar", reconstruction table (retrieved 2026-11-13): Roman 1 Jan 45 BC as a proleptic Julian date, and the first aligned day
const EXPECTED = {
  bennett: ['31 Dec 46 BC', '25 Feb 1 BC'], soltau: ['2 Jan 45 BC', '25 Feb AD 4'], matzat: ['1 Jan 45 BC', '25 Feb 1 BC'],
  ideler: ['1 Jan 45 BC', '25 Feb AD 4'], kepler: ['2 Jan 45 BC', '25 Feb AD 4'], harriot: ['1 Jan 45 BC', '25 Feb 1 BC'],
  bunting: ['1 Jan 45 BC', '25 Feb 1 BC'], christmann: ['2 Jan 45 BC', '25 Feb AD 4'], scaliger: ['2 Jan 45 BC', '25 Feb AD 4'],
};

test('T-CIV-01 all nine reconstructions reproduce the source\'s first Julian day and first aligned day', () => {
  assert.equal(RECONSTRUCTIONS.length, 9);
  for (const r of RECONSTRUCTIONS) {
    const x = reconstruction(r.id);
    assert.equal(julText(x.startJdn), EXPECTED[r.id][0], `${r.id}: Roman 1 Jan 45 BC`);
    const a = x.label(x.alignedJdn);
    assert.equal(`${a.day} ${M[a.month - 1]} ${a.year <= 0 ? `${1 - a.year} BC` : `AD ${a.year}`}`, EXPECTED[r.id][1], `${r.id}: first aligned day`);
    const r1 = x.label(x.startJdn); assert.deepEqual([r1.year, r1.month, r1.day], [-44, 1, 1]);
  }
  // the anchor is after every realignment: Sabbath #1 reads 4 April AD 33 under all of them
  for (const r of RECONSTRUCTIONS) {
    const a = civilAdapter('rome', r.id);
    assert.equal(a.format(a.fromJdn(ANCHOR_JDN)), '4 April AD 33 (Julian)');
  }
});

test('T-CIV-02 every Julian→Gregorian region: the day after its last Julian date carries its first Gregorian date; weekdays hold', () => {
  assert.equal(REGIONS.length, 30);
  for (const r of REGIONS) {
    const a = civilAdapter(r.id);
    const first = a.fromJdn(r.switchJdn);
    assert.equal(first.calendar, 'gregorian', r.id);
    assert.deepEqual([Number(first.year), first.month, first.day], r.first, `${r.id}: first Gregorian day`);
    if (r.prev !== 'julian') { assert.ok(isUnsupported(a.fromJdn(r.switchJdn - 1n)), r.id); assert.match(a.fromJdn(r.switchJdn - 1n).reason, /used the /); continue; }
    const last = a.fromJdn(r.switchJdn - 1n);
    assert.equal(last.calendar, 'julian', r.id);
    assert.deepEqual([Number(last.year), last.month, last.day], r.last, `${r.id}: last Julian day`);
    assert.equal(jdnFromGregorian(BigInt(r.first[0]), r.first[1], r.first[2]), r.switchJdn, `${r.id}: printed dates are consistent`);
    assert.equal(dayOfWeek(r.switchJdn), (dayOfWeek(r.switchJdn - 1n) + 1) % 7);
    if (r.weekdays) assert.deepEqual([DAY_NAMES[dayOfWeek(r.switchJdn - 1n)], DAY_NAMES[dayOfWeek(r.switchJdn)]], r.weekdays, r.id);
  }
  assert.equal(civilAdapter('rome').fromJdn(2299161n).day, 15);
  assert.deepEqual(['Thursday', 'Friday'], [DAY_NAMES[dayOfWeek(2299160n)], DAY_NAMES[dayOfWeek(2299161n)]]);
});

test('T-CIV-03 Great Britain: 2 → 14 September 1752; 3–13 September never happened; dual years 1156–1751', () => {
  const a = civilAdapter('britain');
  const j2 = jdnFromJulian(1752n, 9, 2);
  assert.equal(a.format(a.fromJdn(j2)), '2 September 1752 (Julian, Old Style)');
  assert.equal(a.format(a.fromJdn(j2 + 1n)), '14 September 1752 (Gregorian)');
  for (let d = 3; d <= 13; d++) { const t = a.toJdn({ year: 1752n, month: 9, day: d }); assert.ok(isUnsupported(t) && /did not occur in Britain/.test(t.reason), `${d} Sep`); }
  assert.equal(a.toJdn({ year: 1752n, month: 9, day: 14 }), j2 + 1n);
  assert.equal(a.format(a.fromJdn(jdnFromJulian(1751n, 2, 10))), '10 February 1750/51 (Julian, Old Style)');
  assert.equal(a.format(a.fromJdn(jdnFromJulian(1751n, 3, 24))), '24 March 1750/51 (Julian, Old Style)');
  assert.equal(a.format(a.fromJdn(jdnFromJulian(1751n, 3, 25))), '25 March 1751 (Julian, Old Style)');
  assert.equal(a.format(a.fromJdn(jdnFromJulian(1752n, 2, 10))), '10 February 1752 (Julian, Old Style)');
  assert.equal(a.format(a.fromJdn(jdnFromJulian(1700n, 1, 30))), '30 January 1699/1700 (Julian, Old Style)');
  assert.equal(a.fromJdn(jdnFromJulian(1661n, 1, 1)).legalYear, 1660n);                  // Pepys, "1 January 1660/61"
  const sc = civilAdapter('scotland');
  assert.equal(sc.fromJdn(jdnFromJulian(1650n, 2, 10)).legalYear, undefined);           // Scotland: 1 January from 1600
  assert.equal(sc.fromJdn(jdnFromJulian(1599n, 2, 10)).legalYear, 1598n);
  assert.match(a.support(j2).reason, /until 2 September 1752/);
});

test('T-CIV-04 Sweden: 28 Feb → 1 Mar 1700; 30 February 1712; 17 Feb → 1 Mar 1753', () => {
  const a = civilAdapter('sweden');
  const f28 = jdnFromJulian(1700n, 2, 28);
  assert.equal(a.format(a.fromJdn(f28)), '28 February 1700 (Julian)');
  assert.equal(a.format(a.fromJdn(f28 + 1n)), '1 March 1700 (Swedish calendar)');
  const feb30 = jdnFromJulian(1712n, 2, 29);
  assert.equal(a.format(a.fromJdn(feb30 - 1n)), '29 February 1712 (Swedish calendar)');
  assert.equal(a.format(a.fromJdn(feb30)), '30 February 1712 (Swedish calendar)');
  assert.equal(a.format(a.fromJdn(feb30 + 1n)), '1 March 1712 (Julian)');
  assert.equal(a.toJdn({ year: 1712n, month: 2, day: 30 }), feb30);
  assert.equal(a.format(a.fromJdn(jdnFromJulian(1753n, 2, 17))), '17 February 1753 (Julian)');
  assert.equal(a.format(a.fromJdn(jdnFromJulian(1753n, 2, 18))), '1 March 1753 (Gregorian)');
  assert.ok(isUnsupported(a.toJdn({ year: 1700n, month: 2, day: 29 })));
});

test('T-CIV-05 adapter contract and round trips for five regions and two reconstructions', () => {
  let s = 20261113n;
  const rand = () => { s ^= s << 13n; s &= (1n << 64n) - 1n; s ^= s >> 7n; s ^= s << 17n; s &= (1n << 64n) - 1n; return s; };
  for (const [region, recon] of [['rome', 'bennett'], ['britain', 'scaliger'], ['sweden', 'bennett'], ['russia', 'ideler'], ['japan', 'bennett']]) {
    const a = assertAdapter(civilAdapter(region, recon));
    const days = [];
    for (let j = jdnFromJulian(1690n, 1, 1); j <= jdnFromJulian(1760n, 12, 31); j++) days.push(j);
    for (let j = jdnFromJulian(-45n, 1, 1); j <= jdnFromJulian(12n, 12, 31); j++) days.push(j);
    for (let i = 0; i < 20000; i++) days.push(a.mathRange.minJdn + rand() % (jdnFromGregorian(3000n, 1, 1) - a.mathRange.minJdn));
    let n = 0;
    for (const j of days) {
      const d = a.fromJdn(j);
      if (isUnsupported(d)) { assert.ok(j < a.mathRange.minJdn, `${region}: unsupported inside range at ${j}`); continue; }
      assert.equal(a.toJdn(d), j, `${region}/${recon}: round trip ${a.format(d)}`);
      assert.ok(typeof a.support(j).certainty === 'string');
      n++;
    }
    assert.ok(n >= 20000);
    // month boundaries walk forward and land on day 1 (or the first day after a switch)
    let j = a.mathRange.minJdn + 100n;
    for (let i = 0; i < 50; i++) { const k = a.nextBoundary(j, 'month'); assert.ok(k > j); j = k; }
  }
  // the leap day of a reconstruction is a doubled 24 February
  const b = civilAdapter('rome', 'bennett');
  const y41 = BigInt(reconstruction('bennett').yearStart(-40));    // 41 BC, a Bennett leap year
  assert.equal(b.format(b.fromJdn(y41 + 55n)), '24 February (bis) 41 BC (Roman, Bennett (2003))');
  assert.equal(b.toJdn({ year: -40n, month: 2, day: 24, bis: true }), y41 + 55n);
});

test('T-CIV-06 Rome equals the Julian adapter after realignment and the Gregorian adapter after 1582; Japan before 1873 is unsupported', () => {
  const a = civilAdapter('rome');
  for (let j = reconstruction('bennett').alignedJdn; j < 2299161n; j += 97n) {
    const c = a.fromJdn(j), d = julian.fromJdn(j);
    if (c.calendar === 'julian') assert.deepEqual([c.year, c.month, c.day], [d.year, d.month, d.day]);
    else assert.ok(c.calendar === 'roman' && c.bis === false && c.month === 2, `${j}`);   // only the doubled-24-Feb convention differs, in leap Februaries
  }
  for (let j = 2299161n; j < 2299161n + 200000n; j += 101n) { const c = a.fromJdn(j), g = gregorian.fromJdn(j); assert.deepEqual([c.year, c.month, c.day], [g.year, g.month, g.day]); }
  const jp = civilAdapter('japan');
  const r = jp.fromJdn(jdnFromGregorian(1872n, 12, 31));
  assert.ok(isUnsupported(r)); assert.match(r.reason, /Japanese lunisolar/);
  assert.equal(jp.support(jdnFromGregorian(1873n, 1, 1)).certainty, 'EXACT');
  assert.ok(isUnsupported(a.fromJdn(reconstruction('bennett').startJdn - 1n)));
  assert.equal(a.support(jdnFromJulian(-20n, 6, 1)).certainty, 'APPROXIMATE');
  // the cursor card's comparison lists all nine reconstructions inside the period, nothing outside it
  const labels = romanLabels(jdnFromJulian(-11n, 4, 3));
  assert.equal(labels.length, 9); assert.ok(labels.every(l => l.label));
  assert.ok(new Set(labels.map(l => l.label)).size >= 2);
  assert.equal(romanLabels(ANCHOR_JDN), null);
});
