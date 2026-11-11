# 03 — Software Requirements Specification

Conventions: **MUST** = mandatory for acceptance; **SHOULD** = expected unless an ADR records
an exception; **MAY** = optional. Each requirement has acceptance criteria (AC) and a
traceability row in `12-TEST-AND-VERIFICATION-PLAN.md` §8.

## 0. Axioms and compatibility (REQ-AX, REQ-COMPAT)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| REQ-AX-01 | Sabbath #1 **is** JDN 1,733,205 (Saturday, 4 April AD 33 Julian). Immutable. | Constant present in exactly one module; test T-CORE-01 |
| REQ-AX-02 | `SabbathJDN(n) = 1733205 + 7 × (n − 1)` for every integer `n`. | T-CORE-02..05 |
| REQ-AX-03 | Sabbath #0 exists and equals JDN 1,733,198. No renumbering of indices ≤ 0. | T-CORE-03 |
| REQ-COMPAT-01 | All behaviors COMPAT-01…15 (doc 02 §2) MUST hold in v2 wherever the equivalent feature exists. | T-REG-01..15 |
| REQ-COMPAT-02 | The original application files MUST NOT be modified by this project. | Git diff of `index.html`, `css/`, `js/` is empty |
| REQ-COMPAT-03 | v2's Gregorian conversion MUST agree with the original functions for every JDN in [−10^9, 10^9] (sampled) and for every day in years 33–3000 (exhaustive). | T-REG-20 |

## 1. Chronology Core (REQ-CORE)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| REQ-CORE-01 | The core MUST be a pure, deterministic, dependency-free module with no DOM, locale, timezone or clock access. | Static analysis: no `Date`, `Intl`, `window`, `document` references; runs in Node and browser |
| REQ-CORE-02 | All day counts and Sabbath indices MUST be arbitrary-precision integers (`BigInt`). | Type checks; T-CORE-10 with |n| = 10^30 |
| REQ-CORE-03 | Division and modulo MUST use mathematical floor semantics for negative operands; truncating semantics MUST NOT be relied upon. | T-CORE-11 (table of negative cases); code review checklist |
| REQ-CORE-04 | `sabbathJdn(n)` MUST compute directly in O(1), never by iteration. | T-CORE-12 timing: |n| = 10^18 in < 1 ms |
| REQ-CORE-05 | `sabbathIndexOf(jdn)` MUST return the index when `jdn` is a Sabbath and a typed "not a Sabbath" result otherwise, never a fraction. | T-CORE-04 |
| REQ-CORE-06 | Every JDN MUST map to exactly one cycle index via `cycleOf(jdn)`, under the convention of ADR-003 (cycle *n* = [SabbathJDN(n) − 6, SabbathJDN(n)]). | T-CORE-06 exhaustive over 10,000 consecutive days around each of several anchors |
| REQ-CORE-07 | `previousSabbath(jdn)` and `nextSabbath(jdn)` MUST be O(1) and MUST satisfy prev ≤ jdn ≤ next, next − prev ∈ {0, 7}. | T-CORE-07 |
| REQ-CORE-08 | `weeksBetween(n, m)` MUST equal m − n; `daysBetween(a, b)` MUST equal b − a, as BigInt. | T-CORE-08 |
| REQ-CORE-09 | Round trips MUST be exact: `sabbathIndexOf(sabbathJdn(n)) = n` for all tested n; `cycleOf(sabbathJdn(n)) = n`. | T-CORE-05, property test 10^5 random BigInt in ±10^40 |
| REQ-CORE-10 | Consecutive-cycle verification: `sabbathJdn(n+1) − sabbathJdn(n) = 7` MUST hold for all tested n, positive, zero and negative. | T-CORE-02 |
| REQ-CORE-11 | Day of week MUST be `floorMod(jdn, 7)` with 0 = Monday … 5 = Saturday, 6 = Sunday (baseline convention). | T-CORE-09 |
| REQ-CORE-12 | The core MUST expose an invariant self-test runnable at load time and in CI. | T-VER-01 |
| REQ-CORE-13 | The core MUST NOT contain any calendar, Creation date, sunset, or location logic. | Code review; module import graph |
| REQ-CORE-14 | Inputs that are not integers (fractions, NaN, non-numeric strings) MUST be rejected with a typed error, never coerced. | T-CORE-13 |

