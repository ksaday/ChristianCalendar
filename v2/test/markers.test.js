// Phase 5 — Bible events and chronological systems (doc 17 §3, §6: T-EVT-01…06)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dayOfWeek, ANCHOR_JDN } from '../src/core/chronology.js';
import { jdnFromJulian } from '../src/calendars/julian.js';
import { hebrew } from '../src/calendars/hebrew.js';
import { birthYears, deathYears, PATRIARCHS } from '../src/markers/genesis.js';
import { SYSTEMS, SOURCES, ussherAmBand, hebrewAmBand, yearBand, bandYearLabel, civilJdn } from '../src/markers/systems.js';
import { EVENTS, EPOCHS, resolveDating, resolvedEvents, eventsBetween, eventsAround } from '../src/markers/events.js';

test('T-EVT-01 Genesis arithmetic: Flood AM 1656, Abram AM 1948 (Seder Olam) / 2008 (Ussher), Enoch taken 987, Noah † 2006', () => {
  const so = birthYears(), us = birthYears({ abramAtTerah: 130 });
  assert.equal(so.get('seth'), 130); assert.equal(so.get('noah'), 1056); assert.equal(so.get('flood'), 1656);
  assert.equal(so.get('arpachshad'), 1658); assert.equal(so.get('peleg'), 1757); assert.equal(so.get('terah'), 1878);
  assert.equal(so.get('abraham'), 1948); assert.equal(us.get('abraham'), 2008);
  const d = deathYears();
  assert.equal(d.get('adam'), 930); assert.equal(d.get('enoch'), 987); assert.equal(d.get('methuselah'), 1656); assert.equal(d.get('lamech'), 1651); assert.equal(d.get('noah'), 2006);
  assert.equal(PATRIARCHS.length, 19);
});

test('T-EVT-02 Ussher: Creation JDN 259,258 is a Sunday; AM 1656 = Oct 2349 – Oct 2348 BC; Exodus 1491 BC; Temple 1012 BC', () => {
  assert.equal(dayOfWeek(259258n), 6);
  assert.equal(ussherAmBand(1).start, 259258n);
  assert.equal(jdnFromJulian(-4003n, 10, 23), 259258n);
  const flood = ussherAmBand(1656);
  assert.equal(bandYearLabel(flood), '2349/2348 BC');
  assert.equal(flood.end - flood.start + 1n, 365n);
  const ex = resolveDating('ussher', EVENTS.find(e => e.id === 'exodus').datings.ussher);
  assert.equal(ex.figure, '1491 BC');
  assert.ok(ex.start <= jdnFromJulian(-1490n, 4, 1) && ex.end >= jdnFromJulian(-1490n, 4, 1));
  assert.equal(resolveDating('ussher', EVENTS.find(e => e.id === 'temple-founded').datings.ussher).figure, '1012 BC');
  assert.equal(resolveDating('ussher', EVENTS.find(e => e.id === 'adam').datings.ussher).points[0].label, 'Sunday 23 October 4004 BC (Julian)');
});

test('T-EVT-03 Seder Olam bands via the Hebrew adapter: AM 2448 contains Nisan 1313 BCE; AM 3338 ↔ 424/423 BCE; AM 3828 ↔ AD 67/68', () => {
  const ex = hebrewAmBand(2448);
  const nisan = hebrew.toJdn({ year: 2448n, month: 1, day: 15 });
  assert.ok(ex.start <= nisan && nisan <= ex.end);
  assert.equal(bandYearLabel(ex), '1314/1313 BC');
  assert.equal(bandYearLabel(hebrewAmBand(3338)), '424/423 BC');
  assert.equal(bandYearLabel(hebrewAmBand(3828)), 'AD 67/AD 68');
  assert.equal(hebrewAmBand(1).start, 347998n);
  assert.equal(resolveDating('seder-olam', EVENTS.find(e => e.id === 'flood').datings['seder-olam']).figure, 'AM 1656 · 2106/2105 BC');
});

