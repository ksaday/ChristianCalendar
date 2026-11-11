# 11 — UI/UX Wireframes and Interaction Model

Starting point: the owner's concept drawing — parallel horizontal timelines (Sabbath, Jewish,
Gregorian, Chinese history, calculated eclipses, observed eclipses) crossed by a vertical
cursor, with Sabbath #1 marked by a cross and labels such as "Sabbath #−1", "Sabbath #1",
"Sabbath #104,017", "10/3/2026".

## 1. Design principles

1. **One cursor, many rows.** The vertical cursor line is the only thing the user moves; every
   row re-labels itself. No row has its own scroll position.
2. **The Sabbath row is on top and visually primary** (gold, as the baseline's seal). Calendar
   rows are secondary; the marker row is tertiary.
3. **Certainty is always visible** on every date label (badge style), never hidden in a tooltip only.
4. **Negative and BCE are ordinary.** No mode switch; "#−1" and "19 Mar 33 BC" are just labels.
5. **Distance is cheap.** Jumping a trillion cycles is one input; the UI never animates through
   intermediate weeks beyond a short easing within the current viewport.
6. **Continuity with the baseline's look:** parchment background, gold Sabbath seal, wine
   milestone, olive "today", the seven-link chain motif as the zoom ladder's decoration.

## 2. Desktop wireframe (≥ 1024 px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  THE SABBATH CALENDAR            [Go to ▾]  [Today]  [#1]   Zoom: day · week · year · 10y · 100y · 1000y · 10^k  │
│  one unbroken seven-day cycle                                                 Era: AD/BC ▾  Rows ▾  Integrity ✓ │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                           ▼ CURSOR                                                              │
│  SABBATH   ◄──┼────┼────┼────┼────┼────┼──╂──┼────┼────┼────┼────┼────┼────┼────┼────┼──►   [EXACT]      │
│            #104,010  …   #104,015   #104,016 ┃#104,017   #104,018   …              #104,025                      │
│                                     (cycle shaded Sun→Sat around the cursor)                                    │
│  JULIAN    ◄──┼─────────┼─────────┼──────────╂─────────┼─────────┼─────────┼─────────┼──►   [EXACT→1582, then CONVENTIONAL] │
│                 Aug 1582? no— e.g.  Sep 1 2026┃ 20 Sep 2026 (Julian)      Oct 1 2026                               │
│  GREGORIAN ◄──┼─────────┼─────────┼──────────╂─────────┼─────────┼─────────┼─────────┼──►   [EXACT]      │
│                 Sep 2026            Oct 1 2026┃ Sat 3 Oct 2026                          Nov 1 2026                 │
│  HEBREW    ◄──┼─────────┼─────────┼──────────╂─────────┼─────────┼─────────┼─────────┼──►   [EXACT]      │
│                 Elul 5786        1 Tishri 5787┃ 22 Tishri 5787                      1 Cheshvan 5787                │
│  CHINESE   ◄──┼─────────┼─────────┼──────────╂─────────┼─────────┼─────────┼─────────┼──►   [EXACT]      │
│                 month 8 丙午      month 9 (1st)┃ 23rd day, month 8 丙午    …                                      │
│  MARKERS   ───────────────────────────────────╂──────── ● today (11 Nov 2026) ─────────────────────────────────  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ CURSOR CARD                                   │ CYCLE #104,017  (Sun 27 Sep → Sat 3 Oct 2026)                   │
│ Sabbath #104,017   · Saturday · position 7/7  │  Sun 27 │ Mon 28 │ Tue 29 │ Wed 30 │ Thu 1 │ Fri 2 │ ★ Sat 3 │   │
│ JDN 2,461,317 · 728,112 days since #1         │  JDN …  │ …      │ …      │ …      │ …     │ …     │ #104,017 │   │
│ Julian   20 Sep 2026            [EXACT]       │  (each day cell: JDN, Julian, Gregorian, Hebrew, Chinese)        │
│ Gregorian 3 Oct 2026            [EXACT]       │  ◄ prev cycle                                     next cycle ►   │
│ Hebrew   22 Tishri 5787 (Shemini Atzeret) [EXACT]  note: Hebrew day began at sunset 2 Oct                        │
│ Chinese  丙午 year, month 8, day 23   [EXACT] │                                                                   │
│ Weeks since #1: 104,016  · Years ≈ 1,993.4    │                                                                   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
Legend: ■ EXACT  □ CONVENTIONAL (proleptic/calculated)  ▨ APPROXIMATE (reconstruction)  — UNSUPPORTED  ◇ tradition marker (interpretation)
```

(The sample Hebrew and Chinese labels above are illustrative placeholders for layout; the
implementation derives them from the adapters.)

## 3. Far-past view (same layout, zoom = 1000 years, cursor at Sabbath #−210,562)

```
│  SABBATH   ◄─┼──────┼──────┼──────┼──────╂──────┼──────┼──────┼──────┼──►  [EXACT — projection of the cycle]   │
│         #−230,000  #−220,000     #−210,562 ┃  #−200,000     #−190,000                                              │
│  JULIAN    ◄─┼──────┼──────┼──────┼──────╂──────┼──────┼──────┼──────┼──►  [CONVENTIONAL — proleptic]          │
│          4400 BC   4200 BC        4004 BC  ┃   3800 BC        3600 BC                                               │
│  GREGORIAN ◄─┼──────┼──────┼──────┼──────╂──────┼──────┼──────┼──────┼──►  [CONVENTIONAL — proleptic]          │
│  HEBREW    ──────────────────────────────  ┃ ───── AM 1 (3761 BC) ▸ CONVENTIONAL (proleptic calculated) ──────── │
│            — UNSUPPORTED before AM 1 —     ┃                                                                        │
│  CHINESE   ──────────── UNSUPPORTED before 1645 CE (no defensible reconstruction in MVP) ─────────────────────── │
│  MARKERS   ◇ Ussher Creation week (tradition)  ◇ Hebrew AM epoch (convention)   ◆ JDN 0 (4713 BC)                │
```

Rows that are UNSUPPORTED across the whole viewport collapse to a single grey line with the
reason; they never disappear, so the user always sees *why* there is no date.

## 4. Mobile wireframe (≤ 480 px)

```
┌──────────────────────────────┐
│ ≡  Sabbath Calendar   [Go ▾] │
├──────────────────────────────┤
│ zoom: ◂ week ▸     today  #1 │
├──────────────────────────────┤
│ SABBATH   ◄─┼──┼──╂──┼──┼──► │
│          #104,016 ┃#104,017   │
│ GREG.     ◄─┼──┼──╂──┼──┼──► │
│             Oct 1 ┃ Oct 3     │
│ JULIAN    (tap to expand)     │
│ HEBREW    (tap to expand)     │
│ CHINESE   (tap to expand)     │
├──────────────────────────────┤
│ ★ Sabbath #104,017  [EXACT]  │
│ Sat 3 Oct 2026 (Greg.)        │
│ 20 Sep 2026 (Julian) [EXACT]  │
│ 22 Tishri 5787       [EXACT]  │
│ 丙午 8/23            [EXACT]  │
│ JDN 2,461,317                 │
│ [ cycle view ]  [ share link ]│
└──────────────────────────────┘
gestures: drag = pan · pinch = zoom · double-tap = zoom in · long-press tick = set cursor
```

Rows beyond the first two are collapsed by default on phones; the cursor card lists every
calendar regardless.

## 5. Go-to dialog

```
┌─ Go to ───────────────────────────────────────────┐
│ ( ) Sabbath number   [ −210562            ]       │
│ ( ) JDN              [                    ]       │
│ ( ) Gregorian date   [ 4004 ] [BC▾] [Oct▾] [ 23 ] │
│ ( ) Julian date      [    ] [AD▾] [   ▾] [    ]   │
│ ( ) Hebrew date      [ AM 5787 ] [Tishri▾] [ 22 ] │
│ ( ) Chinese date     [ 2026 ] [ 8 ▾] [ ] leap [23]│
│ Preview: Sat 29 Oct 4004 BC (Julian) · JDN 259,264 · Sabbath #−210,562 · Gregorian label CONVENTIONAL │
│                                        [Cancel] [Go] │
└───────────────────────────────────────────────────┘
```

Inputs accept at least 40 signed digits for number/JDN fields. The preview resolves the
input through the adapter and shows the certainty before the jump. Unsupported inputs
(e.g. a Chinese date in 1200 CE) show "unsupported in this calendar: <reason>" and disable Go.

## 6. Interaction model

| Action | Effect |
|---|---|
| Drag / wheel horizontally / ← → | Pan by viewport fraction; cursor stays centered (the line is fixed, the rows slide) |
| Shift + ← / → | Move cursor exactly one Sabbath (7 days) |
| Alt + ← / → | Move cursor one day |
| + / − / pinch / wheel with Ctrl | Zoom ladder step; the day under the cursor stays fixed |
| Click/tap a tick | Set cursor to that tick's JDN |
| Home / "#1" button | Cursor to Sabbath #1 |
| T / "Today" | Cursor to today (browser local date) |
| G / "Go to" | Dialog (§5) |
| C | Toggle cycle view |
| Shift + S | Copy link (URL hash) |
| Hover a label | Tooltip: full date in all calendars, astronomical year, certainty reason, source id |

Zoom ladder and what each row shows:

| Zoom | Viewport span | Sabbath row ticks | Calendar rows |
|---|---|---|---|
| day | ~3 weeks | every day, Sabbath highlighted | every day label |
| week | ~26 weeks | every Sabbath with number | month boundaries |
| month | ~2 years | every 4th Sabbath, numbers at month starts | month boundaries |
| year | ~20 years | every 52nd (anniversary Sabbaths ✦ marked) | year boundaries |
| decade | ~200 years | every 520th; milestones ▣ | decades |
| century | ~2,000 years | every 1,000th (milestone) | centuries; reform/era markers |
| millennium | ~20,000 years | every 10,000th | millennia |
| 10^k years | 10^(k+1) years | every 10^(k+1)·52nd approx., numbers in scientific or grouped form | labels switch to "≈ N years before #1" when calendars are UNSUPPORTED |

## 7. Edge-case presentations

| Case | Display |
|---|---|
| Sabbath #0 | "#0" with the same grey "pre" seal the baseline uses for n ≤ 0 |
| The anchor in the Gregorian row | "2 Apr AD 33 (proleptic Gregorian)"; in the Julian row "4 Apr AD 33 ✦ #1" |
| 1582 reform | Gregorian row shows a gap mark between 4 Oct (Julian label shown greyed) and 15 Oct; Sabbath row continuous; tooltip explains |
| Year 0 | never printed; "1 BC" then "AD 1" |
| Hebrew date for AD 33 | shown with □ CONVENTIONAL badge and the note "calculated; observed date that year may differ" |
| Chinese date in AD 33 | "— unsupported before 1645 CE (no reconstruction in this version)" |
| |n| > 10^15 | number shown grouped; calendar rows UNSUPPORTED with "label outside declared range"; Sabbath row still exact |
| Today when today is a Saturday | cursor card header "Today is Sabbath #N" (baseline countdown wording) |

## 8. Accessibility

- Each row is an SVG `<g role="list">` with ticks as `<g role="listitem" aria-label="Sabbath number 104,017, Saturday 3 October 2026">`.
- Cursor card is `aria-live="polite"`.
- Certainty badges carry text, not only color/shape.
- Full keyboard operation per §6; focus ring on ticks.

## 9. Requirements realized here

REQ-UI-01…16, REQ-COMPAT-01 (COMPAT-06/07/08/09/11/12/14).
