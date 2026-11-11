# 16 — Approval Checklist

**Status: APPROVED 2026-11-11 — owner accepted every recommended default (A1–A12, D1–D12) and acknowledged C1–C8.**

Implementation does not start until every item in §1 has an owner decision. Items in §2
have a recommended default and proceed with it unless the owner objects. Items in §3 are
confirmations only.

## 1. Decisions required (choose one per row)

| # | Decision | Options | Recommended | Owner's choice |
|---|---|---|---|---|
| A1 | Architecture | A extend in place / B refactor original / **C** v2 beside original with shared core (ADR-001) | C | ✅ C (2026-11-11) |
| A2 | Integer type | `Number` with 2^53 ceiling / **`BigInt`** (ADR-002) | BigInt | ✅ BigInt (2026-11-11) |
| A3 | Cycle convention for non-Sabbath days | **Sunday→Saturday, cycle ends on its Sabbath** / Saturday→Friday, cycle begins with its Sabbath (ADR-003) | Sun→Sat | ✅ Sun→Sat (2026-11-11) |
| A4 | Religious (sunset) boundary | **Out of core; optional Phase 5 layer** / in core with fixed location (ADR-004) | out of core | ✅ out of core (2026-11-11) |
| A5 | Hebrew variant and labels | **Fixed arithmetic; EXACT from 922 CE, CONVENTIONAL earlier** / EXACT from 359 CE / no Hebrew row in MVP (ADR-005) | as stated | ✅ as stated (2026-11-11) |
| A6 | Chinese row before 1645 | **UNSUPPORTED in MVP; table adapter later after rights check** / modern rules extended back and labeled APPROXIMATE / no Chinese row in MVP (ADR-006) | UNSUPPORTED | ✅ UNSUPPORTED (2026-11-11) |
| A7 | Creation boundary | **None in engine; Tradition Markers module optional, off by default** / markers not built at all / a display-only lower bound at one named tradition (new ADR) (ADR-010) | none; optional markers | ✅ none; optional markers (2026-11-11) |
| A8 | MVP scope | **Core + Gregorian/Julian/Hebrew + timeline + verification; Chinese row UNSUPPORTED until 2b** / include Chinese 2b in MVP / core + Gregorian/Julian only | as stated | ✅ as stated (2026-11-11) |
| A9 | Era label style | **"AD/BC" (baseline uses "AD")** / "CE/BCE" / user toggle (default AD/BC) | user toggle, default AD/BC | ✅ user toggle, default AD/BC (2026-11-11) |
| A10 | Repository placement of v2 | **`v2/` in the same repository** / new repository | same repository | ✅ same repository (2026-11-11) |
| A11 | One-line pointer from the original README to v2 | add (one line, nothing else) / do not touch README | add after v2 ships | ✅ add after v2 ships (2026-11-11) |
| A12 | Property-testing dependency | **`fast-check` as dev dependency** / in-repo generator, zero npm | fast-check | ✅ fast-check (2026-11-11) |

## 2. Recommended defaults that proceed unless vetoed — all accepted 2026-11-11

| # | Item | Default |
|---|---|---|
| D1 | Day-of-week convention | baseline `JDN mod 7`, 0 = Monday (ADR-012) |
| D2 | Year numbering internally | astronomical, year 0 = 1 BC (ADR-013) |
| D3 | Declared label range for Gregorian/Julian | ±10^9 years; UNSUPPORTED beyond |
| D4 | Hebrew declared range | AM 1 – AM 10,000 |
| D5 | Chinese declared range | 1645–2200 CE |
| D6 | UI input cap | 40 signed digits |
| D7 | Zoom ladder | day, week, month, year, decade, century, millennium, 10^k |
| D8 | Reference markers | #1, #0, 1582 reform, 1 BC/AD 1, JDN 0, today |
| D9 | Julian 45 BC–AD 8 | regular proleptic, CONVENTIONAL (irregular reconstruction optional, Phase 5.7) |
| D10 | Rendering | SVG; Canvas only if profiling requires |
| D11 | Test runner | `node:test`; CI with network disabled |
| D12 | Eclipse rows from the concept drawing | Phase 5.6, not MVP |

## 3. Confirmations — acknowledged 2026-11-11

| # | Statement |
|---|---|
| C1 | Sabbath #1 = JDN 1,733,205 = Saturday 4 April AD 33 (Julian) is immutable and was not re-examined. |
| C2 | Sabbath #0 = JDN 1,733,198 exists and is retained; no renumbering of indices ≤ 0. |
| C3 | The original files `index.html`, `css/style.css`, `js/calendar.js`, `README.md` were not modified; this package adds only `docs/sabbath-calendar-v2/` (untracked, uncommitted). |
| C4 | No implementation code was written in this phase; the verification script used to re-check numbers lives outside the repository. |
| C5 | Negative Sabbath indices are mathematical projections and will be labeled as such in the UI. |
| C6 | Calendar dates carry certainty labels; an exact Sabbath number never implies an exact historical calendar date. |
| C7 | No Creation date will be placed in the engine; any tradition marker is an interpretation. |
| C8 | No server, database, framework, paid API or runtime dependency will be introduced. |

## 4. After approval

1. ~~Owner marks choices above.~~ Done 2026-11-11: all defaults accepted.
2. Any deviation from the recommended defaults is recorded as a new ADR in doc 15.
3. Phase 1 begins per doc 13; this package is committed to the repository as the first
   commit of the v2 effort, with the owner's approval of the commit.
