# 14 — Risks and Limitations

## 1. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Sign/floor errors in negative arithmetic | Medium (classic bug) | High (wrong cycles before AD 33) | Two helpers only; review checklist; T-CORE-11; property tests in negative ranges |
| R-02 | `Number`/`BigInt` mixing (TypeError or silent precision loss) | Medium | High | BigInt-only core; `tsc --checkJs`; input normalization; tests at 10^30 |
| R-03 | Adapter presents a calculated date as historical | Medium | High (credibility) | Certainty enum mandatory; REQ-VER-06 tests; badges always visible |
| R-04 | Chinese adapter one-day/one-month errors near midnight new moons or from ΔT | Medium for pre-1929 | Medium | APPROXIMATE downgrade; HKO vectors for 1901–2100; UNSUPPORTED before 1645 |
| R-05 | Hebrew observational-era dates misunderstood as observed | Medium | Medium | CONVENTIONAL badge with explicit reason text |
| R-06 | Timeline rendering scans days (O(distance)) | Low if designed as specified | High (hangs at large jumps) | `nextBoundary` arithmetic; tick budget tests T-UI-03 |
| R-07 | Browser lacks `BigInt` | Very low (all evergreen browsers since 2020) | High | Feature check with a clear message; no polyfill |
| R-08 | Temporal/Intl differences across engines used as truth | — | — | Cross-check only; skipped, not failed, when absent |
| R-09 | Reference-vector licensing (HKO tables, Academia Sinica, Liu reconstructions) | Medium | Medium | Store only derived test vectors with citation for HKO; defer table adapters pending rights check |
| R-10 | Scope creep into eclipse/history rows before core is solid | Medium | Medium | Phase 5 gating; approval per extension |
| R-11 | Owner expectation that a Creation date "should" be computable | Medium | Medium | Doc 08 states limits; Tradition Markers provide a labeled outlet |
| R-12 | Accidental edit of original files | Low | High (rule 15) | CI diff guard; separate `v2/` directory |
| R-13 | Memory exhaustion from absurd inputs (10^6-digit index) | Low | Low | UI caps input length (40 digits); core documents the machine limit |
| R-14 | Anniversary rule divergence when ported | Low | Medium | T-REG-04 exhaustive 33–3000 |

## 2. Stated limitations (to be repeated in the application's About panel)

1. **Sabbath numbers are exact within the model**: an unbroken seven-day cycle anchored at
   JDN 1,733,205. Numbers before #1 are projections; the model makes no claim about observance.
2. **Calendar dates have their own certainty.** Proleptic Gregorian and Julian dates before
   those calendars existed are conventions. Calculated Hebrew dates before the tenth century
   CE may differ from what was observed. Chinese dates before 1645 are not provided in this
   version.
3. **Day boundaries are civil (midnight-to-midnight) JDN days.** Hebrew days begin at sunset;
   the religious Sabbath begins Friday evening; neither is computed by location in the MVP.
4. **Regional calendar adoption is not modeled.** The Gregorian row is EXACT from 15 Oct 1582
   as the Roman reform; many countries switched later.
5. **Far-future and far-past labels.** Beyond ±10^9 years the calendar rows show UNSUPPORTED
   even though the Sabbath index remains exact; year labels there would be arithmetic without
   meaning (precession, Earth's rotation changes, ΔT).
6. **Finite machine.** The sequence is unbounded; the computer is not. Inputs are capped at 40
   digits in the UI; the core will compute larger values until memory runs out.
7. **No historical year zero.** 1 BC is followed by AD 1; internally year 0 = 1 BC.
8. **Not a liturgical calendar.** Feasts, fasts, and movable observances are out of scope.

- **Bible-event dates are traditions or estimates.** Each of the four systems is shown with its
  source; the critical/historical system dates nothing before the monarchy and only brackets the
  Exodus. Derived figures (for example Seder Olam's Moses, AM 2368) are arithmetic on a cited
  anchor and a cited interval, and say so. None feeds the Sabbath count (doc 17, ADR-015).
- **Eclipse days are UT days.** A local date east of Greenwich can be one day later; before about
  500 BC the ΔT uncertainty (σ ≈ 10 min at 1000 BC, ≈ 1 h at 2000 BC) can move an eclipse across
  midnight, and the tooltip flags it. Eclipses are listed only for 1999 BC – AD 3000.

- **Civil dates are per region and per reconstruction.** Before AD 4/8 the Roman date depends on
  which scholar's leap years are used (up to two days apart); the civil row says which. Regions that
  switched in several stages, the Ottoman Rumi calendar and the date each region first used the
  Julian calendar are not modeled (doc 18 §4).
- **Date-line changes are not modeled.** The Philippines skipped 31 December 1844 and Alaska repeated
  a Friday in October 1867 when they moved across the date line. Local weekday names changed there;
  the Greenwich-referenced day count, and with it the seven-day cycle, did not.

## 3. Known unknowns (recorded, not blocking)

| Topic | Status | Default |
|---|---|---|
| Exact JDN for the Julian calendar's institution (1 Jan 45 BC) and the 45 BC–AD 8 leap pattern | Scholarly reconstructions differ (Scaliger, Bennett) | Treat 45 BC–AD 8 as regular proleptic Julian, CONVENTIONAL; optional APPROXIMATE reconstruction in Phase 5.7 |
| Precise date the fixed Hebrew calendar reached its modern form | Traditionally 359 CE; documented 921/2 CE | EXACT from 922 CE; CONVENTIONAL earlier |
| Pre-1929 Chinese reference meridian handling | Beijing local mean time vs UTC+8; the HKO tables resolve 1906, 1914, 1916, 1920 borderline new moons inconsistently between the two | Compute with 116°25′E before 1929; label APPROXIMATE; margin rule flags each case |
| Solar-term timing resolution | Meeus low-accuracy solar series ≈ 0.01° ≈ 15 min; 18 of 4,800 HKO solar-term days (1901–2100) differ by one day, all within 15 min of midnight | Leap-month assignment is flagged APPROXIMATE when a major term is within 30 min of a month-boundary midnight; a higher-order solar series is a Phase 5 option |
| Safari Temporal support | Not stable as of late 2026 (web search) | Temporal not used at runtime |
| Firefox / SpiderMonkey | Not available on the development machine; core digest verified in V8 and JavaScriptCore only | `scripts/cross-engine.sh` picks Firefox up automatically when installed; CI could add a Firefox job later |
| Browser harness in CI | Resolved 2026-11-13: `npm run check:browser` runs `ui-smoke.html` and `a11y.html` in real-time headless Chrome; the stall came from virtual time | In CI from Phase 5 on |
- Ussher's paragraph numbers and headings come from the 1658 English text as transcribed on
  archive.org (OCR); the AM/JP/BC triples were read from it and cross-checked against Wikipedia and
  the Associates for Biblical Research summary, but not against a printed copy.
- Sub-modules are fetched without a version query, so a browser with a heuristic HTTP cache can run
  a stale module for a while after an update (seen on the local Python server; GitHub Pages sends
  `max-age=600`). Not a correctness risk for the core, which the integrity panel self-tests.
