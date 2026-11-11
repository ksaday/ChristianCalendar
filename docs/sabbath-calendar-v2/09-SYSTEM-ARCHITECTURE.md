# 09 — System Architecture

## 1. Options considered

| Criterion | A. Extend `js/calendar.js` directly | B. Refactor original into modules used by both | C. Keep original as reference; build v2 separately around a shared core |
|---|---|---|---|
| Compatibility with baseline | High risk: every edit touches validated code | Medium: refactor can regress subtly; original "as shipped" disappears | **Highest: original byte-identical; v2 tested against it** |
| Mathematical correctness | Constrained by `Number`, IIFE, DOM coupling | Good once refactored | **Best: BigInt core designed clean, oracle-tested** |
| Code reuse | Maximal, but by accretion | High | High for math (ported, oracle-tested); medium for CSS tokens; UI is new anyway (timeline ≠ month grid) |
| Complexity | Grows into one large file | Two apps + shared modules; build or module loader needed for v1 | v2 is modular; v1 untouched; no build step required (ES modules) |
| Maintainability | Low | Medium–High | **High** |
| Testing | Hard (DOM-bound) | Good | **Best: core is pure; tests in Node** |
| Performance | Fine | Fine | Fine; timeline rendering is the only hot path and is isolated |
| Deployment | Same static host | Same | Same static host; `v2/` is a sibling directory, `index.html` unchanged |
| Long-term cost | High (monolith) | Medium | **Low** |
| Owner's rule 15 ("do not alter the existing application") | Violates | Violates | **Satisfies** |

**Recommendation: Option C** (ADR-001). The original remains the reference application and
the regression oracle. v2 lives in `v2/` within the same repository, so one GitHub Pages
deployment serves both (`/` and `/v2/`). The original README gains, at most, one line
pointing to v2 — and only with approval.

## 2. Proposed repository layout (no files created in this phase)

```
ChristianCalendar/
├── index.html, css/, js/, README.md        ← untouched reference app
├── docs/sabbath-calendar-v2/               ← this package
└── v2/
    ├── index.html                          ← timeline app shell (no build step)
    ├── src/
    │   ├── core/
    │   │   ├── bigint-math.js              floorDiv, floorMod, parseIntegerInput
    │   │   ├── chronology.js               ANCHOR_JDN, sabbathJdn, sabbathIndexOf, cycleOf, …
    │   │   └── invariants.js               verifyInvariants(seed, samples)
    │   ├── calendars/
    │   │   ├── adapter.js                  contract, Certainty enum, Unsupported
    │   │   ├── registry.js                 ordered list of adapters
    │   │   ├── gregorian.js                proleptic Gregorian (BigInt)
    │   │   ├── julian.js                   proleptic Julian (BigInt)
    │   │   ├── hebrew.js                   fixed arithmetic Hebrew (BigInt)
    │   │   ├── chinese/                    Phase 2b: astronomy.js, chinese.js
    │   │   └── markers/                    Phase 5: traditions.json, eclipses/
    │   ├── timeline/
    │   │   ├── cursor.js                   cursor JDN, derived DayDescriptor + per-calendar dates
    │   │   ├── zoom.js                     zoom ladder, unit ↔ pixels, tick planning
    │   │   ├── ticks.js                    O(visible) tick generation per row
    │   │   ├── sabbath-row-rules.js        anniversary, milestone (ported from baseline)
    │   │   └── url-state.js                hash ⇄ {jdn, zoom}
    │   ├── ui/
    │   │   ├── app.js                      wiring, event handling, keyboard
    │   │   ├── render-rows.js              SVG/Canvas row painter
    │   │   ├── cursor-card.js              detail panel
    │   │   ├── lookup.js                   go-to dialogs (index, JDN, civil date per calendar)
    │   │   ├── cycle-view.js               seven-day detail
    │   │   └── format.js                   fmt (separators, U+2212), ord, era labels
    │   └── styles/
    │       └── v2.css                      reuses baseline :root tokens
    └── test/
        ├── core.test.js, negative.test.js, invariants.test.js
        ├── regression-v1.test.js           imports a verbatim copy of baseline functions as fixture
        ├── gregorian.test.js, julian.test.js, hebrew.test.js, chinese.test.js
        ├── property/                       seeded property tests
        └── vectors/                        reference vectors with source + retrieval date
```

Dependency direction (enforced by review and an import-graph check):
`core ← calendars ← timeline ← ui`. Nothing imports `ui`; `core` imports nothing.

## 3. Runtime and tooling

| Concern | Choice | Rationale |
|---|---|---|
| Language | Plain JavaScript ES2020+ modules with JSDoc types | No build step, no framework; `BigInt` is ES2020 |
| Type checking | `tsc --checkJs` in CI over JSDoc (optional, zero runtime impact) | Catches `Number`/`BigInt` mixing at review time |
| Test runner | Node's built-in `node:test` | Zero dependencies |
| Property testing | `fast-check` as a *dev* dependency, or a 60-line in-repo generator if the owner prefers zero npm | Reproducible seeds |
| Rendering | SVG for rows and ticks (crisp text, accessible), Canvas fallback only if profiling demands it | Visible ticks are at most a few hundred per row |
| Hosting | GitHub Pages / any static host; works from `file://` | Matches baseline |
| CI | GitHub Actions running `node --test` with network disabled | Deterministic |
| Dependencies at runtime | **none** | Owner's rule 12 |

## 4. Data flow

```
user action (pan/zoom/jump/lookup)
      │
      ▼
 timeline/cursor.js  ──  cursorJdn: bigint, zoom: level
      │
      ├─► core.describeDay(cursorJdn)                → DayDescriptor (exact)
      ├─► for each adapter: fromJdn(cursorJdn)       → CalendarDate | Unsupported, + support()
      ├─► timeline/ticks.js(viewport, zoom)          → ticks per row (O(visible))
      └─► url-state.js                                → location.hash
      │
      ▼
 ui/render-rows.js, ui/cursor-card.js, ui/cycle-view.js
```

There is exactly one mutable state object: `{cursorJdn, zoom, enabledRows, options}`.
Rows are pure functions of it.

## 5. Rendering very large distances

- Coordinates are `BigInt` days; the viewport is `[cursorJdn − halfWidthDays, cursorJdn + halfWidthDays]`
  where `halfWidthDays` depends on zoom. Pixels are computed from `(jdn − viewportStart)` which
  is a small `BigInt` convertible to `Number` safely at any zoom (the viewport never spans more
  than ~10^6 tick units).
- Tick planning per row: Sabbath row ticks every 7 days at day/week zoom, every 52nd Sabbath
  at year zoom, every 1,000th at millennium zoom, etc.; labels thin out with a minimum pixel
  spacing. Calendar rows ask their adapter for the *next boundary* (month/year start) from a
  JDN — adapters expose `nextBoundary(jdn, unit)` so that ticks are found by arithmetic, not
  by scanning days.
- Jumping from #104,017 to #−10^12 is a cursor assignment; nothing in between is computed.

## 6. Security and privacy

No network, no storage except the URL hash (and optionally `localStorage` for row
preferences), no analytics.

## 7. Requirements realized here

REQ-COMPAT-02, REQ-CORE-01, REQ-CAL-01, REQ-UI-08, REQ-NF-01…07.
