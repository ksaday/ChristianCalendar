# Sabbath Calendar v2

This directory holds the second-generation Sabbath Calendar. The original application in the
repository root is the reference implementation and is never modified (design package:
`../docs/sabbath-calendar-v2/`, approved 2026-11-11).

Open `index.html` (served over HTTP or from a static host; ES modules need a server for `file://` in some browsers). Phases 1–4 of the roadmap are implemented; see `test/reports/phase4-verification.md`.

## Contents

```
v2/
├── index.html                    the synchronized timeline application
├── src/core/                     Chronology Core (BigInt): bigint-math, chronology, invariants
├── src/calendars/                adapters: gregorian, julian, hebrew, chinese/ (astronomy + rules), registry
├── src/timeline/                 pure timeline model: zoom ladder, O(visible) ticks, cursor, URL state, Sabbath-row rules
├── src/ui/                       DOM: app wiring, SVG rows, cursor card, cycle view, go-to dialog, format
├── src/styles/v2.css             stylesheet (baseline palette)
├── test/                         node:test suites, reference vectors with provenance, browser self-test page
├── scripts/check-core.mjs        layer/purity check (imports, forbidden identifiers, literals)
├── scripts/cross-engine.sh       core invariant digest in every JS engine on the machine (Node, jsc, Chrome, Firefox)
├── scripts/export-sample.mjs + scripts/independent-recompute.py   Phase 4 independent recomputation (Python, no v2 code)
└── test/browser/                 invariants.html (cross-engine), ui-smoke.html (T-UI checks), a11y.html (axe-core)
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
