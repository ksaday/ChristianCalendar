# 06 — Chronology Engine Specification

The Chronology Core is a pure, dependency-free module. It knows the anchor, the number 7,
and arbitrary-precision integers. It does not know what a month, a sunset, a timezone, a
Creation, or a browser is.

## 1. Position in the system

```
                 ABSOLUTE SABBATH ANCHOR  [AXIOM]
                      A = 1,733,205
                            |
                            v
   +--------------------------------------------------+
   |              CHRONOLOGY CORE  (core/)            |
   |   BigInt integer model, floorDiv / floorMod      |
   |   sabbathJdn · sabbathIndexOf · cycleOf · dow    |
   |   prev/next · weeksBetween · verifyInvariants    |
   +--------------------------------------------------+
                            |
                   JDN (BigInt) is the only
                   coordinate that leaves the core
                            |
   +--------------------------------------------------+
   |        CALENDAR ADAPTERS (calendars/)  doc 07    |
   |  gregorian · julian · hebrew · chinese · (more)  |
   +--------------------------------------------------+
                            |
   +--------------------------------------------------+
   |        TIMELINE MODEL (timeline/)  doc 10, 11    |
   |  cursor, viewport, zoom ladder, tick generation  |
   +--------------------------------------------------+
                            |
                     USER INTERFACE (ui/)
```

Improvements over the conceptual sketch in the brief: the "Sabbath Number Engine" and
"Chronology Core" are one module (they are the same arithmetic); the "Date Representation
Layer" is split into independent adapters plus a timeline model, so that adapters never
depend on each other or on the UI.

## 2. Types

| Type | Definition |
|---|---|
| `Jdn` | `bigint` — integer Julian Day Number of a civil day |
| `SabbathIndex` | `bigint` |
| `CycleIndex` | `bigint` (equal to the index of the Sabbath that ends the cycle) |
| `DayOfWeek` | `0 | 1 | 2 | 3 | 4 | 5 | 6` (Mon…Sun), as in the baseline |
| `CyclePosition` | `1 | 2 | 3 | 4 | 5 | 6 | 7` (Sun…Sat; 7 = Sabbath) |
| `IntegerInput` | `bigint | number (safe integer) | string (/^[+−-]?\d+$/)` |

Every public function accepts `IntegerInput` and normalizes to `bigint`; anything else
throws `ChronologyInputError` (REQ-CORE-14).

## 3. Public API (semantics; no implementation here)

| Function | Signature | Semantics | Complexity |
|---|---|---|---|
| `ANCHOR_JDN` | `const bigint` | 1733205n | — |
| `CYCLE_LENGTH` | `const bigint` | 7n | — |
| `sabbathJdn(n)` | `(SabbathIndex) → Jdn` | `A + 7(n−1)` | O(1) |
| `isSabbath(j)` | `(Jdn) → boolean` | `floorMod(j − A, 7) = 0` | O(1) |
| `sabbathIndexOf(j)` | `(Jdn) → SabbathIndex | NotASabbath` | D3; typed non-result otherwise (never a fraction) | O(1) |
| `cycleOf(j)` | `(Jdn) → CycleIndex` | D4: `floorDiv(j − A + 6, 7) + 1` | O(1) |
| `cycleBounds(n)` | `(CycleIndex) → {first: Jdn, last: Jdn}` | `[sabbathJdn(n) − 6, sabbathJdn(n)]` | O(1) |
| `positionInCycle(j)` | `(Jdn) → CyclePosition` | D6 | O(1) |
| `dayOfWeek(j)` | `(Jdn) → DayOfWeek` | D5 | O(1) |
| `previousSabbath(j)` | `(Jdn) → Jdn` | D7; returns `j` if `j` is a Sabbath | O(1) |
| `nextSabbath(j)` | `(Jdn) → Jdn` | D7; returns `j` if `j` is a Sabbath | O(1) |
| `previousSabbathStrict(j)` / `nextSabbathStrict(j)` | `(Jdn) → Jdn` | strictly before/after `j` | O(1) |
| `weeksBetween(n, m)` | `(SabbathIndex, SabbathIndex) → bigint` | `m − n` | O(1) |
| `daysBetween(a, b)` | `(Jdn, Jdn) → bigint` | `b − a` | O(1) |
| `daysSinceAnchor(j)` | `(Jdn) → bigint` | `j − A` (baseline popover field) | O(1) |
| `describeDay(j)` | `(Jdn) → DayDescriptor` | bundle: jdn, cycle, position, dayOfWeek, isSabbath, sabbathIndex?, prev, next | O(1) |
| `verifyInvariants(opts)` | `({samples, seed}) → Report` | runs I1–I7 on fixed and random indices | O(samples) |
| `floorDiv(a, b)`, `floorMod(a, b)` | `(bigint, bigint) → bigint` | D8; exported for adapters | O(1) |