test('T-EVT-04 every dating has a basis and a known source; every system resolves without throwing; AM datings within range', () => {
  const ids = new Set(SYSTEMS.map(s => s.id));
  assert.deepEqual([...ids], ['ussher', 'seder-olam', 'early-date', 'historical']);
  let figures = 0, nones = 0;
  for (const e of EVENTS) {
    assert.ok(e.id && e.label && e.ref && e.group, e.id);
    for (const sys of ids) {
      const d = e.datings[sys];
      assert.ok(d, `${e.id}: missing dating for ${sys}`);
      if (d.kind === 'none') { assert.ok(d.reason.length > 10, `${e.id}/${sys}: reason`); nones++; continue; }
      assert.ok(d.basis && d.basis.length > 8, `${e.id}/${sys}: basis`);
      assert.ok(SOURCES[d.source], `${e.id}/${sys}: unknown source ${d.source}`);
      if (/derived/i.test(d.basis)) assert.match(d.basis, /[+−-]|=/, `${e.id}/${sys}: derived without arithmetic`);
      const r = resolveDating(sys, d);
      assert.ok(r && r.start <= r.end && typeof r.figure === 'string' && r.figure.length > 0, `${e.id}/${sys}`);
      if (d.kind === 'am') assert.ok(d.am >= 1 && d.am < 6000);
      figures++;
    }
  }
  assert.equal(EVENTS.length, 52);
  assert.ok(figures > 120 && nones > 20, `${figures} figures, ${nones} without`);
  // the four systems never disagree about the order of events they both date
  const order = (sys) => resolvedEvents(sys).filter(r => r.position).map(r => r.event.id);
  const u = order('ussher'), so = order('seder-olam');
  const common = so.filter(id => u.includes(id));
  assert.deepEqual(common, u.filter(id => so.includes(id)));
  for (const r of resolvedEvents('ussher')) if (r.position) assert.ok(r.position.certainty === 'INTERPRETATION');
});

test('T-EVT-05 exact historical days: 16 Mar 597 BC, 12 Oct 539 BC, Fri 7 Apr AD 30, Fri 3 Apr AD 33 = anchor − 1', () => {
  const byId = Object.fromEntries(EVENTS.map(e => [e.id, e]));
  assert.equal(byId['jerusalem-597'].datings.historical.jdn, jdnFromJulian(-596n, 3, 16));
  assert.equal(byId['jerusalem-597'].datings.historical.certainty, 'EXACT');
  assert.equal(byId['babylon-falls'].datings.historical.jdn, jdnFromJulian(-538n, 10, 12));
  const cr = byId.crucifixion.datings.historical;
  assert.equal(cr.days[0].jdn, jdnFromJulian(30n, 4, 7)); assert.equal(dayOfWeek(cr.days[0].jdn), 4);
  assert.equal(cr.days[1].jdn, ANCHOR_JDN - 1n); assert.equal(dayOfWeek(cr.days[1].jdn), 4);
  const r = resolveDating('historical', cr);
  assert.equal(r.kind, 'alt'); assert.equal(r.points.length, 2); assert.equal(r.jump, ANCHOR_JDN - 1n);
  assert.equal(EPOCHS.find(e => e.id === 'epoch-byzantine').jdn, -290495n);
  assert.equal(dayOfWeek(-290495n), 5);
  assert.equal(civilJdn(1582, 10, 15), 2299161n); assert.equal(civilJdn(1582, 10, 4), 2299160n);
  assert.equal(yearBand(-1490).end - yearBand(-1490).start + 1n, 365n);
});

test('T-EVT-06 queries: eventsBetween and eventsAround; the markers layer stays out of core/calendars/timeline', () => {
  const inRange = eventsBetween('ussher', jdnFromJulian(-1500n, 1, 1), jdnFromJulian(-1400n, 12, 31)).map(r => r.event.id);
  assert.deepEqual(inRange, ['exodus', 'entry']);
  const around = eventsAround('ussher', jdnFromJulian(-1490n, 6, 1));
  assert.deepEqual(around.containing.map(r => r.event.id), ['exodus']);
  assert.equal(around.previous.event.id, 'moses'); assert.equal(around.next.event.id, 'entry');
  for (const f of ['src/core/chronology.js', 'src/core/invariants.js', 'src/timeline/ticks.js', 'src/timeline/cursor.js', 'src/calendars/registry.js']) {
    assert.ok(!/markers\//.test(readFileSync(new URL('../' + f, import.meta.url), 'utf8')), `${f} imports markers`);
  }
});
