# 00 — Executive Summary

**Project:** The Sabbath Calendar (second generation), extending the ChristianCalendar project
**Phase:** 1 — Design and planning only. No implementation code is written in this phase.
**Status:** Design approved 2026-11-11 (all recommended defaults accepted); implementation not yet started
**Date:** 2026-11-11
**Baseline examined:** `ksaday/ChristianCalendar`, commit `6229702` (2026-07-21): `index.html`, `css/style.css`, `js/calendar.js`, `README.md`

---

## 1. What this package is

Seventeen planning documents that specify a mathematically complete, continuously numbered,
bidirectionally unbounded seven-day Sabbath chronology built on the existing project's
immutable anchor, together with synchronized Gregorian, Julian, Hebrew and Chinese
calendar representations, a synchronized multi-row timeline interface, a verification plan,
and a phased roadmap.

Nothing in the existing application has been modified. The documents live in a new
directory, `docs/sabbath-calendar-v2/`, inside a fresh clone of the repository; they are
untracked and uncommitted.

## 2. The immutable baseline (confirmed)

| Item | Value | Independently re-verified |
|---|---|---|
| Sabbath #1 | Saturday, 4 April AD 33 (Julian) | Yes — Julian→JDN gives 1,733,205 |
| Same day, proleptic Gregorian | 2 April AD 33 | Yes — Gregorian→JDN gives 1,733,205 |
| Anchor JDN | 1,733,205 | Yes — JDN mod 7 = 5 = Saturday |
| Formula | `SabbathJDN(n) = 1733205 + 7 × (n − 1)` | Yes |
| Regression example | 11 April 2026 = JDN 2,461,142 = Sabbath #103,992 | Yes |
| Concept-drawing example | 3 October 2026 = Sabbath #104,017 | Yes (25 weeks after #103,992) |
| Sabbath #0 | JDN 1,733,198 = Saturday 28 March AD 33 (Julian) | Yes |
| Sabbath #−1 | JDN 1,733,191 = Saturday 21 March AD 33 (Julian) | Yes |

A detail worth noting: the existing application **already renders Sabbaths #0, #−1 … #−12**
when the January–March AD 33 months are viewed (it styles them with a grey "pre" seal).
Negative numbering is therefore not a new concept being imposed on the baseline; it is
latent behavior of the baseline that the new design makes explicit, exact and navigable.

## 3. Headline findings

1. **The existing core math is correct and reusable.** The Gregorian↔JDN routines were
   round-trip tested over six million consecutive JDNs from −3,000,000 to +3,000,000
   (BCE years included) with zero mismatches. The day-of-week function already uses a
   sign-safe modulo. These routines become the reference oracle for the new engine.
2. **The limitations are in the shell, not the math.** Year navigation is clamped to
   33–3000, there is no Julian or BCE display path, non-Sabbath days have no cycle
   assignment, there are no automated tests, and precision depends on JavaScript
   `Number` (exact only below 2^53 days, about 2.5 × 10^13 years — ample, but the new
   design uses `BigInt` so that the arithmetic contract has no numeric ceiling at all).
3. **Recommended architecture: Option C with a shared core.** Keep the original
   application untouched as the reference implementation; develop the second-generation
   application in a new `v2/` directory of the same repository, around a dependency-free,
   pure-function Chronology Core (`BigInt` JDN arithmetic) that is regression-tested
   against the original functions. No framework, no server, no database, no paid API.
4. **Calendar certainty must be labeled, not assumed.** Every converted date carries one of
   four certainty levels: EXACT, CONVENTIONAL (proleptic or calculated), APPROXIMATE
   (reconstruction), UNSUPPORTED. The Sabbath number is always EXACT. A Hebrew date before
   the tenth century CE or a Chinese date before 1645 CE is never shown as if it were an
   attested historical date.
