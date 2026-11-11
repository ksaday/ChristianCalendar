# Sabbath Calendar v2 — Phase 1: Chronology Core

This directory holds the second-generation Sabbath Calendar. The original application in the
repository root is the reference implementation and is never modified (design package:
`../docs/sabbath-calendar-v2/`, approved 2026-11-11).

## Phase 1 contents

```
v2/
├── src/core/
│   ├── bigint-math.js   toBigInt, floorDiv, floorMod (floor semantics for negatives)
│   ├── chronology.js    ANCHOR_JDN, sabbathJdn, sabbathIndexOf, cycleOf, dayOfWeek, prev/next, describeDay …
│   ├── invariants.js    verifyInvariants({seed, samples, magnitude}) — seeded, reproducible
│   └── index.js         public surface
├── test/                node:test suites (core, negative, invariants, regression vs baseline, property)
│   ├── fixtures/baseline-v1.js   verbatim copy of the original js/calendar.js math (test oracle)
│   └── browser/invariants.html   runs the same self-test in a browser for cross-engine comparison
└── scripts/check-core.mjs        core purity check (imports, forbidden identifiers, literals)
```

## Running

```bash
cd v2
npm install          # fast-check only (dev dependency for property tests)
npm run verify       # core purity check + baseline diff guard + all tests
```

No runtime dependencies. No network access is needed or used by any test.

## The contract

```
ANCHOR_JDN = 1733205           Sabbath #1 = Saturday, 4 April AD 33 (Julian)
SabbathJDN(n) = ANCHOR_JDN + 7 × (n − 1)     for every integer n (…, −1, 0, 1, 2, …)
Cycle n = [SabbathJDN(n) − 6, SabbathJDN(n)]  Sunday → Saturday, ending on Sabbath n
dayOfWeek(JDN) = floorMod(JDN, 7)            0 = Monday … 5 = Saturday, 6 = Sunday
```

All inputs may be `bigint`, safe-integer `number`, or decimal strings (optionally signed with
`-` or `−`, thousands separators tolerated). All outputs that are day counts or indices are `bigint`.
