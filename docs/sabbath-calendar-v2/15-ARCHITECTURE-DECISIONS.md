# 15 — Architecture Decision Records

Format: Context · Decision · Consequences · Status. **All fourteen ADRs: Accepted 2026-11-11** (owner took every recommended default in doc 16).

## ADR-001 Keep the original app untouched; build v2 beside it around a shared core
**Context.** Rule 15 forbids altering the existing application; the baseline is the regression oracle; the new UI is a timeline, not a month grid.
**Decision.** Option C (doc 09 §1): `v2/` directory in the same repository; `core/` is pure and oracle-tested; original files byte-identical, enforced in CI.
**Consequences.** Two apps on one static host; some duplicated math (by design, as oracle vs implementation); zero regression risk to the baseline.

## ADR-002 BigInt for all day counts and indices; floor-division helpers
**Context.** `Number` is exact only to 2^53; the brief requires no numeric ceiling; JS `/` and `%` truncate toward zero.
**Decision.** `BigInt` throughout the core and adapters' integer paths; `floorDiv`/`floorMod` are the only division/modulo allowed on signed values; `Number` only at display when `isSafeInteger`.
**Consequences.** Slightly more verbose code (`n` suffixes); no precision bugs; ES2020 baseline (acceptable).

## ADR-003 Cycle convention: Sunday→Saturday, numbered by the Sabbath that ends it
**Context.** Every day needs exactly one cycle; the baseline has no rule; Genesis counts the seventh day as the end of the week.
**Decision.** `cycleOf(j) = floorDiv(j − A + 6, 7) + 1`; cycle n = [sabbathJdn(n) − 6, sabbathJdn(n)].
**Alternative kept documented.** Saturday→Friday (`floorDiv(j − A, 7) + 1`), one-line change.
**Consequences.** The number shown during the week equals the number of the coming Saturday; the baseline's "Next: Sabbath #N" countdown is consistent with it.

## ADR-004 Civil-day indexing in the core; religious sunset boundary as an optional layer
**Context.** The religious Sabbath runs Friday sunset to Saturday sunset and depends on location and date; the numbering must be location-free and deterministic.
**Decision.** Core and adapters work on whole JDN civil days. A Phase 5 layer may compute local sunset windows and display them as an "observance window" without altering indices. The baseline's "begins at sunset on Friday" sentence is retained as text.
**Consequences.** Determinism; no geolocation; a clearly separated extension.

## ADR-005 Hebrew adapter = fixed arithmetic calendar with certainty bands
**Context.** Only the calculated calendar is reconstructable by rule; observational-era dates are not.
**Decision.** Implement Dershowitz–Reingold's fixed calendar in BigInt; EXACT from 922 CE, CONVENTIONAL earlier, UNSUPPORTED below AM 1 and above AM 10,000; sunset caveat in the row legend.
**Consequences.** Honest labels; the anchor's Hebrew date is shown as calculated, not asserted.

## ADR-006 Chinese adapter = modern astronomical rules; UNSUPPORTED before 1645 in MVP
**Context.** Over a hundred historical Chinese calendar reforms; ICU/Intl are not historical authorities; reconstructions exist but carry licensing and uncertainty.
**Decision.** In-house D&R astronomical algorithm, UTC+8 (Beijing LMT before 1929), EXACT 1929–2100, APPROXIMATE 1645–1928 and 2101–2200, UNSUPPORTED otherwise; optional table-driven historical adapter in Phase 5 after a rights check.
**Consequences.** No fabricated dynastic dates; Chinese row is blank for the anchor era, which the UI explains.

## ADR-007 No framework; ES modules; SVG rendering; static hosting
**Context.** Rules 12–13; the baseline is plain HTML/CSS/JS; the visible tick count is small.
**Decision.** Vanilla ES modules without a build step; SVG rows; GitHub Pages or any static host; works from `file://`.
**Consequences.** Zero runtime dependencies; no bundler; code remains readable to the owner.

## ADR-008 Testing: `node:test` + seeded property tests + checked-in reference vectors
**Context.** Rule 16 and REQ-VER; no network in CI.
**Decision.** Built-in runner; `fast-check` as the only optional dev dependency (or an in-repo generator); vectors stored with URL and retrieval date; cross-engine runs.
**Consequences.** Reproducible; offline; provenance for every external number.

## ADR-009 Temporal and Intl are cross-checks, never sources of truth
**Context.** Temporal is not in stable Safari (late 2026); ICU calendars vary by engine and version and lack historical fidelity; neither supports BigInt.
**Decision.** Optional, skipped-when-absent comparison tests only.
**Consequences.** Determinism across browsers; one more set of tests to maintain.