Properties guaranteed (and tested):

- Round trip: `sabbathIndexOf(sabbathJdn(n)) === n` (I4).
- Partition: `cycleOf` is monotone non-decreasing in `j`, increases by exactly 1 every 7 days, and `cycleOf(sabbathJdn(n)) === n` (I5).
- `nextSabbath(j) − previousSabbath(j) ∈ {0n, 7n}` (I7).
- No function ever iterates over days or weeks. `verifyInvariants` iterates over *samples*, not over the timeline.

## 4. Non-Sabbath days: the cycle convention (ADR-003)

Decision recommended for approval (A3): a cycle is Sunday→Saturday and is numbered by the
Sabbath that **ends** it.

| Day (position) | Example for cycle #103,992 | JDN |
|---|---|---|
| Sunday (1) | 5 Apr 2026 | 2,461,136 |
| Monday (2) | 6 Apr 2026 | 2,461,137 |
| … | | |
| Friday (6) | 10 Apr 2026 | 2,461,141 |
| **Sabbath (7)** | **11 Apr 2026** | **2,461,142** |

Rationale: Genesis 2:2–3 and Exodus 20:11 count the seventh day as the completion of the
week; "the week ending on Sabbath n" is the natural reading, and the number a user sees on a
Saturday is the number of the cycle they are in all week. The alternative (Saturday→Friday,
cycle begins with its Sabbath) is one line of code different (`floorDiv(j − A, 7) + 1`) and is
preserved as a documented alternative should the owner prefer it.

Either way the civil cycle is defined on whole JDNs (midnight-to-midnight civil days). The
religious Sabbath, Friday sunset to Saturday sunset, is location- and date-dependent and
belongs to an optional Phase 5 layer (ADR-004). The baseline phrase "begins at sunset on
Friday" remains as explanatory text, not as a computational boundary.

## 5. Error model

| Error | When |
|---|---|
| `ChronologyInputError` | non-integer, NaN, unsafe `number`, malformed string |
| `NotASabbath` (value, not exception) | `sabbathIndexOf` on a non-Sabbath; carries `cycle`, `prev`, `next` so callers can recover without a second call |

The core never throws for large magnitudes; only memory exhaustion can stop a `BigInt`
operation, which is outside the contract and documented in doc 14.

## 6. Determinism and purity rules

1. No access to `Date`, `Intl`, `Math.random`, timers, DOM, storage or network.
2. No module-level mutable state.
3. `verifyInvariants` takes an explicit seed; the pseudo-random generator is a small
   in-module xorshift on `BigInt` so results are reproducible across engines.
4. Same inputs → bit-identical outputs in Node and every browser.

## 7. Compatibility with the baseline functions

| Baseline | Core equivalent | Note |
|---|---|---|
| `sabbathNumber(j)` on a Saturday | `sabbathIndexOf(j)` | identical value |
| `isSabbath(j)` | `isSabbath(j)` | identical |
| `dow(j)` | `dayOfWeek(j)` | identical mapping |
| `j − ANCHOR_JDN` | `daysSinceAnchor(j)` | identical |
| `(j − ANCHOR_JDN)/7` ("weeks since anchor") | `daysSinceAnchor(j) / 7n` on Saturdays, i.e. `sabbathIndexOf(j) − 1n` | identical on Saturdays; baseline shows a fraction on other days only via the popover, which is Saturday-only |

Test T-REG-20 runs both implementations side by side over the baseline's range.

## 8. What is deliberately *not* in the core

- Calendar conversions (doc 07).
- Sunset, longitude, timezone (Phase 5).
- Any minimum or maximum index (REQ-GEN-01).
- Formatting with separators, minus signs, ordinals (presentation layer; rules carried over from the baseline's `fmt`/`ord`).
- Anniversary and milestone rules (Sabbath-row presentation rules in `timeline/`, because they depend on the Gregorian adapter).

## 9. Requirements realized here

REQ-AX-01…03, REQ-CORE-01…14, REQ-COMPAT-01/03, REQ-GEN-01.
