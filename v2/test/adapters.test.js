// T-CAL-01, T-CAL-02, REQ-CAL-01 (stub adapter), P-05 spot checks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adapters, getAdapter } from '../src/calendars/registry.js';
import { Certainty, isUnsupported, unsupported, support, assertAdapter } from '../src/calendars/adapter.js';

test('registry exposes julian, gregorian, hebrew and validates shape', () => {
  assert.deepEqual(adapters.map(a => a.id), ['julian', 'gregorian', 'hebrew']);
  for (const a of adapters) assertAdapter(a);
  assert.throws(() => getAdapter('nope'), RangeError);
});

test('T-CAL-01 certainty is a member of the enum across a sweep, and boundaries sit at the declared JDNs ± 1', () => {
  const values = new Set(Object.values(Certainty));
  const sweep = [-(10n ** 12n), -290_495n, 0n, 347_998n, 1_733_205n, 2_299_160n, 2_299_161n, 2_461_142n, 10n ** 12n];
  for (const a of adapters) for (const j of sweep) assert.ok(values.has(a.support(j).certainty), `${a.id} @ ${j}`);
  const g = getAdapter('gregorian');
  assert.equal(g.support(2_299_160n).certainty, 'CONVENTIONAL');
  assert.equal(g.support(2_299_161n).certainty, 'EXACT');
  const ju = getAdapter('julian');
  assert.equal(ju.support(1_704_986n).certainty, 'CONVENTIONAL');
  assert.equal(ju.support(1_704_987n).certainty, 'CONVENTIONAL');   // 45 BC – AD 8 regularized band
  assert.equal(ju.support(2_299_160n).certainty, 'EXACT');
  assert.equal(ju.support(2_299_161n).certainty, 'CONVENTIONAL');
  const h = getAdapter('hebrew');
  assert.equal(h.support(347_997n).certainty, 'UNSUPPORTED');
  assert.equal(h.support(347_998n).certainty, 'CONVENTIONAL');
});

test('T-CAL-02 fromJdn at mathRange ± 1 returns Unsupported, never a date; support agrees', () => {
  for (const a of adapters) {
    const { minJdn, maxJdn } = a.mathRange;
    assert.ok(isUnsupported(a.fromJdn(minJdn - 1n)), `${a.id} below`);
    assert.ok(isUnsupported(a.fromJdn(maxJdn + 1n)), `${a.id} above`);
    assert.equal(a.support(minJdn - 1n).certainty, 'UNSUPPORTED');
    assert.equal(a.support(maxJdn + 1n).certainty, 'UNSUPPORTED');
    assert.ok(!isUnsupported(a.fromJdn(minJdn)), `${a.id} at min`);
    assert.ok(!isUnsupported(a.fromJdn(maxJdn)), `${a.id} at max`);
    assert.equal(a.toJdn(a.fromJdn(minJdn)), minJdn);
    assert.equal(a.toJdn(a.fromJdn(maxJdn)), maxJdn);
  }
});

test('REQ-CAL-01 a stub adapter satisfies the contract without touching the core', () => {
  const stub = assertAdapter({
    id: 'stub', name: 'Stub', variant: 'test', mathRange: { minJdn: 0n, maxJdn: 10n }, fields: [],
    fromJdn: (j) => (j < 0n || j > 10n ? unsupported('out') : { calendarId: 'stub', year: 0n, month: 1, day: Number(j) + 1 }),
    toJdn: (d) => BigInt(d.day - 1),
    support: () => support(Certainty.APPROXIMATE, 'stub', 'stub'),
    format: (d) => `day ${d.day}`,
    nextBoundary: () => unsupported('none'),
  });
  assert.equal(stub.toJdn(stub.fromJdn(3n)), 3n);
  assert.ok(isUnsupported(stub.fromJdn(11n)));
});
