# 10 — Data Model and Interfaces

Notation is TypeScript-style for precision; the implementation is JavaScript with JSDoc.

## 1. Core types

```ts
type Jdn = bigint;                 // integer civil-day label
type SabbathIndex = bigint;
type CycleIndex = bigint;          // == index of the Sabbath that ends the cycle
type DayOfWeek = 0|1|2|3|4|5|6;    // Mon..Sun  (baseline convention)
type CyclePosition = 1|2|3|4|5|6|7;// Sun..Sat  (7 = Sabbath)

interface DayDescriptor {
  jdn: Jdn;
  dayOfWeek: DayOfWeek;
  isSabbath: boolean;
  sabbathIndex: SabbathIndex | null;   // null when !isSabbath
  cycle: CycleIndex;
  positionInCycle: CyclePosition;
  cycleFirst: Jdn;                      // Sunday
  cycleLast: Jdn;                       // Saturday == sabbathJdn(cycle)
  previousSabbath: Jdn;                 // <= jdn
  nextSabbath: Jdn;                     // >= jdn
  daysSinceAnchor: bigint;              // jdn - 1733205n
}

type IntegerInput = bigint | number | string;
class ChronologyInputError extends Error {}
```

## 2. Calendar types

```ts
type Certainty = 'EXACT' | 'CONVENTIONAL' | 'APPROXIMATE' | 'UNSUPPORTED';

interface Support { certainty: Certainty; reason: string; sourceId: string; }

interface CalendarDate {
  calendarId: string;
  year: bigint;                 // astronomical for gregorian/julian; AM for hebrew; cyclical+epoch-based for chinese (see §4)
  month: number;                // 1-based; hebrew: 1 = Nisan .. 13; chinese: 1..12
  day: number;
  leapMonth?: boolean;          // hebrew: Adar I vs II is encoded as month 12/13; chinese: true for 閏 month
  era?: { name: string; yearInEra: bigint };   // 'BC'/'AD', 'AM', '干支' …
  extras?: Record<string, string | number | boolean>;  // e.g. hebrew yearType, chinese sexagenary names
}

type Unsupported = { unsupported: true; reason: string };

interface FieldSpec { key: 'year'|'month'|'day'|'leapMonth'; label: string; min?: number; max?: number | ((d: Partial<CalendarDate>) => number); }

interface CalendarAdapter {
  readonly id: string;
  readonly name: string;
  readonly variant: string;
  readonly mathRange: { minJdn: Jdn; maxJdn: Jdn };
  readonly fields: FieldSpec[];
  fromJdn(j: Jdn): CalendarDate | Unsupported;
  toJdn(d: CalendarDate): Jdn | Unsupported;
  support(j: Jdn): Support;
  format(d: CalendarDate, opts?: { era?: 'BC/AD'|'BCE/CE'; locale?: string }): string;
  nextBoundary(j: Jdn, unit: 'month'|'year'): Jdn | Unsupported;  // for tick planning; arithmetic, not scanning
  isLeapYear?(year: bigint): boolean;
}
```

Invariant per adapter (I8): for all `j` with `support(j).certainty !== 'UNSUPPORTED'`,
`toJdn(fromJdn(j)) === j`.

## 3. Gregorian / Julian date fields

- `year` is astronomical (0 = 1 BC). `era` is filled by `format`: `{name: 'BC', yearInEra: 1n - year}` for `year <= 0`.
- `month` 1–12, `day` 1–31.
- `nextBoundary(j, 'month')` is computed from `fromJdn(j)` and `toJdn({year, month+1, 1})`; O(1).

## 4. Hebrew date fields

