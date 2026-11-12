// Timeline model: T-REG-04/05/07, P-07, tick budget (REQ-UI-08), zoom ladder, cursor description.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import * as v1 from './fixtures/baseline-v1.js';
import { sabbathJdn, ANCHOR_JDN, isSabbath, cycleOf } from '../src/core/index.js';
import { anniversaryOf, anniversaryJdnOfYear, isMilestone } from '../src/timeline/sabbath-row-rules.js';
import { fmtInt, fmtIntCompact, ordinal, approxYears } from '../src/ui/format.js';
import { serialize, parse } from '../src/timeline/url-state.js';
import { LEVEL_IDS, level, viewport, zoomIn, zoomOut, panDays } from '../src/timeline/zoom.js';
import { sabbathTicks, calendarTicks, markerTicks } from '../src/timeline/ticks.js';
import { describeCursor } from '../src/timeline/cursor.js';
import { adapters } from '../src/calendars/registry.js';

test('T-REG-04 COMPAT-07: anniversaryOf equals the baseline annivInfo for every day of years 33–3000', () => {
  let anniversaries = 0;
  for (let y = 33; y <= 3000; y++) {
    assert.equal(anniversaryJdnOfYear(BigInt(y)), BigInt(v1.annivJdnOfYear(y)), `year ${y}`);
    for (let m = 1; m <= 12; m++) {
      const n = v1.daysInMonth(y, m);
      for (let d = 1; d <= n; d++) {
        const j = v1.jdnFromGregorian(y, m, d);
        const expected = v1.isSabbath(j) ? v1.annivInfo(y, m, d, j) : null;
        const got = anniversaryOf(BigInt(j));
        assert.equal(got, expected === null ? null : BigInt(expected), `${y}-${m}-${d}`);
        if (got !== null) anniversaries++;
      }
    }
  }
  assert.equal(anniversaries, 2968);   // one per year 33…3000 (year 33 = the anchor itself, value 0)
  assert.equal(anniversaryOf(ANCHOR_JDN), 0n);
});

test('T-REG-05 COMPAT-08: milestone rule', () => {
  for (const [n, exp] of [[0n, false], [999n, false], [1000n, true], [1001n, false], [103000n, true], [-1000n, false]]) assert.equal(isMilestone(n), exp, `n=${n}`);
});

test('T-REG-07 COMPAT-12: fmtInt with thousands separators and U+2212', () => {
  assert.equal(fmtInt(-1234567n), '−1,234,567');
  assert.equal(fmtInt(103992n), '103,992');
  assert.equal(fmtInt(0n), '0');
  assert.equal(fmtInt(-5n), '−5');
  assert.equal(fmtIntCompact(10n ** 30n), '1.00 × 10^30');
  assert.equal(ordinal(1), '1st'); assert.equal(ordinal(12), '12th'); assert.equal(ordinal(23), '23rd'); assert.equal(ordinal(1993), '1993rd');
  assert.match(approxYears(728112n), /^≈ 1,993\.5 years$/);
  assert.match(approxYears(-7n * 10n ** 30n), /10\^/);
});

test('P-07 URL state round trip', () => {
  fc.assert(fc.property(fc.bigInt({ min: -(10n ** 40n), max: 10n ** 40n }), fc.constantFrom(...LEVEL_IDS), (j, z) => {
    const s = { cursorJdn: j, level: z };
    const back = parse(serialize(s));
    return back !== null && back.cursorJdn === j && back.level === z;
  }), { seed: 20261111, numRuns: 2000 });
  assert.equal(parse(''), null); assert.equal(parse('#j=abc&z=week'), null); assert.equal(parse('#j=1&z=nope'), null);
  assert.equal(serialize({ cursorJdn: 1733205n, level: 'week' }), '#j=1733205&z=week');
});

test('zoom ladder: spans strictly increase; in/out are inverse inside the range; viewport maps start→0 and end+1→width', () => {
  let prev = 0n;
  for (const id of LEVEL_IDS) { const l = level(id); assert.ok(l.spanDays > prev, id); prev = l.spanDays; }
  for (let i = 1; i < LEVEL_IDS.length - 1; i++) {
    assert.equal(zoomIn(zoomOut(LEVEL_IDS[i])), LEVEL_IDS[i]);
    assert.equal(zoomOut(zoomIn(LEVEL_IDS[i])), LEVEL_IDS[i]);
  }
  assert.equal(zoomIn('day'), 'day'); assert.equal(zoomOut(LEVEL_IDS.at(-1)), LEVEL_IDS.at(-1));
  const vp = viewport(ANCHOR_JDN, 'week', 1000);
  assert.equal(vp.x(vp.start), 0);
  assert.ok(Math.abs(vp.x(vp.end + 1n) - 1000) < 1e-6);
  assert.equal(vp.jdnAt(0), vp.start);
  assert.equal(vp.jdnAt(999.9), vp.end);
  assert.ok(vp.start <= ANCHOR_JDN && ANCHOR_JDN <= vp.end);
  assert.ok(panDays('day', 0.1) >= 1n && panDays('day', -0.1) <= -1n);
});

