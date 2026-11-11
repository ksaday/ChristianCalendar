# 02 — Existing Project Analysis

**Repository:** https://github.com/ksaday/ChristianCalendar.git
**Commit examined:** `6229702` ("Add files via upload", 2026-07-21)
**Files:** `README.md` (81 lines), `index.html` (100), `css/style.css` (491), `js/calendar.js` (326)
**Build/runtime:** none; static files; one IIFE; no modules, no dependencies, no tests beyond a page-load self-check.

## 1. The chronology engine as it exists

All logic is in `js/calendar.js`. The relevant parts, by line:

| Lines | Function | Role | Verdict |
|---|---|---|---|
| 11 | `ANCHOR_JDN = 1733205` | The axiom | **Preserve verbatim** |
| 15–21 | `jdnFromGregorian(y,m,d)` | Proleptic Gregorian → JDN (Fliegel–Van Flandern / Richards form, floor-based) | **Correct; reuse as oracle** |
| 23–35 | `gregFromJdn(j)` | JDN → proleptic Gregorian, floor-based | **Correct for negative JDN too; reuse as oracle** |
| 37 | `dow(j) = ((j % 7) + 7) % 7` | 0 = Monday … 5 = Saturday, 6 = Sunday | **Correct and sign-safe; preserve convention** |
| 38 | `isSabbath(j)` | `dow(j) === 5` | **Preserve** |
| 39 | `sabbathNumber(j) = (j − ANCHOR)/7 + 1` | Sabbath number of a Saturday | **Correct on Saturdays; returns a non-integer on other days (see §3.3)** |
| 41–47 | `daysInMonth` | Gregorian leap rule | Correct |
| 68–80 | `annivJdnOfYear`, `annivInfo` | Anniversary Sabbath: first Saturday on/after proleptic-Gregorian 4 April; year 33 special-cased to the anchor | **Preserve behavior exactly** |
| 162, 236 | milestone rule | `sn ≥ 1 && sn % 1000 === 0` | Preserve |
| 237 | `sealCls = sn < 1 ? ' pre' : …` | **Already styles Sabbaths with number ≤ 0** | Important: baseline already displays #0 and negatives |
| 282 | `clampY(y)`: 33…3000 | Navigation limit | The main limitation to lift |
| 307–323 | `selfCheck()` | 11 Apr 2026 → 2,461,142 → #103,992; anchor → #1 | **Becomes regression test T-REG-01/02** |

### 1.1 Independent re-verification performed for this analysis

A Node script (not part of the repository) re-implemented a Julian-calendar→JDN routine
independently and ran the original functions unmodified. Results:

| Check | Result |
|---|---|
| Julian 4 Apr AD 33 → JDN | 1,733,205 ✓ |
| Proleptic Gregorian 2 Apr AD 33 → JDN | 1,733,205 ✓ |
| JDN 1,733,205 day of week | Saturday ✓ (also via the independent `(JDN+1) mod 7` Sunday-based form) |
| 2026-04-11 → JDN → Sabbath # | 2,461,142 → #103,992 ✓ |
| 2026-10-03 (concept drawing) | #104,017 ✓ |
| 2000-01-01 | JDN 2,451,545, Saturday ✓ (well-known value) |
| `gregFromJdn` ∘ `jdnFromGregorian` round trip, every JDN in [−3,000,000, +3,000,000] | 6,000,001 tested, **0 mismatches**; all months 1–12, days 1–31 |

The negative range matters: JDN −3,000,000 is about 12,900 BC. The original conversion
algorithm, as written, is already valid across BCE years and negative JDNs when fed
astronomical year numbers (year 0 = 1 BC, −1 = 2 BC). Only the UI prevents reaching them.

### 1.2 Latent negative numbering in the baseline

With the year input at its minimum (33), the January, February and March views show
Saturdays numbered #−12 through #0 (e.g. proleptic-Gregorian 1 Jan AD 33 is Saturday,
JDN 1,733,114, Sabbath #−12). The code anticipates this with the `pre` seal style. The
baseline therefore already embodies the formula's behavior below 1, including Sabbath #0.
Any "renumbering" of early Sabbaths would be a regression against the baseline.

## 2. Baseline behavior that must be preserved (compatibility contract)

