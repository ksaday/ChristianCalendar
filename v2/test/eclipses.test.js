// Phase 5 — eclipse canon and recorded eclipses (doc 17 §4, §6: T-ECL-01…05)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { jdnFromJulian } from '../src/calendars/julian.js';
import { jdnFromGregorian } from '../src/calendars/gregorian.js';
import { parseCanon, eclipsesBetween, eclipsesOn, countBetween, nextEclipse, previousEclipse, deltaTSigma, dayUncertain, describeEclipse, civilYearOf } from '../src/markers/eclipses.js';
import { RECORDED, matchCanon, recordedWithCanon } from '../src/markers/recorded-eclipses.js';

const load = (k) => parseCanon(JSON.parse(readFileSync(new URL(`../data/eclipses/${k}.json`, import.meta.url), 'utf8')));
const solar = load('solar'), lunar = load('lunar');
const sets = { solar, lunar };

test('T-ECL-01 canon parse: 11,898 solar and 12,064 lunar eclipses, strictly increasing, known types, 1999 BC – AD 3000', () => {
  assert.equal(solar.count, 11898); assert.equal(lunar.count, 12064);
  for (const s of [solar, lunar]) {
    for (let i = 1; i < s.jdns.length; i++) assert.ok(s.jdns[i] > s.jdns[i - 1]);
    assert.ok(s.rows.every(e => e.utMinutes >= 0 && e.utMinutes < 1440 && typeof e.magnitude === 'number' && Number.isInteger(e.saros)));
    assert.equal(civilYearOf(s.rows[0].jdn), -1999); assert.equal(civilYearOf(s.rows[s.count - 1].jdn), 3000);
  }
  assert.deepEqual([...new Set(solar.rows.map(e => e.type[0]))].sort(), ['A', 'H', 'P', 'T']);
  assert.deepEqual([...new Set(lunar.rows.map(e => e.type[0]))].sort(), ['N', 'P', 'T']);
  // no more than ~7 eclipses a year, and never fewer than 4 (2 solar + 2 lunar)
  for (const y of [-1000, 33, 1582, 2026]) {
    const n = countBetween(solar, jdnFromJulian(BigInt(y), 1, 1), jdnFromJulian(BigInt(y), 12, 31)) + countBetween(lunar, jdnFromJulian(BigInt(y), 1, 1), jdnFromJulian(BigInt(y), 12, 31));
    assert.ok(n >= 4 && n <= 7, `${y}: ${n}`);
  }
});

test('T-ECL-02 spot vectors against the canon', () => {
  const one = (set, jdn) => { const r = eclipsesOn(set, jdn); assert.equal(r.length, 1, `no eclipse on ${jdn}`); return r[0]; };
  assert.equal(one(solar, jdnFromGregorian(2017n, 8, 21)).type, 'T');
  assert.equal(one(solar, jdnFromGregorian(1999n, 8, 11)).type, 'T');
  assert.equal(one(solar, jdnFromGregorian(2024n, 4, 8)).type, 'T');
  assert.equal(one(solar, jdnFromJulian(-762n, 6, 15)).typeName, 'total');       // Assyrian eclipse
  assert.equal(one(solar, jdnFromJulian(-584n, 5, 28)).typeName, 'total');       // Thales
  assert.equal(one(lunar, jdnFromJulian(-330n, 9, 20)).typeName, 'total');       // Gaugamela
  const hw = one(lunar, jdnFromJulian(33n, 4, 3));                                 // Humphreys–Waddington
  assert.equal(hw.typeName, 'partial'); assert.ok(hw.magnitude > 0.5 && hw.magnitude < 0.7);
  assert.equal(one(lunar, jdnFromJulian(-3n, 3, 13)).typeName, 'partial');       // Josephus / Herod
  assert.equal(eclipsesOn(solar, 1733205n).length, 0);                            // no eclipse on Sabbath #1
  assert.equal(nextEclipse(solar, jdnFromGregorian(2024n, 4, 8)).jdn, jdnFromGregorian(2024n, 10, 2));
  assert.equal(previousEclipse(solar, jdnFromGregorian(2024n, 4, 8)).jdn, jdnFromGregorian(2023n, 10, 14));
  // UT day vs TD day: the canon lists −1999 Jun 12 03:14 TD with ΔT 46,438 s (12.9 h), so the UT day is 11 June
  assert.equal(solar.rows[0].jdn, jdnFromJulian(-1999n, 6, 11)); assert.equal(solar.rows[0].utMinutes, 861);
});

test('T-ECL-03 ΔT uncertainty: −1000 → 636 s; 1820 → 0; 2005 → 2.7 s; Huber beyond the fitted span grows', () => {
  assert.ok(Math.abs(deltaTSigma(-1000) - 636.2) < 0.5);
  assert.equal(deltaTSigma(1820), 0);
  assert.ok(Math.abs(deltaTSigma(2005) - 2.74) < 0.05);
  assert.ok(deltaTSigma(-2000) > deltaTSigma(-1000) && deltaTSigma(3000) > deltaTSigma(2005));
  assert.ok(deltaTSigma(-1500) > deltaTSigma(-1001));
  // an ancient eclipse close to midnight UT is flagged, a modern one is not
  const near = solar.rows.find(e => civilYearOf(e.jdn) < -1500 && (e.utMinutes < 5 || e.utMinutes > 1435));
  assert.ok(near && dayUncertain(near));
  const modern = eclipsesOn(solar, jdnFromGregorian(2017n, 8, 21))[0];
  assert.equal(dayUncertain(modern), false);
  const d = describeEclipse(modern);
  assert.match(d.detail, /Total solar eclipse · greatest at 18:26 UT · magnitude 1\.031 · Saros 145/);
  assert.match(d.deltaTText, /ΔT = 70 s ± /);
});

test('T-ECL-04 every recorded eclipse coincides with a canon eclipse of its kind (same UT day, or the adjacent one)', () => {
  const { entries, missing } = recordedWithCanon(sets);
  assert.deepEqual(missing, []);
  assert.equal(entries.length, RECORDED.length);
  assert.ok(RECORDED.length >= 30);
  for (const e of RECORDED) {
    assert.ok(e.record.length > 20 && e.source.length > 10 && ['attested', 'disputed', 'interpretation'].includes(e.status), e.id);
    const m = matchCanon(e, sets);
    assert.ok(Math.abs(m.offsetDays) <= 1);
  }
  const byId = Object.fromEntries(entries.map(e => [e.id, e]));
  assert.equal(byId['bur-sagale'].canon.type, 'T'); assert.equal(byId['clavius-1567'].canon.type, 'H');
  assert.equal(byId['hw-33'].canon.jdn, 1733204n); assert.equal(byId['double-dawn'].offsetDays, -1);
  assert.equal(entries.filter(e => e.offsetDays !== 0).length, 1);
});

test('T-ECL-05 viewport query is a binary search: wide BigInt viewports clamp, narrow ones slice', () => {
  assert.equal(eclipsesBetween(solar, -(10n ** 30n), 10n ** 30n).length, solar.count);
  assert.equal(eclipsesBetween(solar, 10n ** 20n, 10n ** 21n).length, 0);
  assert.equal(eclipsesBetween(lunar, -(10n ** 21n), -(10n ** 20n)).length, 0);
  const y2026 = eclipsesBetween(solar, jdnFromGregorian(2026n, 1, 1), jdnFromGregorian(2026n, 12, 31));
  assert.deepEqual(y2026.map(e => e.type), ['A', 'T']);
  assert.equal(countBetween(lunar, jdnFromGregorian(2026n, 1, 1), jdnFromGregorian(2026n, 12, 31)), 2);
});
