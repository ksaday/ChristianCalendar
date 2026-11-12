# 12 — Test and Verification Plan

## 1. Strategy

Four layers, all runnable offline with `node --test`:

1. **Invariant tests** on the core (theorems I1–I7 checked at fixed and random points).
2. **Oracle regression tests** against the original `js/calendar.js` functions (copied
   verbatim into a test fixture with a provenance comment) across the baseline's range and
   beyond, wherever `Number` is exact.
3. **Property tests** (seeded, reproducible) for round trips in the core and every adapter.
4. **Reference-vector tests** against independently published values, checked in with source
   URL and retrieval date.

Plus a browser-level smoke suite for the UI and an integrity panel at runtime.

## 2. Core tests (T-CORE)

| ID | Test | Expected |
|---|---|---|
| T-CORE-01 | `sabbathJdn(1n)` | `1733205n` |
| T-CORE-02 | for n in {−10^30, −10^6, −1000, −1, 0, 1, 2, 103992, 10^6, 10^30}: `sabbathJdn(n+1) − sabbathJdn(n)` | `7n` |
| T-CORE-03 | `sabbathJdn(0n)`, `sabbathJdn(−1n)`, `sabbathJdn(−1000n)` | `1733198n`, `1733191n`, `1726198n` |
| T-CORE-04 | `sabbathIndexOf(j)` for j = anchor±{0,1,…,6} | index at 0; `NotASabbath` carrying cycle/prev/next otherwise |
| T-CORE-05 | round trip `sabbathIndexOf(sabbathJdn(n)) = n` for the T-CORE-02 set | pass |
| T-CORE-06 | `cycleOf` exhaustive over [A−7000, A+7000] and around JDN 0 and JDN −290,495 | increases by 1 exactly every 7 days; `cycleOf(sabbathJdn(n)) = n`; cycle bounds [sab−6, sab] |
| T-CORE-07 | `previousSabbath`/`nextSabbath` for 10^4 random j in ±10^20 | prev ≤ j ≤ next; next−prev ∈ {0,7}; both Sabbaths |
| T-CORE-08 | `weeksBetween(n,m)`, `daysBetween(a,b)` | m−n, b−a as BigInt |
| T-CORE-09 | `dayOfWeek` for JDN 0, 5, 1733205, 2299160, 2299161, 2451545, 2461142 | Mon, Sat, Sat, Thu, Fri, Sat, Sat |
| T-CORE-10 | magnitudes 10^30, 10^100 | exact results; no exception |
| T-CORE-11 | negative-operand table: floorDiv(−15,7)=−3, floorMod(−15,7)=6, floorMod(−290495,7)=5, cycleOf(A−7)=0, cycleOf(A−13)=0, cycleOf(A−14)=−1 | pass |
| T-CORE-12 | timing: `sabbathJdn(10n**18n)` ×10^5 calls | < 1 ms per call average |
| T-CORE-13 | inputs 1.5, NaN, "12a", "", null, 2^53 (as Number) | `ChronologyInputError` |
| T-CORE-14 | `verifyInvariants({seed: 1, samples: 10000})` | report.allPassed === true; identical report for identical seed |
| T-VER-01 | the same `verifyInvariants` run in CI and at page load (integrity panel, COMPAT-15) | identical report in Node, Chrome, Firefox, Safari |

## 3. Baseline regression tests (T-REG)

| ID | Baseline behavior (COMPAT-xx) | Test |
|---|---|---|
| T-REG-01 | COMPAT-05 | Gregorian 2026-04-11 → JDN 2,461,142 → Sabbath #103,992 |
| T-REG-02 | COMPAT-01/02 | anchor → #1; `isSabbath(anchor)` |
| T-REG-03 | COMPAT-06 | Gregorian adapter: 1733205 → {33, 4, 2}; Julian adapter: → {33, 4, 4} |
| T-REG-04 | COMPAT-07 | anniversary(j) for every year 33…3000: equals baseline `annivInfo` |
| T-REG-05 | COMPAT-08 | milestone(n) for n in {0, 999, 1000, 1001, 103000, −1000} → F,F,T,F,T,F |
| T-REG-06 | COMPAT-09 | January AD 33 Saturdays → #−12…#−8; Sabbath #0 on 26 Mar AD 33 (Greg.) |
| T-REG-07 | COMPAT-12 | fmtInt(−1234567n) = "−1,234,567" (U+2212) |
| T-REG-08 | COMPAT-03/11 | `dayOfWeek` equals baseline `dow` for 10^6 random safe JDNs incl. negatives |
| T-REG-09 | concept drawing | 2026-10-03 → #104,017 |
| T-REG-20 | COMPAT-04 | v2 Gregorian adapter equals baseline `jdnFromGregorian`/`gregFromJdn` for every day in years 33–3000 (exhaustive, ~1.08 M days) and for 10^6 random JDNs in ±10^9 |

## 4. Calendar adapter tests (T-CAL)