## 2. Calendar adapters (REQ-CAL)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| REQ-CAL-01 | Each calendar is an adapter implementing `fromJdn`, `toJdn`, `support`, `format` (doc 10) and registered without modifying the core. | Adding a stub adapter changes zero lines in `core/` |
| REQ-CAL-02 | Every adapter MUST declare a mathematical range, a historical range, variant, rule source, and known limits (doc 07 tables). | Documentation review; `support()` returns these |
| REQ-CAL-03 | Every converted date MUST carry a certainty: EXACT, CONVENTIONAL, APPROXIMATE, UNSUPPORTED. | T-CAL-01 |
| REQ-CAL-04 | An adapter MUST return UNSUPPORTED rather than any fabricated date outside its range. | T-CAL-02 per adapter at range ± 1 |
| REQ-CAL-05 | Gregorian adapter: proleptic, astronomical year numbering internally, BCE/CE labels in presentation; `BigInt` range at least ±10^9 years; round trip exact. | T-CAL-10..14 |
| REQ-CAL-06 | Julian adapter: proleptic Julian; identical range contract; the anchor MUST render as 4 April AD 33 in this row. | T-CAL-20..23 |
| REQ-CAL-07 | Gregorian and Julian rows MUST both render for every day; the 1582 reform MUST NOT alter the Sabbath cycle or day of week. | T-CAL-24 (4 Oct 1582 Thu → 15 Oct 1582 Fri) |
| REQ-CAL-08 | Hebrew adapter: fixed arithmetic calendar (Dershowitz–Reingold formulation); exact round trip across at least AM 1 – AM 10,000; certainty CONVENTIONAL before 1 Tishri AM 4683 (922 CE), EXACT-by-rule after; sunset caveat displayed. | T-CAL-30..36 |
| REQ-CAL-09 | Chinese adapter: modern rules; certainty EXACT-by-rule 1929–2100 (UTC+8 convention), APPROXIMATE 1645–1928 and 2101–2200, UNSUPPORTED before 1645 unless the historical-table adapter (Phase 5) is enabled. | T-CAL-40..46 |
| REQ-CAL-10 | Adapters MUST be cross-checked against at least one independent source each (doc 12 §5). | Reference-vector tests pass |
| REQ-CAL-11 | Adapters SHOULD be pure and dependency-free; `Intl`/Temporal MAY be used only for optional cross-checking, never as the source of truth. | Import graph |