- `year` = AM year (≥ 1). `month`: 1 = Nisan … 6 = Elul, 7 = Tishri … 12 = Adar (or Adar I in leap years), 13 = Adar II. (This is Dershowitz–Reingold's numbering; display shows names.)
- `extras.yearType ∈ {'deficient','regular','complete'}`, `extras.isLeapYear`.
- `support`: EXACT ≥ JDN of 1 Tishri AM 4683 (922 CE); CONVENTIONAL for 359 CE ≤ j < 922 CE and for j < 359 CE ("proleptic calculated; observed date may differ"); UNSUPPORTED below AM 1 or above AM 10,000.

## 5. Chinese date fields

- `year`: the system stores the **Gregorian year in which the Chinese year began** plus `extras.cycle` (60-year cycle number per the common 2637 BC epoch convention — labeled **[CONVENTION]**, since the Chinese calendar has no canonical epoch) and `extras.stemBranch` (干支 name). The stem–branch name is EXACT for any year; the cycle number is a convention.
- `month` 1–12 with `leapMonth` flag; `day` 1–30.
- `extras.newMoonMarginMinutes`: minutes between the month's new moon and the local midnight; when |margin| < 30 the day's `support` is downgraded to APPROXIMATE.
- `support`: EXACT 1929–2100; APPROXIMATE 1645–1928, 2101–2200; UNSUPPORTED otherwise (MVP).

## 6. Timeline model

```ts
type ZoomLevel = 'day' | 'week' | 'month' | 'year' | 'decade' | 'century' | 'millennium' | 'myriad' | 'exp';  // 'exp' carries a power k: 10^k years
interface Viewport { start: Jdn; end: Jdn; pxPerDay: number /* may be < 1e-9 */; }
interface Tick { jdn: Jdn; label: string; weight: 'major'|'minor'; certainty?: Certainty; }
interface RowSpec { id: string; kind: 'sabbath'|'calendar'|'markers'; adapterId?: string; enabled: boolean; }
interface Marker { id: string; jdn: Jdn; label: string; kind: 'reference'|'tradition'|'event'; certainty: Certainty | 'INTERPRETATION'; source?: string; }

interface AppState {
  cursorJdn: Jdn;
  zoom: ZoomLevel; zoomExp?: number;
  rows: RowSpec[];
  options: { era: 'BC/AD'|'BCE/CE'; showTraditionMarkers: boolean; showReligiousBoundaryNote: boolean };
}
```

Built-in reference markers (REQ-UI-10), all EXACT or CONVENTIONAL:

| id | JDN | label | certainty |
|---|---|---|---|
| sabbath-1 | 1,733,205 | Sabbath #1 — Sat 4 Apr AD 33 (Julian) | EXACT |
| sabbath-0 | 1,733,198 | Sabbath #0 | EXACT |
| reform-1582 | 2,299,161 | Gregorian reform (Rome): Thu 4 Oct → Fri 15 Oct 1582 | EXACT |
| year-1 | 1,721,424 (Julian 1 Jan AD 1) / 1,721,426 (Gregorian 1 Jan AD 1) | 1 BC → AD 1 (no year 0) | CONVENTIONAL |
| jdn-0 | 0 | JDN 0 — Mon 1 Jan 4713 BC (Julian) | CONVENTIONAL |
| today | from the browser clock, computed in the UI layer only | Today | EXACT |

## 7. Serialization

- URL hash: `#j=<decimal jdn>&z=<zoom>[&e=<k>]`, e.g. `#j=2461142&z=week`. Decimal strings, never `Number`.
- Optional `localStorage`: `{rows, options}` only; never the cursor (links are the cursor).
- Reference vectors (tests): JSON with string integers: `{"jdn":"1733205","gregorian":{"year":"33","month":4,"day":2}, "source":"…","retrieved":"2026-11-11"}`.

## 8. Presentation helpers (ported from baseline)

| Helper | Behavior |
|---|---|
| `fmtInt(bigint)` | thousands separators, U+2212 for negatives (baseline `fmt`) |
| `ordinal(n)` | 1st/2nd/3rd/Nth; defined only for n ≥ 1 (baseline usage) |
| `eraLabel(year, style)` | "AD 33" / "33 CE"; "1 BC" / "1 BCE"; never "0" |
| `anniversary(j)` | baseline rule: first Saturday on/after Gregorian 4 April; year 33 → anchor; returns `yearsSince33 ≥ 1`, `0` for the anchor, or `null` |
| `milestone(n)` | `n ≥ 1 && n % 1000 == 0` |

## 9. Requirements realized here

REQ-CORE-05/06/14, REQ-CAL-01…04, REQ-UI-10/16, REQ-COMPAT-01 (COMPAT-07/08/10/12).