test('tick budget: every row ≤ 400 ticks and < 50 ms at four cursors × every zoom level (REQ-UI-08, T-UI-03)', () => {
  const cursors = [ANCHOR_JDN, 2_461_356n, sabbathJdn(-(10n ** 9n)), sabbathJdn(10n ** 30n)];
  for (const c of cursors) for (const id of LEVEL_IDS) {
    const vp = viewport(c, id, 1280);
    const t0 = performance.now();
    const st = sabbathTicks(vp);
    assert.ok(st.length <= 400, `sabbath ${id} @ ${c}: ${st.length}`);
    for (const t of st) { assert.ok(t.jdn >= vp.start && t.jdn <= vp.end); assert.ok(isSabbath(t.jdn)); }
    const majors = st.filter(t => t.weight === 'major');
    assert.ok(majors.length >= 1 || vp.spanDays < 7n, `sabbath ${id} @ ${c}: no major ticks`);
    for (let i = 1; i < majors.length; i++) assert.ok(majors[i].jdn > majors[i - 1].jdn);
    for (const a of adapters) {
      const r = calendarTicks(a, vp, { era: 'BC/AD' });
      assert.ok(r.ticks.length <= 400, `${a.id} ${id} @ ${c}: ${r.ticks.length}`);
      for (const t of r.ticks) { assert.ok(t.jdn >= vp.start && t.jdn <= vp.end); assert.ok(typeof t.label === 'string'); assert.ok(t.certainty); }
      if (r.collapsed) assert.ok(r.collapsed.reason.length > 0);
    }
    const mk = markerTicks(vp);
    assert.ok(mk.length <= 5);
    const ms = performance.now() - t0;
    assert.ok(ms < 50, `${id} @ ${c}: ${ms.toFixed(1)} ms`);
  }
});

test('tick content: anchor week shows #0/#1/#2 as seals; far past shows calendar rows collapsed with a reason', () => {
  const vp = viewport(ANCHOR_JDN, 'week', 1280);
  const labels = sabbathTicks(vp).filter(t => t.weight === 'major').map(t => t.label);
  assert.ok(labels.includes('#1') && labels.includes('#0') && labels.includes('#−1'));
  assert.equal(sabbathTicks(vp).find(t => t.jdn === ANCHOR_JDN).kind, 'anchor');
  const far = viewport(sabbathJdn(-(10n ** 12n)), 'century', 1280);
  for (const a of adapters) { const r = calendarTicks(a, far); assert.ok(r.collapsed, a.id); assert.equal(r.ticks.length, 0); }
  const sab = sabbathTicks(far);
  assert.ok(sab.some(t => t.label.startsWith('#−')));
  const y1582 = viewport(2_299_161n, 'month', 1280);
  const g = calendarTicks(adapters.find(a => a.id === 'gregorian'), y1582);
  assert.ok(g.ticks.some(t => t.label === 'Nov') && g.ticks.every(t => t.certainty === 'EXACT' || t.jdn < 2_299_161n));
  const h = calendarTicks(adapters.find(a => a.id === 'hebrew'), viewport(2_461_356n, 'year', 1280));
  assert.ok(h.ticks.some(t => /^AM 57\d\d$/.test(t.label)));
  const ch = calendarTicks(adapters.find(a => a.id === 'chinese'), viewport(2_461_356n, 'year', 1280));
  assert.ok(ch.ticks.some(t => t.label === '2026 丙午'));
});

test('describeCursor at the anchor and at a weekday', () => {
  const a = describeCursor(ANCHOR_JDN);
  assert.equal(a.day.sabbathIndex, 1n);
  assert.equal(a.anniversary, 0n);
  const by = Object.fromEntries(a.calendars.map(c => [c.id, c]));
  assert.equal(by.julian.label, '4 April AD 33'); assert.equal(by.julian.support.certainty, 'EXACT');
  assert.equal(by.gregorian.label, '2 April AD 33'); assert.equal(by.gregorian.support.certainty, 'CONVENTIONAL');
  assert.equal(by.hebrew.label, '15 Nisan AM 3793'); assert.equal(by.hebrew.support.certainty, 'CONVENTIONAL');
  assert.equal(by.chinese.label, null); assert.equal(by.chinese.support.certainty, 'UNSUPPORTED');
  const w = describeCursor(2_461_356n);   // Wed 11 Nov 2026
  assert.equal(w.day.isSabbath, false); assert.equal(w.day.cycle, 104_023n); assert.equal(cycleOf(2_461_356n), 104_023n);
  assert.equal(Object.fromEntries(w.calendars.map(c => [c.id, c.label])).chinese.includes('丙午'), true);
});