| ID | Adapter | Test |
|---|---|---|
| T-CAL-01 | all | `support(j).certainty` ∈ the enum for j in a sweep; EXACT/CONV/APPROX/UNSUPP boundaries at the declared JDNs ± 1 |
| T-CAL-02 | all | `fromJdn` at `mathRange.min − 1` and `max + 1` → `Unsupported`, never a date |
| T-CAL-10 | gregorian | round trip exhaustive for astronomical years −10,000…+10,000; property 10^5 in ±10^9 years |
| T-CAL-11 | gregorian | leap rule: 1900 F, 2000 T, 2100 F, 1600 T, 0 T (1 BC), −1 F, −4 T (5 BC, proleptic) |
| T-CAL-12 | gregorian | BCE labels: year 0 → "1 BC"; year −3760 → "3761 BC"; never "0" |
| T-CAL-13 | gregorian | JDN 0 → 24 Nov 4714 BC; JDN 1721426 → 1 Jan AD 1 |
| T-CAL-14 | gregorian | `nextBoundary(j,'month')` equals toJdn of the first of next month for 10^4 random j |
| T-CAL-20 | julian | round trip as T-CAL-10 |
| T-CAL-21 | julian | 1733205 → 4 Apr AD 33; JDN 0 → 1 Jan 4713 BC; 2299160 → 4 Oct 1582; leap: AD 100 T, 1900 T, 5 BC (−4) T, 4 BC (−3) F (proleptic rule; the historical 45 BC–AD 8 irregularity is not modeled in MVP) |
| T-CAL-22 | julian | Gregorian label minus Julian label for the same JDN: −2 days in AD 33, 0 in AD 250, +10 in 1582, +13 in 2026 |
| T-CAL-23 | julian | 1 Jan 45 BC (Julian) = JDN 1,704,987 (a Friday); `support` switches from CONVENTIONAL (proleptic) to the declared historical band at this JDN |
| T-CAL-24 | julian+gregorian | 2299160 is Thursday and 2299161 is Friday in both rows; Sabbath row unchanged |
| T-CAL-30 | hebrew | epoch: 1 Tishri AM 1 ↔ JDN 347,998 (Monday) |
| T-CAL-31 | hebrew | round trip exhaustive AM 1…AM 10,000 (≈ 3.65 M days) |
| T-CAL-32 | hebrew | year lengths ∈ {353,354,355,383,384,385}; leap years at positions {3,6,8,11,14,17,19} of the cycle |
| T-CAL-33 | hebrew | dehiyyot: 1 Tishri never Sun/Wed/Fri over AM 1…10,000 |
| T-CAL-34 | hebrew | reference vectors: Hebcal/D&R sample dates (e.g. 1 Tishri 5787 = 12 Sep 2026; 15 Nisan 5786 = 2 Apr 2026) |
| T-CAL-35 | hebrew | certainty: 921 CE → CONVENTIONAL; 923 CE → EXACT; AD 33 → CONVENTIONAL with "observed may differ" reason |
| T-CAL-36 | hebrew | cross-check vs `Intl.DateTimeFormat('en-u-ca-hebrew')` for 2,000 random days 1900–2100 **when available** (skipped, not failed, otherwise) |
| T-CAL-40 | chinese | reference vectors from Hong Kong Observatory tables: every month start 1901–2100 (≈ 2,470 vectors) |
| T-CAL-41 | chinese | leap months: 2017 閏6, 2020 閏4, 2023 閏2, 2025 閏6, 2033 閏11 (the known anomaly) |
| T-CAL-42 | chinese | Chinese New Year dates 1901–2100 vs HKO |
| T-CAL-43 | chinese | sexagenary: 2026 = 丙午; 1984 = 甲子; 1645 = 乙酉 |
| T-CAL-44 | chinese | certainty: 1644 → UNSUPPORTED; 1700 → APPROXIMATE; 1950 → EXACT; 2150 → APPROXIMATE |
| T-CAL-45 | chinese | new moon within 2 min of midnight, or major solar term within 15 min of a month-boundary midnight → certainty APPROXIMATE; at most 25 such months in 1929–2100 |
| T-CAL-46 | chinese | cross-check vs `Intl.DateTimeFormat('zh-u-ca-chinese')` for 2,000 random days 1950–2050 when available |

## 5. Reference-vector sources (checked in with URL + retrieval date)

| Set | Source | Use |
|---|---|---|
| JDN ↔ Gregorian/Julian | US Naval Observatory / NASA JD converters; Meeus examples; Richards tables | T-CAL-10…24 |
| Baseline | `js/calendar.js` self-check; README | T-REG |
| Hebrew | Hebcal (hebcal.com) published dates; Dershowitz–Reingold sample data with errata applied | T-CAL-34 |
| Chinese | Hong Kong Observatory conversion tables 1901–2100 (text files) | T-CAL-40…42 |
| Historical eclipse/day-of-week spot checks | 1582 reform; 2000-01-01 Saturday; 1969-07-20 Sunday; Julian 4 Oct 1582 Thursday | sanity |

