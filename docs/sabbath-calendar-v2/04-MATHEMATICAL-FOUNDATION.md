# 04 — Mathematical Foundation

## 1. Primitive objects

| Symbol | Type | Meaning |
|---|---|---|
| `J` | ℤ (arbitrary precision) | Julian Day Number: the integer label of a civil day. JDN 0 = Monday, 1 January 4713 BC (proleptic Julian) = 24 November 4714 BC (proleptic Gregorian). **[CONVENTION]** (astronomical standard) |
| `A` | constant | `A = 1733205`, the anchor JDN. **[AXIOM]** |
| `n` | ℤ | Sabbath index |
| `W` | constant | `W = 7`, the cycle length. **[AXIOM]** (seven-day week) |

A JDN here is the integer day label, not the fractional astronomical Julian Date (which
starts at noon UT). Civil day *d* corresponds to Julian Date interval [JDN − 0.5, JDN + 0.5).
The engine never uses fractions.

## 2. Definitions

**D1 (Sabbath day).** `SabbathJDN(n) = A + W·(n − 1)`, for every `n ∈ ℤ`.

**D2 (Sabbath predicate).** `IsSabbath(J) ⇔ floorMod(J − A, W) = 0`.
Equivalently, since `floorMod(A, 7) = 5`: `IsSabbath(J) ⇔ floorMod(J, 7) = 5`, which is the
baseline's `dow(j) === 5`.

**D3 (Sabbath index of a Sabbath day).** For `J` with `IsSabbath(J)`:
`SabbathIndex(J) = (J − A)/W + 1` (exact integer division).

**D4 (Cycle of any day) — convention per ADR-003.**
`Cycle(J) = floorDiv(J − A + 6, W) + 1`.
Cycle *n* is the closed interval `[SabbathJDN(n) − 6, SabbathJDN(n)]`, i.e. Sunday through
Saturday, ending on Sabbath *n*. The Sabbath is the seventh day of its own cycle.

**D5 (Day of week).** `DoW(J) = floorMod(J, 7)` with 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu,
4 = Fri, 5 = Sat, 6 = Sun. **[CONVENTION]** inherited from the baseline.

**D6 (Position within cycle).** `Pos(J) = floorMod(J − A, 7) + 1 ∈ {1,…,7}`, where 7 is the Sabbath.
Equivalently `Pos(J) = (DoW(J) + 2) mod 7`, with 0 mapped to 7: Sunday = 1, …, Saturday = 7.

**D7 (Adjacent Sabbaths).**
`NextSabbath(J) = J + floorMod(A − J, 7)` (equals J when J is a Sabbath).
`PrevSabbath(J) = J − floorMod(J − A, 7)` (equals J when J is a Sabbath).

**D8 (Floor division and modulo).** For integers `a`, `b ≠ 0`:
`floorDiv(a, b) = ⌊a / b⌋`, `floorMod(a, b) = a − b·floorDiv(a, b)`, so `floorMod(a, b) ∈ [0, b)` for `b > 0`.

## 3. Theorems **[PROOF]**

**T1 (Anchor).** `SabbathJDN(1) = A + 7·0 = A = 1733205.` ∎

**T2 (Spacing).** `SabbathJDN(n+1) − SabbathJDN(n) = A + 7n − (A + 7(n−1)) = 7.` Holds for every `n ∈ ℤ`,
including `n ≤ 0`, since the identity involves no case split. ∎

**T3 (Bijection).** `n ↦ A + 7(n−1)` is an injective affine map ℤ → ℤ whose image is exactly
`{J : J ≡ A (mod 7)}`. Therefore every Sabbath day has exactly one index and every integer
index names exactly one Sabbath day. No two indices share a day; no day in the image is
skipped. ∎

**T4 (Round trip).** For any `n`, `SabbathIndex(SabbathJDN(n)) = (A + 7(n−1) − A)/7 + 1 = n.`
For any Sabbath `J`, `SabbathJDN(SabbathIndex(J)) = A + 7·((J−A)/7) = J.` ∎

**T5 (Cycle partition).** The intervals `[A + 7(n−1) − 6, A + 7(n−1)]` for `n ∈ ℤ` are
pairwise disjoint and their union is ℤ: consecutive intervals are `[A+7n−13, A+7n−7]` and
`[A+7n−6, A+7n]`, which abut without gap or overlap. `Cycle(J)` as defined in D4 returns the
unique `n` with `J` in the `n`-th interval, because `J − A + 6 ∈ [7(n−1), 7(n−1) + 6]` ⇔
`floorDiv(J − A + 6, 7) = n − 1`. ∎

**T6 (Cycle of a Sabbath).** `Cycle(SabbathJDN(n)) = floorDiv(7(n−1) + 6, 7) + 1 = (n−1) + 1 = n.` ∎

