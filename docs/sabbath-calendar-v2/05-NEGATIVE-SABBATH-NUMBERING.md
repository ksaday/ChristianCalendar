# 05 — Negative Sabbath Numbering

## 1. Why negatives exist and why zero is kept

The baseline formula `SabbathNumber = (JDN − 1733205)/7 + 1` is an affine map on all of ℤ.
The Saturday seven days before the anchor is `(−7)/7 + 1 = 0`; the one before that is −1.
Skipping zero would require a piecewise formula and would violate the seven-day spacing
invariant between what would then be "#1" and "#−1" (a 14-day gap). The baseline already
renders #0 and #−1…#−12 in its own AD 33 views (doc 02 §1.2). Zero stays. **[AXIOM + PROOF]**

Consequence for language: the system says "Sabbath #0" and "Sabbath #−1" plainly. It does
not say "the first Sabbath before the anchor" for #0, because ordinal phrasing invites
off-by-one errors; the index is the name.

## 2. Worked table around the anchor

| Index n | JDN | Julian date | Proleptic Gregorian | Day |
|---|---|---|---|---|
| 3 | 1,733,219 | 18 Apr AD 33 | 16 Apr AD 33 | Sat |
| 2 | 1,733,212 | 11 Apr AD 33 | 9 Apr AD 33 | Sat |
| **1** | **1,733,205** | **4 Apr AD 33** | **2 Apr AD 33** | **Sat** |
| 0 | 1,733,198 | 28 Mar AD 33 | 26 Mar AD 33 | Sat |
| −1 | 1,733,191 | 21 Mar AD 33 | 19 Mar AD 33 | Sat |
| −2 | 1,733,184 | 14 Mar AD 33 | 12 Mar AD 33 | Sat |
| −12 | 1,733,114 | 3 Jan AD 33 | 1 Jan AD 33 | Sat |
| −13 | 1,733,107 | 27 Dec AD 32 | 25 Dec AD 32 | Sat |
| −1,000 | 1,726,198 | 27 Jan AD 14 | 25 Jan AD 14 | Sat |
| −100,000 | 1,033,198 | 28 Sep 1885 BC | 12 Sep 1885 BC | Sat |
| −247,599 | 5 | 6 Jan 4713 BC | 29 Nov 4714 BC | Sat (first Sabbath after JDN 0) |
| −289,099 | −290,495 | 1 Sep 5509 BC | 19 Jul 5509 BC | Sat (a negative JDN; happens to be the Byzantine Creation-era epoch day) |

All values computed by the formula and cross-checked with independent Julian and Gregorian
conversions (doc 02 §1.1). The Julian/Gregorian label difference is a label effect only: the proleptic Gregorian
label is 2 days *earlier* than the Julian label in AD 33, the two coincide from 1 March AD 200
to 28 February AD 300, and the Gregorian label is 13 days *later* today.

## 3. Three different "negatives" that must not be confused

| Quantity | Can be negative? | Meaning of the sign |
|---|---|---|
| Sabbath index `n` | Yes | Before the anchor cycle |
| JDN `J` | Yes, before 1 Jan 4713 BC (Julian) | Before the Julian Period epoch; purely conventional |
| Calendar year | Gregorian/Julian: astronomical year ≤ 0 means BC; Hebrew AM: never ≤ 0 within its own era | Era convention of each calendar |

The engine uses the first two freely. The third is a presentation matter (§5).

## 4. Floor semantics in negative territory (binding)

| Operation | Correct | Wrong (truncation) | Where it bites |
|---|---|---|---|
| `IsSabbath(J)` for `J = −290495` | `floorMod(−290495, 7) = 5` → Sabbath | `−290495 % 7 = −2` → "not Sabbath" | Any negative JDN |
| `Cycle(J)` for `J = A − 7` (Sabbath #0) | `floorDiv(−1, 7) + 1 = 0` | `trunc(−1/7) + 1 = 1` → wrongly assigned to cycle 1 | Every day in cycles ≤ 0 that is not itself 6 days before a Sabbath |
| `PrevSabbath(J)` with `J < A` | `J − floorMod(J − A, 7)` | sign error yields a day *after* J | All pre-anchor days |

Test T-CORE-11 enumerates these.

## 5. Presenting BCE dates

- Internally: astronomical year numbering (…, −1 = 2 BC, 0 = 1 BC, 1 = AD 1). **[CONVENTION]** standard in astronomy and in Dershowitz–Reingold.
- Display: "1 BC", "2 BC" (or BCE) with the astronomical year available on hover/in detail.
- There is no historical year 0; the display never prints "year 0" or "AD 0". The 1 BC → AD 1
  boundary is a reference marker on the timeline (REQ-UI-10).
- Both Julian and Gregorian rows show BCE dates; the Gregorian one is proleptic and labeled
  CONVENTIONAL before 15 Oct 1582, the Julian one CONVENTIONAL before 1 Jan 45 BC (the
  calendar's institution) and APPROXIMATE for 45 BC – AD 8 if the historical leap-day
  irregularities of that period are modeled (doc 07 §3).
- Negative Sabbath indices use a true minus sign (U+2212), as the baseline's `fmt` does.

## 6. Large magnitudes

- The UI accepts signed decimal input of at least 40 digits for Sabbath index and JDN.
- A jump to `n = −10^30` computes `J = A − 7·(10^30 + 1)` instantly; the Sabbath row shows the
  index, the cycle view shows seven days, and every calendar row shows UNSUPPORTED (even the
  proleptic Gregorian adapter is declared only to ±10^9 years; beyond that, year labels are
  computable but meaningless and are shown as "label outside declared range").
- The timeline's distance from the anchor is shown in cycles, days, and, where meaningful,
  years (`cycles × 7 / 365.2425`, labeled as a mean-Gregorian-year conversion).

## 7. Historical versus mathematical backward projection **[EVIDENCE / INTERPRETATION]**

Projecting the cycle backward from AD 33 is arithmetic. Whether a seven-day cycle was kept
without interruption before AD 33 is a historical question:

- Continuous observance from the first century to today is well attested: Jewish and
  Christian communities, independent of each other and often hostile, agree on which day is
  Saturday; the 1582 reform and all national adoptions preserved weekday succession.
- Second-Temple-period Sabbath observance is attested in Josephus, Maccabees, Qumran texts
  and Greco-Roman authors (e.g. Josephus, *Against Apion* 2.282; 1 Macc 2:32–41).
- Before the Babylonian exile the evidence thins to biblical texts and a few epigraphic
  mentions; the alignment of pre-exilic weeks to the modern Saturday cannot be independently
  verified day-by-day.
- Before Moses, Genesis presents the seventh day; no external record exists.

The system therefore shows negative Sabbath indices as **mathematical projections** of an
unbroken cycle and says so in the Sabbath row's legend. It never asserts that index
#−100,000 was observed.

## 8. Requirements realized here

REQ-AX-02, REQ-AX-03, REQ-CORE-03, REQ-CORE-06, REQ-UI-09, REQ-VER-01.
