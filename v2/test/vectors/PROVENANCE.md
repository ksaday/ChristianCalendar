# Reference vectors — provenance

Every external number used by the test suite is listed here with its source and retrieval date
(REQ-VER-04). Tests never fetch anything at run time; files below are checked in.

| File | Content | Source | Retrieved | Notes |
|---|---|---|---|---|
| `gregorian-julian.json` | 13 JDN ↔ proleptic Gregorian / Julian vectors with day of week | Meeus, *Astronomical Algorithms* 2nd ed. (1998) ch. 7 (J2000.0 = JD 2451545.0; MJD 0 = JD 2400000.5); Richards, *Explanatory Supplement* 3rd ed. (2013) ch. 15; USNO Julian Date Converter values; baseline `js/calendar.js` self-check | 2026-11-11 | Well-known values re-derived with two independent formulas |
| `hebrew.json` | 10 Gregorian ↔ Hebrew vectors (holidays 5784–5787, 1 Jan 2000, the anchor) | Hebcal published holiday dates; Dershowitz & Reingold epoch | 2026-11-11 | The anchor's Hebrew label is a calculated (CONVENTIONAL) value |
| `hebrew-hebcal.json` | 60 Gregorian → Hebrew vectors (54 seeded-random dates 1600–2200, 6 edge dates) | Hebcal converter API, `https://www.hebcal.com/converter?cfg=json&gy=…&gm=…&gd=…&g2h=1` | 2026-11-11 | Independent implementation of the fixed calendar; input treated as proleptic Gregorian |
| `chinese-hko.json` | First day of every lunar month 1901–2100 (2,474, with 73 leap months) and 4,800 solar-term days | Hong Kong Observatory, Gregorian-Lunar Calendar Conversion Tables, text files `T1901e.txt` … `T2100e.txt` from `https://www.hko.gov.hk/en/gts/time/conversion1_text.htm` | 2026-11-11 | Derived data (dates only); Hong Kong time (UTC+8). HKO's own pre-1929 tables appear to mix UTC+8 and Beijing local mean time (see docs 07 §5, 14 §3) |
| `fixtures/baseline-v1.js` (in `test/fixtures/`) | Verbatim copy of the original application's math | `js/calendar.js` at commit `6229702` | 2026-11-11 | Regression oracle; `Number`-based |

| `../data/eclipses/*.json` (in `data/eclipses/`) | NASA Five Millennium Canon, solar and lunar | see `data/eclipses/PROVENANCE.md` | 2026-11-12 | Used by the app at run time and by `test/eclipses.test.js` |
| `src/markers/events.js`, `systems.js`, `recorded-eclipses.js` | Bible-event datings and recorded eclipses, each with its citation | Ussher's *Annals* (1658, archive.org text), Jewish Encyclopedia, Wikipedia articles, Bible Hub timeline, Stephenson 1997, and others named per entry | 2026-11-12 | Figures and short factual summaries only; no text reproduced beyond short phrases |

Cross-checks that run only when the engine provides them (skipped, never failed, otherwise):
`Intl.DateTimeFormat` with the `hebrew` and `chinese` calendars (ICU). ICU is not treated as a
source of truth; where it disagrees with this implementation, the HKO or Hebcal data decide.

Licensing: the stored files contain only dates (facts), with attribution above. No source text,
tables or code from these providers is redistributed.