## 3. Timeline user interface (REQ-UI)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| REQ-UI-01 | A synchronized multi-row timeline with rows: Sabbath (primary), Julian, Gregorian, Hebrew, Chinese, plus a marker row. All rows derive from one cursor JDN. | Manual + automated DOM test: cursor move updates every row |
| REQ-UI-02 | A central cursor showing the current JDN, Sabbath index, cycle, and every calendar's date with certainty badge. | Visual test |
| REQ-UI-03 | Continuous backward and forward navigation with no lower or upper bound other than input length limits. | Jump to #−10^12 and #10^12 succeeds |
| REQ-UI-04 | Direct jump by Sabbath number (signed integer of arbitrary length). | T-UI-01 |
| REQ-UI-05 | Lookup by civil date in any supported calendar, including BCE years. | T-UI-02 |
| REQ-UI-06 | A seven-day cycle detail view for the cursor's cycle, Sunday→Saturday, with the Sabbath as the seventh day. | Visual test |
| REQ-UI-07 | Horizontal scroll and a zoom ladder (day, week, year, decade, century, millennium, 10^k years). | T-UI-03 |
| REQ-UI-08 | Rendering MUST be O(visible ticks), never O(distance travelled); no intervening Sabbaths loaded when jumping. | Performance test: jump of 10^12 cycles < 50 ms render |
| REQ-UI-09 | Negative indices and BCE years MUST be displayed unambiguously (U+2212 minus; "BC"/"BCE" labels; astronomical year shown on hover). | Visual test |
| REQ-UI-10 | Reference markers: Sabbath #1, Sabbath #0, 1582 reform, 1 CE/1 BCE boundary, JDN 0, today. | Visual test |
| REQ-UI-11 | Certainty labels on every date: exact / conventional / approximate / unsupported, with legend. | Visual test |
| REQ-UI-12 | Responsive layout: desktop (rows stacked, wide), mobile (rows stacked, swipe to pan, pinch to zoom, cursor card). | Viewports 375 px and 1280 px |
| REQ-UI-13 | Keyboard: arrows pan one unit at the current zoom; Shift+arrows one Sabbath; Home = #1; T = today; G = go-to dialog. | T-UI-04 |
| REQ-UI-14 | Accessibility: every row has an ARIA label; cursor card is a live region; color is never the only encoding. | axe-core clean |
| REQ-UI-15 | Anniversary and milestone Sabbaths SHOULD be marked in the Sabbath row as in the baseline. | Visual test |
| REQ-UI-16 | URL state: the cursor JDN and zoom SHOULD be in the URL hash so any view is linkable. | T-UI-05 |

## 4. Verification (REQ-VER)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| REQ-VER-01 | Invariants I1–I6 (doc 04 §6) MUST be tested for positive, zero and negative indices including |n| ≥ 10^30. | Suite passes |
| REQ-VER-02 | Baseline regression examples MUST pass unchanged. | T-REG-* |
| REQ-VER-03 | Property-based tests MUST run for the core and each adapter's round trip. | ≥ 10^4 cases each, seeded, reproducible |
| REQ-VER-04 | Independent reference vectors MUST be checked in per adapter with their source URL and retrieval date. | Files present under `v2/test/vectors/` |
| REQ-VER-05 | The test suite MUST run with zero network access. | CI job has no network |
| REQ-VER-06 | A distinction between mathematical correctness and historical validity MUST be tested: a date inside the math range but outside the historical range returns CONVENTIONAL/APPROXIMATE, not EXACT. | T-CAL-01, T-CAL-02 per adapter |

## 5. Genesis research track (REQ-GEN)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| REQ-GEN-01 | No Creation date, boundary, or minimum index MUST exist in the core or adapters. | grep for creation constants in `core/` returns nothing |
| REQ-GEN-02 | An optional Tradition Markers module MAY display named traditions' Creation dates as **[INTERPRETATION]** markers, off by default, each with its source. | Only after approval item A7 |
| REQ-GEN-03 | Marker text MUST state that the position is a mathematical projection of the cycle, not evidence of observance. | Copy review |

## 6. Non-functional (REQ-NF)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| REQ-NF-01 | Zero runtime dependencies; dev dependencies limited to a test runner and optional property-testing library. | `package.json` review |
| REQ-NF-02 | Static hosting only (GitHub Pages or any file host); works from `file://`. | Manual check |
| REQ-NF-03 | No network calls at runtime. | Network panel empty |
| REQ-NF-04 | Open-source license compatible with the repository; all algorithm sources cited. | License review |
| REQ-NF-05 | Deterministic: same input → same output regardless of browser locale or timezone. | T-NF-01 run under three TZ settings |
| REQ-NF-06 | Browser support: current Chrome, Firefox, Safari, Edge; `BigInt` required (available in all since 2020). | Manual matrix |
| REQ-NF-07 | Initial load under 200 KB uncompressed excluding optional Chinese ephemeris tables. | Build size check |