## 6. Property tests (seeded; `fast-check` or in-repo generator)

| ID | Property |
|---|---|
| P-01 | ∀ n ∈ ±10^40: `sabbathIndexOf(sabbathJdn(n)) = n` |
| P-02 | ∀ j: `cycleOf(j+7) = cycleOf(j)+1` and `cycleOf(nextSabbath(j)) = cycleOf(j)` |
| P-03 | ∀ j: `positionInCycle(j) = 7 ⇔ isSabbath(j)` |
| P-04 | ∀ adapter, ∀ j in math range: `toJdn(fromJdn(j)) = j` |
| P-05 | ∀ adapter, ∀ j: `support(j).certainty = UNSUPPORTED ⇒ fromJdn(j)` is `Unsupported` |
| P-06 | ∀ j: Julian and Gregorian adapters give the same `dayOfWeek` as the core (they don't compute it; the test ensures labels never imply otherwise) |
| P-07 | ∀ state: URL hash round trip `parse(serialize(s)) = s` |

## 7. UI tests (T-UI) — browser smoke suite (Playwright or manual script)

| ID | Test |
|---|---|
| T-UI-01 | Go-to Sabbath "−1000000000000" → cursor card shows #−1,000,000,000,000; Sabbath row EXACT; calendar rows UNSUPPORTED or CONVENTIONAL as declared |
| T-UI-02 | Go-to Gregorian 23 Oct 4004 BC → JDN 259,290 (proleptic Gregorian) ≠ Julian 23 Oct 4004 BC (JDN 259,258; the labels differ by 32 days in that century); the preview states the calendar used |
| T-UI-03 | Zoom through the whole ladder at #1, at today, at #−10^9; tick count per row ≤ 400; frame time < 50 ms |
| T-UI-04 | Keyboard map (§6 of doc 11) |
| T-UI-05 | Reload with `#j=1733205&z=week` restores the view |
| T-UI-06 | Rows re-label on every cursor change (DOM assertion over all rows) |
| T-UI-07 | axe-core: no serious violations |
| T-UI-08 | Mobile 375 px: rows collapse; cursor card lists all calendars |

## 8. Traceability matrix (requirement → tests)

| Requirement | Tests |
|---|---|
| REQ-AX-01..03 | T-CORE-01, 02, 03 |
| REQ-COMPAT-01 | T-REG-01…09 |
| REQ-COMPAT-02 | CI step: `git diff --quiet -- index.html css js README.md` |
| REQ-COMPAT-03 | T-REG-20 |
| REQ-CORE-01, 13 | import-graph check (CI script) |
| REQ-CORE-02, 10 | T-CORE-10, P-01 |
| REQ-CORE-03 | T-CORE-11 |
| REQ-CORE-04 | T-CORE-12 |
| REQ-CORE-05 | T-CORE-04 |
| REQ-CORE-06 | T-CORE-06, P-02, P-03 |
| REQ-CORE-07 | T-CORE-07 |
| REQ-CORE-08 | T-CORE-08 |
| REQ-CORE-09 | T-CORE-05, P-01 |
| REQ-CORE-11 | T-CORE-09, T-REG-08 |
| REQ-CORE-12 | T-CORE-14 |
| REQ-CORE-14 | T-CORE-13 |
| REQ-CAL-01 | stub-adapter test (adds adapter, asserts core unchanged) |
| REQ-CAL-02, 03, 04 | T-CAL-01, 02, P-05 |
| REQ-CAL-05 | T-CAL-10…14 |
| REQ-CAL-06, 07 | T-CAL-20…24 |
| REQ-CAL-08 | T-CAL-30…36 |
| REQ-CAL-09 | T-CAL-40…46 |
| REQ-CAL-10 | §5 vectors |
| REQ-UI-01…16 | T-UI-01…08 |
| REQ-VER-01…06 | this document |
| REQ-GEN-01 | CI grep: no numeric constant other than 1733205 and 7 in `core/`; no "creation" identifier |
| REQ-NF-05 | T-NF-01: run suite under TZ=UTC, TZ=Pacific/Kiritimati, TZ=Pacific/Pago_Pago |

## 9. Acceptance gates

- Gate G1 (end of Phase 1): all T-CORE, T-REG, P-01…03 pass; `verifyInvariants` identical across Node and two browsers.
- Gate G2 (end of Phase 2): all T-CAL for Gregorian/Julian/Hebrew pass; Chinese vectors pass for 1901–2100; certainty boundaries verified.
- Gate G3 (end of Phase 3): T-UI pass; performance budget met at the three test cursors.
- Gate G4 (end of Phase 4): reference vectors complete with provenance; test suite runs with no network; documentation of every deviation found.

## 10. What verification does not claim

Passing tests prove the implementation matches the model and the cited reference tables.
They do not prove that a calculated Hebrew date in 50 BC was observed, or that a Chinese
date in 1700 matched the imperial almanac in every case. Those limits are encoded as
certainty values and tested as such (REQ-VER-06).
