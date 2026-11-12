// T-CAL-40 … T-CAL-46: Chinese adapter versus Hong Kong Observatory tables and ICU.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chinese, chineseFromJdn, sexagenary, newYearOnOrBefore, EXACT_FROM, EXACT_TO } from '../src/calendars/chinese/chinese.js';
import { gregorian, jdnFromGregorian } from '../src/calendars/gregorian.js';
import { isUnsupported } from '../src/calendars/adapter.js';

const hko = JSON.parse(readFileSync(new URL('./vectors/chinese-hko.json', import.meta.url), 'utf8'));
const jg = (y, m, d) => Number(jdnFromGregorian(BigInt(y), m, d));

test('T-CAL-40 every HKO lunar-month start 1929–2100 matches (number, leap flag, day 1); 1901–1928 differ only in documented borderline months', () => {
  const mismatches = [];
  let exactChecked = 0;
  for (const mo of hko.months) {
    const [y, m, d] = mo.g;
    const j = jg(y, m, d);
    const r = chineseFromJdn(j);
    const ok = r.day === 1 && r.month === mo.month && r.leap === mo.leap && chineseFromJdn(j - 1).day >= 29;
    if (y >= EXACT_FROM) { exactChecked++; assert.ok(ok, `HKO ${y}-${m}-${d} month ${mo.month}${mo.leap ? ' leap' : ''}: got month ${r.month}${r.leap ? ' leap' : ''} day ${r.day}`); }
    else if (!ok) mismatches.push(`${y}-${m}-${d}`);
  }
  assert.ok(exactChecked > 2100, `checked ${exactChecked} months in the EXACT band`);
  assert.deepEqual(mismatches, ['1906-4-24', '1917-3-23', '1917-4-21', '1922-6-25', '1922-7-24'],
    'pre-1929 borderline months (new moon or major solar term within minutes of midnight)');
});

test('T-CAL-41 leap months, including the 2033 anomaly', () => {
  const leap = (y, month, gm, gd) => {
    const r = chineseFromJdn(jg(y, gm, gd));
    assert.deepEqual([r.month, r.leap, r.day], [month, true, 1], `${y} leap ${month}`);
  };
  leap(2017, 6, 7, 23); leap(2020, 4, 5, 23); leap(2023, 2, 3, 22); leap(2025, 6, 7, 25); leap(2033, 11, 12, 22);
  const hkoLeaps = hko.months.filter(m => m.leap).map(m => `${m.g[0]}:${m.month}`);
  assert.equal(hkoLeaps.length, 73);
  assert.ok(hkoLeaps.includes('2033:11'));
});

test('T-CAL-42 Chinese New Year 1901–2100 equals the HKO first day of month 1; nextBoundary(year) steps to the next one', () => {
  const nys = hko.months.filter(m => m.month === 1 && !m.leap);
  assert.equal(nys.length, 200);
  let prev = null;
  for (const ny of nys) {
    const j = jg(...ny.g);
    assert.equal(newYearOnOrBefore(j), j, `CNY ${ny.g.join('-')}`);
    assert.equal(newYearOnOrBefore(j + 200), j);
    if (prev !== null && ny.g[0] >= EXACT_FROM) assert.equal(chinese.nextBoundary(BigInt(prev), 'year'), BigInt(j));
    prev = j;
  }
  assert.equal(chinese.nextBoundary(BigInt(jg(2026, 10, 3)), 'month'), BigInt(jg(2026, 10, 10)));
});

test('T-CAL-43 sexagenary names and cycle numbering', () => {
  const y2026 = chinese.fromJdn(BigInt(jg(2026, 10, 3)));
  assert.equal(y2026.extras.stemBranch, '丙午');
  assert.equal(y2026.extras.animal, 'Horse');
  assert.equal(y2026.year, 2026n);
  assert.deepEqual([y2026.month, y2026.leapMonth, y2026.day], [8, false, 23]);
  assert.equal(y2026.extras.cycle, 78);
  assert.equal(y2026.extras.yearInCycle, 43);
  assert.equal(chinese.fromJdn(BigInt(jg(1984, 6, 1))).extras.stemBranch, '甲子');
  assert.equal(chinese.fromJdn(BigInt(jg(1984, 6, 1))).extras.yearInCycle, 1);
  assert.equal(chinese.fromJdn(BigInt(jg(1645, 6, 1))).extras.stemBranch, '乙酉');
  assert.equal(sexagenary(60).name, '癸亥');
  // early January belongs to the previous Chinese year
  assert.equal(chinese.fromJdn(BigInt(jg(2026, 1, 10))).year, 2025n);
  assert.equal(chinese.fromJdn(BigInt(jg(2026, 1, 10))).extras.stemBranch, '乙巳');
});

test('T-CAL-44 certainty bands', () => {
  assert.equal(chinese.support(BigInt(jg(1644, 12, 31))).certainty, 'UNSUPPORTED');
  assert.ok(isUnsupported(chinese.fromJdn(BigInt(jg(1644, 12, 31)))));
  assert.equal(chinese.support(BigInt(jg(1700, 6, 1))).certainty, 'APPROXIMATE');
  assert.equal(chinese.support(BigInt(jg(1950, 6, 1))).certainty, 'EXACT');
  assert.equal(chinese.support(BigInt(jg(2150, 6, 1))).certainty, 'APPROXIMATE');
  assert.equal(chinese.support(BigInt(jg(2201, 1, 1))).certainty, 'UNSUPPORTED');
  assert.equal(chinese.support(1_733_205n).certainty, 'UNSUPPORTED');   // the anchor: no Chinese label in this version
});

