# Phase 5 verification report — Bible events and eclipse rows

Date: 2026-11-13. Scope: roadmap items 5.2 and 5.6 and the owner's request of 2026-11-12 for
Bible dates on the calendar (design and decisions: doc 17, ADR-015).

## What was added

- `src/markers/`: four chronological systems (Ussher, Seder Olam, early-date conservative,
  critical/historical), 52 events with a sourced dating per system, the Genesis 5/11 arithmetic,
  the NASA canon reader with ΔT uncertainty, and 35 recorded eclipses.
- `data/eclipses/`: 11,898 solar and 12,064 lunar eclipses, built by `scripts/build-eclipses.mjs`.
- Three timeline rows, two cursor-card sections, a "Bible event" mode in Go to…, a chronology
  selector in the Rows menu, legend and footer credit.

## Results

| Check | Result |
|---|---|
| `npm run verify` | check-core OK (23 files), baseline files unchanged, 94/94 tests |
| Timezones | 94/94 under UTC, Pacific/Kiritimati, Pacific/Pago_Pago |
| `npm run check:browser` (headless Chrome, real time) | ui-smoke 16/16, axe-core 0 violations |
| Desktop-app browser pane (Chromium, visible) | ui-smoke 16/16, axe-core 0 violations |
| Recorded eclipses against the canon | 35/35 match, 34 on the same UT day |
| Slowest render over the zoom ladder | 5 ms |

## Issues found and fixed during verification

- Two rows had no item in view at today's date and were empty ARIA lists (axe
  `aria-required-children`). Empty rows now carry one hidden "nothing in view" item.
- Bible-event labels were drawn under the next event's diamond at century zoom. Labels now sit in
  two lanes on a top layer with a paper-coloured halo.
- The smoke harness used fixed sleeps and timed frames, so a throttled pane failed timing-only
  checks. It now waits for each re-render, and the app records its own render time.
- The Shu Jing (Xi–He) eclipse of 2137 BC was dropped: it lies outside the canon and cannot be
  checked.

## Not claimed

- Firefox was still not run (not installed here).
- Ussher's figures were read from the archive.org OCR text of the 1658 English *Annals* and
  cross-checked against two secondary summaries, not against a printed copy.
- Bible-event dates are traditions or estimates. The app labels them so and never feeds them
  into the Sabbath count.

## Addendum — civil date by region (5.4) and the early Julian calendar (5.7), 2026-11-13

| Check | Result |
|---|---|
| `npm run verify` | check-core OK (24 files), baseline unchanged, 100/100 tests |
| `npm run check:browser` | ui-smoke 18/18, axe-core 0 violations |
| Early Julian reconstructions vs the source table | 18/18 values reproduced |

Found and fixed: a render that was pending when the URL hash changed wrote the old cursor back,
losing the jump; and the reconstruction list kept a "(Roman, …)" suffix when the scholar's name had
its own parentheses. Design: doc 18; decision: ADR-016.