| ID | Behavior | Evidence in baseline |
|---|---|---|
| COMPAT-01 | `ANCHOR_JDN = 1733205` | line 11 |
| COMPAT-02 | `SabbathNumber(JDN) = (JDN − 1733205)/7 + 1` for Saturdays | line 39 |
| COMPAT-03 | Saturday ⇔ `JDN mod 7 = 5` (floor modulo) | lines 37–38 |
| COMPAT-04 | Proleptic Gregorian↔JDN as implemented (floor-based) | lines 15–35 |
| COMPAT-05 | 11 Apr 2026 = JDN 2,461,142 = #103,992 | self-check |
| COMPAT-06 | Anchor displays as 2 April in the proleptic-Gregorian year-33 view, marked "✦ #1" | README, line 69 |
| COMPAT-07 | Anniversary Sabbath = first Saturday on/after Greg. 4 April; year 33 → anchor; label "Nth year since the Resurrection week" | lines 68–80 |
| COMPAT-08 | Milestone = every 1,000th Sabbath, n ≥ 1 | lines 162, 236 |
| COMPAT-09 | Sabbaths with n ≤ 0 are displayed (grey "pre" seal), not hidden or renumbered | line 237 |
| COMPAT-10 | Popover fields: Sabbath number, JDN, days since anchor, weeks since anchor | lines 169–175 |
| COMPAT-11 | Countdown: next Sabbath number, date, "begins at sunset on Friday" phrasing | lines 119–143 |
| COMPAT-12 | Number formatting: thousands separators, U+2212 minus sign | lines 49–54 |
| COMPAT-13 | Dates before 15 Oct 1582 shown in proleptic Gregorian, with that stated in the footer | README, footer |
| COMPAT-14 | Day columns Sunday-first with "Sabbath" as the seventh column header | line 103 |
| COMPAT-15 | Self-check result shown in the footer | lines 307–323 |

## 3. Limitations identified

### 3.1 Navigation range
`clampY` restricts years to 33–3000 and the input element to `min=33 max=3000`. Nothing in
the math requires this. Lifting it is the central functional extension.

### 3.2 Numeric type
All arithmetic is in JavaScript `Number`. Integers are exact only up to 2^53 − 1
= 9,007,199,254,740,991 days ≈ 2.47 × 10^13 years, i.e. Sabbath numbers up to about
±1.29 × 10^15. That is far beyond any historical or astronomical need, but it is a ceiling,
and the owner's requirement is an arithmetic contract with no ceiling. Intermediate products
in the conversion formulas (`4 × a`, `146097 × b`) reach the ceiling earlier, at JDN ≈ 2.25 × 10^15.

### 3.3 No cycle assignment for ordinary days
`sabbathNumber(j)` on a non-Saturday yields a fraction (e.g. today, 11 Nov 2026 → 104,022.571).
The baseline never calls it on such days, so there is no bug, but there is also no concept of
"which seven-day cycle does Tuesday belong to". The new engine needs a defined, documented
cycle convention (ADR-003).

### 3.4 Calendar representation
Only proleptic Gregorian is rendered. There is no Julian display, so the anchor appears as
"April 2" in its own year, which the README must explain. There is no BCE labeling: a year
≤ 0 would print as "0" or a negative number. There are no Hebrew or Chinese representations.

### 3.5 Religious boundary conflated in text
The countdown says the Sabbath "begins at sunset on Friday". That is a religious observance
statement, location-dependent, while the numbering is a civil-day statement. The new design
keeps the phrase (COMPAT-11) but separates the two concepts architecturally (ADR-004).

### 3.6 Structure and testability
One IIFE, DOM access interleaved with math, no module boundaries, no automated tests, no
property tests, the self-check runs only in a browser. The math cannot be imported by
another program without copying it.

### 3.7 Minor observations (no action required for compatibility)
- `ord()` is only called with positive anniversary years; it would mis-suffix negatives.
- `annivInfo` hardcodes the window 2 ≤ day ≤ 10 for April; correct for the rule as stated.
- "Today" is taken from the browser's local clock (`new Date()`), which is appropriate.
- `fmt` already renders negative numbers with a true minus sign; reuse the convention.

## 4. What can be reused

| Asset | Reuse |
|---|---|
| Anchor, formula, day-of-week convention | Verbatim, re-expressed in `BigInt` |
| Gregorian↔JDN algorithms | Port to `BigInt`; keep the `Number` originals as the test oracle within their safe range |
| Anniversary and milestone rules | Port as presentation rules in the Sabbath row |
| Visual language (`:root` tokens, gold seal, wine milestone, olive "today", parchment, chain motif) | Reuse the palette and iconography for continuity |
| Self-check idea | Becomes a visible "Integrity" panel backed by the full invariant suite |
| README's dating references | Carried into the references sections |

## 5. What must be extended

1. Arbitrary-precision integer core with floor-division semantics (04, 06).
2. Cycle assignment for every day; previous/next Sabbath; elapsed-week counts (06).
3. Julian calendar adapter and BCE/astronomical year handling (07).
4. Hebrew and Chinese adapters with validity ranges and certainty labels (07).
5. Timeline UI with unbounded navigation, direct jumps, zoom ladder (11).
6. Automated verification with property tests and independent reference vectors (12).

## 6. Recommendation on how to extend without breaking

Do not edit the original files. Create the second-generation application beside them
(`v2/`), with a pure Chronology Core module whose first test file imports the original
functions (copied verbatim into a test fixture, with provenance comment) and asserts
agreement across the original's entire supported range and beyond, wherever `Number`
is exact. Full comparison and rationale: `09-SYSTEM-ARCHITECTURE.md` and ADR-001.
