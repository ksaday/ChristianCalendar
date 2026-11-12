# Phase 4 — Accuracy Verification Report

**Date:** 2026-11-12 · **Branch:** `sabbath-calendar-v2-design` · **Scope:** roadmap Phase 4 (doc 13), gate G4.

## 1. Summary

| Area | Method | Result |
|---|---|---|
| Core invariants I1–I7 | seeded self-test, 1,015 indices / 1,009 days incl. ±10^40 | PASS in every engine tried; identical digest `I1:P1\|I2:P1015\|I3:P1015\|I4:P1015\|I5a:P1015\|I5b:P1009\|I6:P1015\|I7:P1009` |
| Cross-engine (4.2) | `scripts/cross-engine.sh` | Node 24, JavaScriptCore (Safari's engine, `jsc`), Google Chrome 157 headless, the desktop app's Chromium 156 pane: all identical. **Firefox not installed on this machine — not run.** |
| Timezones (REQ-NF-05) | full suite under `TZ=UTC`, `Pacific/Kiritimati`, `Pacific/Pago_Pago` | 82 pass / 0 fail in each |
| Independent recomputation (4.3) | `scripts/export-sample.mjs` → `scripts/independent-recompute.py` (Python, `-I`, no v2 code: `datetime.fromordinal`, Meeus's Julian algorithm) | 60 of 60 sampled indices agree on JDN, cycle, weekday, Gregorian and Julian labels (see `phase4-independent-recomputation.md`) |
| Gregorian / Julian | 13 published vectors; exhaustive round trips; baseline oracle over every day 33–3000 and 10^6 random JDNs | all agree |
| Hebrew | Hebcal converter API, 60 independent dates 1600–2200 + edges; 10 holiday vectors; ICU 2,000-day cross-check; 10,000-year structural checks | all agree |
| Chinese | Hong Kong Observatory tables 1901–2100 (2,474 month starts, 73 leap months, 200 New Years) | 1929–2100: all agree. 1901–1928: five entries differ, each a minute-level borderline (§3) |
| Chinese solar terms | 4,800 HKO solar-term days vs the Meeus low-accuracy solar series | 18 differ by one day, all within 15 minutes of midnight (§3) |
| ICU (Intl) Chinese calendar | 2,000 random days 1950–2050 | ICU disagreed on 16; the HKO table sided with this implementation on every one |
| UI smoke (T-UI-01…11, 14) | `test/browser/ui-smoke.html`, zero dependencies | 12 of 12 checks passed in the visible Chromium pane; see §4 for the headless run |
| Accessibility (T-UI-07) | `test/browser/a11y.html` with axe-core 4.10.2 (dev dependency, served locally) | 0 violations after fixes (§4); 2 "needs review" rules (color-contrast on gradient header text, which axe cannot compute) |

## 2. Discrepancies found and how they are handled

| # | Discrepancy | Explanation | Handling |
|---|---|---|---|
| D1 | HKO month starts 1906-04-24, 1917-03-23/04-21, 1922-06-25/07-24 differ | New moon 7.8 min before Beijing-LMT midnight (1906); major solar term 2–4 min before a month-boundary midnight (1917, 1922), below the ~15-min solar-series resolution. HKO's own pre-1929 tables are internally inconsistent about UTC+8 vs Beijing LMT (1906 behaves as UTC+8; 1914/1916/1920 as LMT). | Inside the declared APPROXIMATE band (1645–1928); flagged by the adapter's margin rule; documented in docs 07 §5, 14 §3; tested as a fixed allow-list in T-CAL-40 |
| D2 | 18 of 4,800 HKO solar-term days differ by one day | All instants within 15 min of midnight; Meeus ch. 25 low-accuracy series (~0.01°) | Solar-term days are not displayed; leap-month assignment is flagged APPROXIMATE within 15 min of a boundary; a higher-order solar series is Phase 5 work (doc 14) |
| D3 | ICU `chinese` disagreed on 16/2,000 days | ICU uses less precise astronomy near midnight new moons (e.g. 17 Aug 2012 new moon at 23:54 UTC+8) and differs on the 1987 leap month | ICU is a cross-check only (ADR-009); the test requires HKO to side with us on every ICU disagreement |
| D4 | Design threshold of 30 min for "borderline" would have flagged 73 verified-correct months | Over-conservative | Thresholds set to 2 min (new moon) / 15 min (solar term); docs 07/10/12 updated |
| D5 | axe-core: gold-on-white contrast (3.3:1) on the gold button and inline seals; empty header cell in the cycle table | Baseline palette's `--gold` is too light for white text | Seal/button background changed to `--gold-deep` (≥ 4.5:1); the "pre" grey darkened; hidden header label added |
| D6 | Hidden/automated tabs: URL and title did not follow the cursor | render was scheduled only on `requestAnimationFrame`, which hidden tabs never fire | Timer fallback when `document.hidden` or `navigator.webdriver` |

## 3. What remains unverified

- Firefox (SpiderMonkey) — not installed here; CI runs Node only. `scripts/cross-engine.sh` will include Firefox automatically when present.
- Safari's UI rendering — only its JavaScript engine was exercised (`jsc`).
- The automated browser suite runs via the two HTML harness pages (manually opened or via headless Chrome); it is not yet wired into CI.
- Pre-1929 Chinese month starts remain APPROXIMATE by design; no historical Chinese calendar before 1645 (ADR-006).

## 4. Headless run record

Headless Google Chrome 157 was tried with `--dump-dom` in three modes. With `--virtual-time-budget` the first six checks pass and the run then stalls in the zoom-ladder loop (virtual time and frame-scheduled renders interact badly); with `--timeout` the DOM is dumped before the harness finishes. The harness is therefore a **visible-browser** check: opened in the desktop app's Chromium pane on 2026-11-12 it passed all 12 checks. The axe-core page completes under `--virtual-time-budget` (0 violations).
