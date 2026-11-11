# 13 — Development Roadmap

No phase begins before the owner approves `16-APPROVAL-CHECKLIST.md`. Estimates are in
focused working days for one developer and are indicative.

## Phase 0 — Existing Project Assessment (done in this package; 0.5 day to re-run)

| Item | Deliverable | Status |
|---|---|---|
| Inspect repository | doc 02 | done |
| Identify reusable functions | doc 02 §4 | done |
| Preserve original behavior | REQ-COMPAT-02; CI diff guard | to set up in Phase 1 |
| Baseline regression requirements | COMPAT-01…15, T-REG | specified |
| **Gate G0** | Owner approval of A1–A8 | pending |

## Phase 1 — Chronology Core (3–4 days)

| Step | Output |
|---|---|
| 1.1 `bigint-math.js`: floorDiv, floorMod, parseIntegerInput | + T-CORE-11, 13 |
| 1.2 `chronology.js`: constants and all API functions of doc 06 §3 | + T-CORE-01…10 |
| 1.3 `invariants.js`: seeded self-test | + T-CORE-14 |
| 1.4 Regression fixture: verbatim copy of baseline functions; T-REG-01…09, T-REG-20 | |
| 1.5 Property tests P-01…03 | |
| 1.6 CI: `node --test`, import-graph check, baseline diff guard, no-network | |
| **Gate G1** | all above green; `verifyInvariants` identical in Node, Chrome, Firefox, Safari |

Dependencies: none. MVP-critical.

## Phase 2 — Calendar Conversion (Gregorian/Julian/Hebrew 3–4 days; Chinese 4–6 days)

| Step | Output |
|---|---|
| 2.1 `adapter.js`, `registry.js`, Certainty enum, Unsupported | stub-adapter test |
| 2.2 `gregorian.js` (BigInt port of baseline), `julian.js` | T-CAL-10…24; P-04…06 |
| 2.3 `hebrew.js` (D&R fixed calendar) with certainty bands | T-CAL-30…36 |
| 2.4 Reference vectors checked in with provenance | §5 of doc 12 |
| **Gate G2a** | Gregorian/Julian/Hebrew green |
| 2.5 (2b) `chinese/astronomy.js` (solar longitude, new moon, ΔT), `chinese.js` | T-CAL-40…46 vs HKO 1901–2100 |
| 2.6 Certainty bands incl. midnight-new-moon downgrade | T-CAL-44, 45 |
| **Gate G2b** | Chinese green for 1901–2100; APPROXIMATE/UNSUPPORTED bands verified |

Dependencies: Phase 1. 2.1–2.4 are MVP; 2b may ship after MVP.

## Phase 3 — Timeline Interface (6–8 days)

| Step | Output |
|---|---|
| 3.1 `cursor.js`, `zoom.js`, `ticks.js` (O(visible)), `url-state.js` | P-07 |
| 3.2 `sabbath-row-rules.js` (anniversary, milestone ported) | T-REG-04, 05 |
| 3.3 `render-rows.js` (SVG), `cursor-card.js`, `cycle-view.js`, `lookup.js`, `format.js` | |
| 3.4 Keyboard, touch gestures, responsive layout | T-UI-04, 08 |
| 3.5 Reference markers; certainty badges and legend | T-UI-06 |
| 3.6 Integrity panel (runs `verifyInvariants` on load; shows result as the baseline's footer does) | COMPAT-15 |
| **Gate G3** | T-UI-01…08 green; performance budget met |

Dependencies: Phases 1, 2a. MVP-critical (Chinese row may show UNSUPPORTED until 2b).

## Phase 4 — Accuracy Verification (3 days)

| Step | Output |
|---|---|
| 4.1 Complete vector sets; provenance file | doc 12 §5 |
| 4.2 Cross-engine runs (Node, three browsers, three timezones) | T-NF-01 |
| 4.3 Independent recomputation of 50 random Sabbath indices by a separate script (Python, `-I`) | report |
| 4.4 Documentation of every discrepancy found in adapters and its certainty handling | doc 14 update |
| **Gate G4** | release candidate; owner review |

## Phase 5 — Optional Extensions (each separately approved)

| Extension | Notes | Estimate |
|---|---|---|
| 5.1 Religious boundary layer (Friday sunset): location input, NOAA solar-position algorithm, labeled "observance window" | Never changes the civil cycle | 3 days |
| 5.2 Tradition Markers module (doc 08 §4) | Off by default | 1 day |
| 5.3 Historical Chinese table adapter (Academia Sinica / Liu reconstructions) | Licensing check first | 3 days + rights |
| 5.4 Regional Gregorian adoption table | Britain 1752, Russia 1918, etc. | 1 day |
| 5.5 Additional calendars (Coptic/Ethiopic, Islamic tabular, Persian, Egyptian civil, Babylonian P–D tables) | Each with validity table | 1–3 days each |
| 5.6 Eclipse event rows (NASA canon; recorded eclipses) | Marker datasets with ΔT uncertainty | 3–5 days |
| 5.7 Julian 45 BC–AD 8 irregular leap reconstruction | APPROXIMATE band | 0.5 day |

## MVP definition

Phase 1 + Phase 2 (2.1–2.4) + Phase 3 + Phase 4, with the Chinese row present but
UNSUPPORTED until 2b lands. Total ≈ 16–19 days.

## Dependency graph

```
P1 core ──► P2a greg/julian/hebrew ──► P3 timeline ──► P4 verification ──► release
       └──► P2b chinese ───────────────┘ (can land after MVP)
P5.* each depends on release and its own approval
```

## Definition of done per phase

- All listed tests green in CI with network disabled.
- `git diff` of the original four files is empty.
- Documentation updated for any deviation from this package, recorded as an ADR.