const KNOWN_PRE_1929_MISMATCHES = new Set(['1906-4-24', '1917-3-23', '1917-4-21', '1922-6-25', '1922-7-24']);

test('T-CAL-45 borderline months inside 1929–2100 are downgraded to APPROXIMATE, and there are few of them', () => {
  const flagged = [];
  for (const mo of hko.months) {
    const [y] = mo.g;
    if (y < EXACT_FROM || y > EXACT_TO) continue;
    const s = chinese.support(BigInt(jg(...mo.g)));
    if (s.certainty === 'APPROXIMATE') flagged.push(`${mo.g.join('-')}: ${s.reason}`);
    else assert.equal(s.certainty, 'EXACT');
  }
  assert.ok(flagged.length <= 25, `flagged ${flagged.length}:\n${flagged.join('\n')}`);
  for (const f of flagged) assert.match(f, /new moon|solar term/);
});

test('round trip toJdn(fromJdn(j)) = j for every day 1900–2100 and for the first day of every HKO month; invalid dates rejected', () => {
  for (let j = jg(1900, 1, 1); j <= jg(2100, 12, 31); j++) {
    const d = chinese.fromJdn(BigInt(j));
    assert.equal(chinese.toJdn(d), BigInt(j), `jdn ${j}`);
  }
  for (const mo of hko.months) {
    if (KNOWN_PRE_1929_MISMATCHES.has(mo.g.join('-'))) continue;
    const j = jg(...mo.g);
    const cy = chinese.fromJdn(BigInt(j)).year;
    assert.equal(chinese.toJdn({ year: cy, month: mo.month, leapMonth: mo.leap, day: 1 }), BigInt(j), mo.g.join('-'));
  }
  assert.throws(() => chinese.toJdn({ year: 2026n, month: 6, leapMonth: true, day: 1 }), /no such date/);   // 2026 has no leap month
  assert.throws(() => chinese.toJdn({ year: 2026n, month: 13, day: 1 }), /month must be/);
  assert.ok(isUnsupported(chinese.toJdn({ year: 1500n, month: 1, day: 1 })));
});

test('T-CAL-46 cross-check against ICU (Intl chinese calendar) for 2,000 seeded days 1950–2050, when available', (t) => {
  const has = typeof Intl.supportedValuesOf === 'function' && Intl.supportedValuesOf('calendar').includes('chinese');
  if (!has) { t.skip('Intl chinese calendar not available'); return; }
  const fmt = new Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Shanghai' });
  const probe = fmt.formatToParts(new Date(Date.UTC(2025, 6, 25, 12)));  // 25 Jul 2025 = leap 6th month, day 1
  const probeMonth = probe.find(p => p.type === 'month')?.value ?? '';
  if (!/^6/.test(probeMonth) || !/bis|閏|leap/i.test(probeMonth)) { t.skip(`ICU leap-month notation not recognised: ${probeMonth}`); return; }
  const start = jg(1950, 1, 1), span = jg(2050, 12, 31) - start;
  let x = 7, compared = 0;
  const icuDisagreements = [];
  const hkoStarts = hko.months.map(m => ({ jdn: jg(...m.g), month: m.month, leap: m.leap }));
  for (let i = 0; i < 2000; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const j = start + (x % span);
    const parts = Object.fromEntries(fmt.formatToParts(new Date((j - 2440588) * 86400000 + 12 * 3600000)).filter(p => p.type === 'month' || p.type === 'day').map(p => [p.type, p.value]));
    const ours = chinese.fromJdn(BigInt(j));
    const icuMonth = parseInt(parts.month, 10), icuLeap = /bis|閏|leap/i.test(parts.month);
    const same = ours.month === icuMonth && ours.leapMonth === icuLeap && ours.day === parseInt(parts.day, 10);
    if (!same) {
      // ICU is not a historical authority. Where it disagrees (midnight new moons, leap-month assignment),
      // the Hong Kong Observatory table must side with us.
      const k = hkoStarts.findLastIndex(st => st.jdn <= j);
      const st = hkoStarts[k];
      assert.deepEqual([ours.month, ours.leapMonth, ours.day], [st.month, st.leap, j - st.jdn + 1],
        `jdn ${j} (${gregorian.format(gregorian.fromJdn(BigInt(j)))}): ours ${ours.month}${ours.leapMonth ? 'L' : ''}/${ours.day}, ICU ${parts.month}/${parts.day}, HKO ${st.month}${st.leap ? 'L' : ''}/${j - st.jdn + 1}`);
      icuDisagreements.push(`${gregorian.format(gregorian.fromJdn(BigInt(j)))}: ICU ${parts.month}/${parts.day} vs ours+HKO ${ours.month}${ours.leapMonth ? 'L' : ''}/${ours.day}`);
    }
    compared++;
  }
  assert.equal(compared, 2000);
  assert.ok(icuDisagreements.length <= 60, icuDisagreements.join('\n'));
  t.diagnostic(`ICU disagreed on ${icuDisagreements.length} of 2000 days; HKO sided with this adapter on every one`);
});