## ADR-010 No Creation boundary in the engine; optional Tradition Markers
**Context.** Doc 08: no defensible absolute JDN; traditions differ by ~1,800 years.
**Decision.** Unbounded model; a separate, off-by-default markers module with INTERPRETATION labeling, built only after approval.
**Consequences.** Immutability of the anchor is not diluted by a second, weaker "axiom"; theological interest is served without false precision.

## ADR-011 Timeline coordinates in BigInt days; O(visible) tick planning via adapter `nextBoundary`
**Context.** Jumps of 10^12 cycles must not scan; calendar boundaries must be found arithmetically.
**Decision.** Viewport = [start, end] BigInt; pixel offsets from `(jdn − start)` converted to `Number` only within the viewport; every adapter exposes `nextBoundary(j, unit)`.
**Consequences.** Constant-time navigation; adapters carry one extra method.

## ADR-012 Day-of-week convention retained from the baseline
**Context.** Baseline: `JDN mod 7`, 0 = Monday … 5 = Saturday, 6 = Sunday; many references use `(JDN + 1) mod 7` with 0 = Sunday.
**Decision.** Keep the baseline convention in the core; provide `positionInCycle` (Sun = 1 … Sat = 7) for display.
**Consequences.** Regression tests compare directly; the Sunday-based form is a test oracle.

## ADR-013 Astronomical year numbering internally; era labels at presentation
**Context.** No historical year 0; conversion algorithms assume astronomical years.
**Decision.** Year 0 = 1 BC internally; `format` renders eras; "0" never printed.
**Consequences.** Clean arithmetic; one well-tested formatting rule.

## ADR-014 Certainty taxonomy is a fixed four-value enum (plus INTERPRETATION for markers only)
**Context.** Users must distinguish exact, conventional, approximate and unsupported labels at a glance.
**Decision.** Enum defined in `calendars/adapter.js`; every date carries one; markers may carry INTERPRETATION; UI legend fixed.
**Consequences.** Consistent vocabulary across docs, code and UI.

## ADR-015 Bible events and eclipses live in a separate markers layer; the events row is on by default
**Context.** On 2026-11-12 the owner approved Phase 5.2 (Tradition Markers) and 5.6 (eclipse rows) and asked for "dates or years from the Bible on the calendar, major ones like Adam, Noah, Moses", estimates included. A7/ADR-010 had made tradition markers off by default and placed them under `calendars/markers/`.
**Decision.** A new layer `src/markers/` holds four named chronological systems (Ussher, Seder Olam, early-date conservative, critical/historical), 52 events with a sourced dating per system, the Genesis 5/11 arithmetic, the NASA Five Millennium Canon reader, and 35 recorded eclipses. It may import core and calendars; `check-core` forbids nothing else from importing it and still bans Creation dates from core, calendars and timeline. Event positions are year bands or claimed days, certainty `INTERPRETATION` unless an external record fixes the day. The Bible events row is on by default, with the tradition styling, badge and tooltip disclaimer unchanged. Eclipse days are UT civil days with ΔT and its uncertainty shown. Design and results: doc 17.
**Consequences.** The engine is unchanged and every displayed event or eclipse can be deleted with its layer. The owner's request reverses the A7 default for presentation only; no event feeds the Sabbath count. The canon data adds about 1 MB, loaded only when an eclipse row is on.

## ADR-016 Civil date by region is a separate adapter; the Julian and Gregorian rows stay proleptic
**Context.** Roadmap 5.4 and 5.7, approved 2026-11-13. A region's switch to the Gregorian calendar, England's 25 March legal year, the Swedish calendar of 1700–1712 and the irregular Roman leap years of 45 BC – AD 8 change how a day was *written*, not which day it was.
**Decision.** `calendars/civil.js` builds an adapter per (region, reconstruction) that follows the existing adapter contract and is drawn as a "Civil date" row under the Gregorian row. The Julian and Gregorian adapters, their certainty rules and their tests are unchanged. Default region Rome; default reconstruction Bennett (2003), chosen as the most recent, not as a consensus. Design and tests: doc 18.
**Consequences.** Labels can skip (3–13 September 1752 in Britain) or repeat a number (24 February bis, 30 February 1712), but every JDN keeps exactly one civil label and the seven-day cycle is untouched. Date-line changes (Philippines 1844, Alaska 1867) are out of scope and recorded in doc 14.