**T7 (Sabbath #0 and negatives).** By D1, `SabbathJDN(0) = A − 7 = 1733198` and
`SabbathJDN(−N) = A − 7(N+1)`. These are ordinary members of the bijection in T3; omitting
index 0 would break T2 at `n = 0` (the gap would be 14 days). ∎

**T8 (Invariance under relabeling).** All definitions depend on `J` only. Any civil calendar
(Julian, Gregorian, Hebrew, Chinese) is a function `J ↦ label`; changing the label function,
including the 1582 reform's 10-day label jump, changes no value of `SabbathJDN`, `Cycle`, or
`DoW`. Therefore month boundaries, year boundaries, leap days, leap months, era changes and
calendar reforms cannot perturb the seven-day cycle inside this model. ∎

**T9 (Day-of-week consistency).** 4 October 1582 (Julian) is JDN 2,299,160, `floorMod = 3` =
Thursday; 15 October 1582 (Gregorian) is JDN 2,299,161, Friday. The historical record that
Thursday was followed by Friday across the reform is reproduced. **[EVIDENCE]** (the reform
bull *Inter gravissimas* specified exactly this succession.)

## 4. Floor-division rules (binding for implementation)

JavaScript facts verified in Node 24:

| Expression | Result | Needed |
|---|---|---|
| `-15 % 7` (Number) | `-1` | `6` |
| `Math.trunc(-15/7)` | `-2` | `-3` |
| `-15n / 7n` (BigInt) | `-2n` (truncates) | `-3n` |
| `-15n % 7n` (BigInt) | `-1n` (sign of dividend) | `6n` |

Required helpers (semantics, not code):

```
floorDiv(a, b):  q = a / b (BigInt truncating);  if (a % b ≠ 0) and (sign(a) ≠ sign(b)) then q − 1 else q
floorMod(a, b):  r = a % b;  if r ≠ 0 and sign(r) ≠ sign(b) then r + b else r      // equivalently ((a % b) + b) % b for b > 0
```

Rule: every division or modulo in the core goes through these two helpers. Native `/` and
`%` on possibly negative operands are forbidden by the review checklist (REQ-CORE-03).

## 5. Precision analysis

| Representation | Exact integer range | Equivalent span | Consequence |
|---|---|---|---|
| JS `Number` (IEEE 754 double) | |x| ≤ 2^53 − 1 ≈ 9.007 × 10^15 | ≈ 2.47 × 10^13 years from JDN 0 | Enough for any history; still a ceiling, and intermediate products (`4a`, `146097b`) overflow sooner, around JDN 2.25 × 10^15 |
| JS `Date` | ±8.64 × 10^15 ms ≈ ±273,790 years around 1970 | years −271,821 … +275,760 | Unsuitable as a coordinate; also ties to timezones and proleptic Gregorian only |
| Temporal `PlainDate` | ±10^8 days from 1970 | ≈ ±273,000 years | Same order as `Date`; fine for display cross-checks, not as the core |
| Typical JDN libraries (floating `Number`) | as `Number`, often with fractional JD | — | Fraction loses integer-ness beyond 2^52 |
| `BigInt` | bounded only by memory (V8: ~10^9 bits) | effectively unbounded | **Chosen** (ADR-002) |

Design consequences:

1. The core's types are `BigInt`. Inputs arrive as decimal strings or `BigInt`; `Number`
   inputs are accepted only if `Number.isSafeInteger` holds.
2. The display layer converts to `Number` only when `|value| ≤ 2^53 − 1`; otherwise it formats
   the `BigInt` as a digit string with separators.
3. Unboundedness is **conceptual**: the system computes any index the user can type (the UI
   caps input at, say, 40 digits purely for layout), and no table of Sabbaths is ever stored.
   The finite machine limit (memory, digit count) is documented, not hidden.
4. Calendar adapters have their own, far narrower validity ranges (doc 07). A `BigInt`
   Sabbath index far outside them is still exact as a Sabbath index; only the civil label is
   UNSUPPORTED.

## 6. Invariants (the formal acceptance contract)

| ID | Invariant | Scope |
|---|---|---|
| I1 | `SabbathJDN(1) = 1733205` | — |
| I2 | `SabbathJDN(n+1) − SabbathJDN(n) = 7` | ∀ n ∈ ℤ |
| I3 | `SabbathJDN(n) − SabbathJDN(n−1) = 7` | ∀ n ∈ ℤ |
| I4 | `SabbathIndex(SabbathJDN(n)) = n` | ∀ n ∈ ℤ |
| I5 | `Cycle(SabbathJDN(n)) = n` and `Cycle(J)` partitions ℤ into consecutive 7-day blocks | ∀ n, J ∈ ℤ |
| I6 | `DoW(SabbathJDN(n)) = 5` (Saturday) | ∀ n ∈ ℤ |
| I7 | `PrevSabbath(J) ≤ J ≤ NextSabbath(J)`, `NextSabbath(J) − PrevSabbath(J) ∈ {0, 7}` | ∀ J ∈ ℤ |
| I8 | For every calendar adapter C with `support(J) ≠ UNSUPPORTED`: `C.toJdn(C.fromJdn(J)) = J` | ∀ J in C's math range |

I1–I7 are theorems within the model; the tests exist to catch implementation errors
(sign handling, type coercion), not to establish truth. I8 is per-adapter.

## 7. What the mathematics does not claim

- It does not claim that people observed a Sabbath on every day `SabbathJDN(n)` for `n ≤ 0`.
  Backward projection of a cycle is arithmetic; observance is history (doc 08 §6).
- It does not claim that a "day" far outside recorded history had the same length or that a
  proleptic calendar label for it is meaningful. Labels are **[CONVENTION]**; the count is exact.
- It does not fix a first or last index.

## 8. References

- Richards, E. G., "Calendars", in *Explanatory Supplement to the Astronomical Almanac*, 3rd ed. (Urban & Seidelmann, eds.), 2013, ch. 15 — JDN algorithms of the form used in the baseline.
- Meeus, J., *Astronomical Algorithms*, 2nd ed., 1998, ch. 7 — Julian Day, day of week.
- Dershowitz, N. & Reingold, E. M., *Calendrical Calculations: The Ultimate Edition*, 2018 — fixed-day (R.D.) arithmetic; R.D. = JDN − 1,721,425.
- ECMA-262, BigInt semantics (truncating division) — https://tc39.es/ecma262/#sec-numeric-types-bigint-divide