5. **No Creation date goes into the engine.** The research track concludes that no absolute
   JDN for Genesis 2:1–3 can be derived defensibly: the three textual traditions
   (Masoretic, Septuagint, Samaritan) differ by more than 1,500 years, and the link from
   any of them to an absolute civil date rests on further interpretive choices. The model
   stays unbounded. An optional, clearly labeled "Tradition Markers" module can later show
   where Ussher's, the Hebrew-era, or the Byzantine-era Creation dates would fall on the
   existing cycle — as projections, never as facts.

## 4. Decisions that need the owner's approval

The full list is in `16-APPROVAL-CHECKLIST.md`. The ones that shape everything else:

| # | Decision | Recommended default |
|---|---|---|
| A1 | Architecture option | C: original untouched; new `v2/` app around a shared core |
| A2 | Integer type for the core | `BigInt` throughout; `Number` only at the display boundary when provably safe |
| A3 | Civil cycle convention | Cycle *n* = the seven days Sunday→Saturday that **end** on Sabbath *n* (the Sabbath is the seventh day of its own cycle) |
| A4 | Religious Sabbath boundary (Friday sunset) | Out of the core; optional location-aware layer in Phase 5 |
| A5 | Hebrew calendar variant | Fixed arithmetic (rabbinic) calendar, labeled CONVENTIONAL before 922 CE |
| A6 | Chinese calendar variant | Modern astronomical rules (post-1645 definitions), UNSUPPORTED before 1645 CE unless a historical-table adapter is adopted later |
| A7 | Creation boundary | Not in the engine; optional Tradition Markers module, off by default |
| A8 | MVP scope | Core + Gregorian/Julian + timeline with lookups + full test suite |

## 5. Document map

| File | Content |
|---|---|
| 01-PROJECT-VISION.md | Vision, principles, the three models (mathematical, biblical, historical) |
| 02-EXISTING-PROJECT-ANALYSIS.md | Line-level analysis of the baseline, what to preserve, what to extend |
| 03-SRS.md | Numbered requirements with acceptance criteria |
| 04-MATHEMATICAL-FOUNDATION.md | Definitions, theorems, floor-division rules, precision analysis |
| 05-NEGATIVE-SABBATH-NUMBERING.md | Zero and negative indices, BCE, negative JDN, worked examples |
| 06-CHRONOLOGY-ENGINE.md | Chronology Core specification and API semantics |
| 07-CALENDAR-CONVERSION-MODEL.md | Adapter model; per-calendar validity, variants, sources, limits |
| 08-CREATION-WEEK-RESEARCH.md | Genesis research track and the Creation-boundary recommendation |
| 09-SYSTEM-ARCHITECTURE.md | Architecture options compared; recommended structure |
| 10-DATA-MODEL-AND-INTERFACES.md | Types, interfaces, certainty labels, serialization |
| 11-UI-UX-WIREFRAMES.md | Synchronized timeline wireframes and interaction model |
| 12-TEST-AND-VERIFICATION-PLAN.md | Invariants, test matrix, reference vectors, traceability |
| 13-DEVELOPMENT-ROADMAP.md | Phases 0–5, gates, MVP, dependencies |
| 14-RISKS-AND-LIMITATIONS.md | Risk register and stated limitations |
| 15-ARCHITECTURE-DECISIONS.md | ADR-001 … ADR-014 |
| 16-APPROVAL-CHECKLIST.md | Everything requiring owner sign-off before Phase 0 implementation |

## 6. Epistemic key used throughout the package

| Tag | Meaning |
|---|---|
| **[AXIOM]** | Project-defined, not up for re-derivation (e.g. Sabbath #1) |
| **[PROOF]** | Follows mathematically from the axioms |
| **[EVIDENCE]** | Supported by cited scholarly or observational sources |
| **[CONVENTION]** | A standard but arbitrary rule (e.g. proleptic Gregorian, astronomical year numbering) |
| **[INTERPRETATION]** | Theological or historical reading that reasonable people dispute |
| **[OPEN]** | Unresolved; a recommended default is recorded |
