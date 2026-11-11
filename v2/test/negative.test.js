// Worked table from doc 05 §2 and the three "negatives" of §3.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sabbathJdn, sabbathIndexOf, dayOfWeek, cycleOf, isSabbath } from '../src/core/index.js';
import { jdnFromGregorian, gregFromJdn } from './fixtures/baseline-v1.js';

const rows = [
  [3n, 1_733_219n], [2n, 1_733_212n], [1n, 1_733_205n], [0n, 1_733_198n], [-1n, 1_733_191n],
  [-2n, 1_733_184n], [-12n, 1_733_114n], [-13n, 1_733_107n], [-1000n, 1_726_198n],
  [-100_000n, 1_033_198n], [-247_599n, 5n], [-289_099n, -290_495n],
];

test('doc 05 §2 table: index ↔ JDN, all Saturdays', () => {
  for (const [n, j] of rows) {
    assert.equal(sabbathJdn(n), j, `#${n}`);
    assert.equal(sabbathIndexOf(j), n, `jdn ${j}`);
    assert.equal(dayOfWeek(j), 5, `jdn ${j}`);
    assert.equal(cycleOf(j), n);
  }
});

test('doc 05 §2 proleptic Gregorian labels of selected rows (via the baseline oracle)', () => {
  const g = (j) => gregFromJdn(Number(j));
  assert.deepEqual(g(1_733_198n), { year: 33, month: 3, day: 26 });   // Sabbath #0
  assert.deepEqual(g(1_733_191n), { year: 33, month: 3, day: 19 });   // #−1
  assert.deepEqual(g(1_733_114n), { year: 33, month: 1, day: 1 });    // #−12
  assert.deepEqual(g(1_726_198n), { year: 14, month: 1, day: 25 });   // #−1000
  assert.deepEqual(g(5n), { year: -4713, month: 11, day: 29 });       // #−247,599 (4714 BC)
  assert.deepEqual(g(-290_495n), { year: -5508, month: 7, day: 19 }); // #−289,099 (5509 BC)
});

test('negative JDN, negative index and BCE astronomical year are three different signs', () => {
  const j = -290_495n;                       // negative JDN
  assert.ok(isSabbath(j));
  assert.equal(sabbathIndexOf(j), -289_099n); // negative index
  assert.equal(gregFromJdn(Number(j)).year, -5508); // astronomical year −5508 = 5509 BC
  assert.equal(jdnFromGregorian(-5508, 7, 19), -290_495);
});

test('Sabbath #0 is not skipped: #1 → #0 → #−1 are each 7 days apart', () => {
  assert.equal(sabbathJdn(1n) - sabbathJdn(0n), 7n);
  assert.equal(sabbathJdn(0n) - sabbathJdn(-1n), 7n);
});
