# 18 — Phase 5 addendum: civil date by region (5.4) and the early Julian calendar (5.7)

Approved by the owner on 2026-11-13 ("5.4 and 5.7 go ahead"). The chronology core and the
existing Julian and Gregorian adapters are unchanged; both items are delivered as one new
adapter, `calendars/civil.js`, that answers a different question from those rows:
**how was this day written in a given place at the time?**

## 1. What the rows mean now

| Row | Question it answers | Certainty |
|---|---|---|
| Julian (unchanged) | The proleptic Julian label of the day, with the regular 4-year rule everywhere | as before |
| Gregorian (unchanged) | The proleptic Gregorian label; EXACT from the Roman reform of 15 Oct 1582 | as before |
| **Civil · ⟨region⟩** (new) | The date as written in that region: the Roman Julian calendar as reconstructed for 45 BC – AD 8, then Julian (or the Swedish calendar), then Gregorian from the region's own switch | per segment, below |

Because every day is still one JDN, the seven-day cycle runs straight through every switch: the
civil row only changes the label. Every adoption in the table keeps the weekday sequence
(Thursday 4 October → Friday 15 October 1582; Wednesday 2 September → Thursday 14 September 1752).

## 2. Segments of the civil row (per region)

| Segment | Label | Certainty |
|---|---|---|
| before Roman 1 Jan 45 BC | none: the pre-Julian Roman republican calendar is not modeled | UNSUPPORTED |
| 45 BC until the reconstruction realigns with the proleptic Julian calendar (1 BC or AD 4) | Roman date by the chosen reconstruction, with the leap day as a doubled 24 February ("24 February (bis)") | APPROXIMATE |
| until the region's last Julian day | Julian date; England, Wales, Ireland and the colonies show dual years for 1 January – 24 March of 1156–1751 ("10 February 1750/51", legal year from 25 March), Scotland until 1599; Sweden 1700–1712 shows the Swedish calendar | EXACT |
| from the region's first Gregorian day | Gregorian date | EXACT |
| regions whose previous calendar was not Julian (Egypt, Japan, Korea, China) | before their switch: none, with the calendar they used named | UNSUPPORTED |

The model does not say when a region began to use the Julian calendar; the Julian segments
describe the calendar in civil use in Rome and the Christian West, which each region inherited.

## 3. Early Julian calendar (5.7)

The pontiffs inserted a leap day every third year (inclusive counting) after 45 BC until
Augustus suspended intercalation; reconstructions differ on which years. Nine are shipped,
from Wikipedia "Julian calendar" (retrieved 2026-11-13), each as its list of leap years and the
year regular leap years resumed:

| Reconstruction | Leap years (BC) | Resumes | Roman 1 Jan 45 BC = proleptic | First aligned day |
|---|---|---|---|---|
| Bennett (2003) — default | 44, 41, …, 11, 8 | AD 4 | 31 Dec 46 BC | 25 Feb 1 BC |
| Soltau (1889) | 45, 41, 38, …, 11 | AD 8 | 2 Jan 45 BC | 25 Feb AD 4 |
| Matzat (1883) | 44, 41, …, 11 | AD 4 | 1 Jan 45 BC | 25 Feb 1 BC |
| Ideler (1825) | 45, 42, …, 9 | AD 8 | 1 Jan 45 BC | 25 Feb AD 4 |
| Kepler (1614) | 43, 40, …, 10 | AD 8 | 2 Jan 45 BC | 25 Feb AD 4 |
| Harriot (after 1610) | 43, 40, …, 10 | AD 4 | 1 Jan 45 BC | 25 Feb 1 BC |
| Bünting (1590) | 45, 42, …, 12 | AD 4 | 1 Jan 45 BC | 25 Feb 1 BC |
| Christmann (1590) | 43, 40, …, 10 | AD 7 | 2 Jan 45 BC | 25 Feb AD 4 |
| Scaliger (1583) | 42, 39, …, 9 | AD 8 | 2 Jan 45 BC | 25 Feb AD 4 |

The last two columns are the source's own results; the implementation computes them from the
first two (anchoring Roman and proleptic dates at AD 12 and counting back) and the tests require
all 18 values to come out exactly. Bennett is the default only because it is the most recent; the
source names no consensus, and the cursor card lists all nine for any day in the period.
Sabbath #1 (AD 33) is after every reconstruction has realigned, so its civil label is
"4 April AD 33" under all of them.

## 4. Regions

30 regions (26 that switched from the Julian calendar, 4 from other calendars) from Wikipedia "List of adoption dates of the Gregorian calendar by country" and
"Adoption of the Gregorian calendar" (retrieved 2026-11-13), and "Old Style and New Style dates"
for the year start. Each entry stores the last old-calendar date and the first Gregorian date as
the source prints them; a test rebuilds the second from the first. Default region: Rome
(Papal States), which matches the Gregorian row's existing EXACT boundary.

Not modeled, recorded in doc 14: local date-line changes (the Philippines skipped 31 December 1844;
Alaska repeated a Friday in October 1867), which change a place's local weekday name without
affecting the Greenwich-referenced day count; regions that switched more than once (several
Swiss and Dutch provinces, Prussia's contested 1610/1612 date); the Ottoman Rumi calendar.

## 5. Tests

| ID | Check |
|---|---|
| T-CIV-01 | All nine reconstructions reproduce the source's "Roman 1 Jan 45 BC" and "first aligned day" (18 values) |
| T-CIV-02 | Every Julian-to-Gregorian region: the day after its last Julian date carries its stated first Gregorian date; stated weekdays hold |
| T-CIV-03 | Great Britain: 2 Sep 1752 is followed by 14 Sep; 3–13 Sep 1752 have no JDN; 10 Feb 1751 (Jan-year) reads "1750/51"; 1752 has no dual year |
| T-CIV-04 | Sweden: 1 Mar 1700 follows 28 Feb; 30 February 1712 exists and is Julian 29 Feb 1712; 17 Feb → 1 Mar 1753 |
| T-CIV-05 | Adapter contract; fromJdn/toJdn round trip on every day 1690–1760 and 46 BC – AD 12 and 20,000 random days, for five regions |
| T-CIV-06 | Rome equals the Julian adapter from realignment to 4 Oct 1582 and the Gregorian adapter after; Japan before 1873 is UNSUPPORTED with the calendar named |
| T-UI-19, 20 | Civil row in Great Britain at day zoom shows 2 followed by 14 September 1752; the cursor card in 12 BC lists all nine reconstructions |

## 6. Results (2026-11-13)

| Check | Result |
|---|---|
| Early Julian reconstructions | 18 of 18 published checkpoints reproduced |
| Regions | 30; every printed switch pair consistent; stated weekdays hold |
| Node suite | 100/100 in three timezones |
| `npm run check:browser` | ui-smoke 18/18, axe-core 0 violations |
