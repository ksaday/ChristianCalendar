// Phase 4.3: export a seeded sample of Sabbath indices with v2's results, for independent recomputation
// by a separate program (scripts/independent-recompute.py). Usage: node scripts/export-sample.mjs > sample.json
import { sabbathJdn, dayOfWeek, cycleOf } from '../src/core/index.js';
import { gregorian } from '../src/calendars/gregorian.js';
import { julian } from '../src/calendars/julian.js';

let s = 0x1234567890ABCDEFn; const M = (1n << 64n) - 1n;
const next = () => { s ^= (s << 13n) & M; s ^= s >> 7n; s ^= (s << 17n) & M; return s; };
const rows = [];
// 50 indices within Python's datetime range (years 1–9999) plus 10 beyond it (Julian/Gregorian formula check only)
for (let i = 0; i < 50; i++) {
  const n = (next() % 520_000n) - 100_000n;   // roughly 1,900 BC … AD 10,000 → keep those in 1..9999 only
  const j = sabbathJdn(n);
  const g = gregorian.fromJdn(j);
  if (g.year < 1n || g.year > 9999n) { i--; continue; }
  const u = julian.fromJdn(j);
  rows.push({ n: n.toString(), jdn: j.toString(), dow: dayOfWeek(j), cycle: cycleOf(j).toString(),
    gregorian: [g.year.toString(), g.month, g.day], julian: [u.year.toString(), u.month, u.day] });
}
for (const n of [0n, -1n, -1000n, -247_599n, -289_099n, 103_992n, 104_017n, 10n ** 12n, -(10n ** 12n), 10n ** 30n]) {
  const j = sabbathJdn(n);
  rows.push({ n: n.toString(), jdn: j.toString(), dow: dayOfWeek(j), cycle: cycleOf(j).toString(), gregorian: null, julian: null });
}
console.log(JSON.stringify({ anchor: '1733205', rows }, null, 1));
