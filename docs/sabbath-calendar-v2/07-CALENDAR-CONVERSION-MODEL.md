# 07 — Calendar Conversion Model

## 1. Principle

The Sabbath index is EXACT within the model. A civil date is a **label** attached to a JDN by
a calendar adapter, and that label carries its own certainty. The system displays both and
never lets an exact Sabbath number imply an exact historical calendar date.

## 2. Adapter contract

```
interface CalendarAdapter {
  id:        'gregorian' | 'julian' | 'hebrew' | 'chinese' | string
  name:      string                       // display name
  variant:   string                       // e.g. "proleptic Gregorian", "fixed arithmetic (rabbinic)"
  mathRange: { minJdn: bigint, maxJdn: bigint }       // where toJdn/fromJdn are defined and round-trip
  fromJdn(j: bigint): CalendarDate | Unsupported
  toJdn(d: CalendarDate): bigint | Unsupported
  support(j: bigint): { certainty: Certainty, reason: string, sourceId: string }
  format(d: CalendarDate, opts): string   // era labels, BCE, leap-month notation
  fields: FieldSpec[]                     // for the lookup form (year, month, day, leap flag…)
}
Certainty = 'EXACT' | 'CONVENTIONAL' | 'APPROXIMATE' | 'UNSUPPORTED'
```

Rules: adapters import only the core's `floorDiv`/`floorMod` and their own tables; adapters
never import each other; the registry is a list; adding an adapter changes no core line
(REQ-CAL-01).

Certainty meanings:

| Certainty | Meaning | Visual |
|---|---|---|
| EXACT | The label is what that calendar actually assigned to that day, by rule, in the period the rule was in force | solid badge |
| CONVENTIONAL | A standard proleptic or calculated extension of the rule outside its historical period | outlined badge |
| APPROXIMATE | A reconstruction with known or possible errors (observational calendars, ΔT, timezone, regional variants) | dashed badge, tooltip states the error source |
| UNSUPPORTED | No defensible label; the adapter declines | grey "—" with explanation |

## 3. Gregorian and Julian

| Property | Gregorian adapter | Julian adapter |
|---|---|---|
| Variant | Proleptic Gregorian, astronomical year numbering | Proleptic Julian, astronomical year numbering |
| Rule source | Richards (Explanatory Supplement 2013) / Fliegel–Van Flandern form, the baseline's algorithm, ported to BigInt | Same family, Julian variant (constant 32083 instead of 32045 and no century terms) |
| Mathematical range | ±10^9 years declared (BigInt makes it unbounded; the declaration caps meaningless labels) | same |
| Historical range (EXACT) | 15 Oct 1582 onward *as the Roman Catholic reform*; national adoption varies (Britain 14 Sep 1752, Russia 14 Feb 1918, Greece 1 Mar 1923, …) | 1 Jan AD 8 to 4 Oct 1582 in Rome; later elsewhere (Julian remained civil in Russia to 1918) |
| CONVENTIONAL | before 15 Oct 1582 (proleptic) | 1 Jan 45 BC to AD 8 (leap-year irregularity period) if modeled as regular; before 45 BC (proleptic) |
| APPROXIMATE | — | 45 BC – AD 8 if the Scaliger/Bennett reconstruction of triennial leap years is modeled (optional) |
| Known limits | none numeric; label meaning fades far outside recorded history | same |
| Cross-check sources | USNO/NASA JD converters; Meeus examples; the baseline functions | Meeus; Dershowitz–Reingold |

Both rows are always rendered. The Julian row is the one in which the anchor reads 4 April
AD 33 (COMPAT-06 is about the Gregorian row's 2 April). Regional adoption dates are **not**
modeled in the MVP; the Gregorian row's EXACT period starts at 1582 with a footnote.
An optional "regional reform table" may come later (doc 13, Phase 5).

## 4. Hebrew (Jewish) calendar

| Property | Value |
|---|---|
| Variant | Fixed arithmetic ("calculated", rabbinic) calendar: 19-year Metonic cycle, molad of Tishri, the four dehiyyot (postponement rules), year lengths 353/354/355 and 383/384/385 days, Adar I in leap years |
| Rule source | Dershowitz & Reingold, *Calendrical Calculations*, ch. 8 (Hebrew epoch R.D. −1,373,427 = JDN 347,998 = Monday 7 Oct 3761 BC Julian — re-verified for this package); Maimonides, *Mishneh Torah, Sanctification of the New Moon* |
| Mathematical range | AM 1 to AM 10,000 declared (the arithmetic is unbounded; it is capped where the mean-lunation drift makes the calculated calendar astronomically meaningless, ~AM 20,000) |
| Historical range | **EXACT-by-rule:** from the 921/2 CE Ben Meir–Saadia controversy onward the modern rules are documented and were followed (Sacha Stern, *The Jewish Calendar Controversy of 921/2 CE*, Brill 2019). **CONVENTIONAL:** 359 CE (traditional Hillel II date) to 921 CE, where fixed rules existed in some form but details are uncertain. **CONVENTIONAL (proleptic):** before 359 CE, when the calendar was observational (new-moon sighting, agricultural intercalation decided by the court); the calculated date is a projection and may differ from the historically observed date by a day or a month. |
| Sunset boundary | Hebrew days begin at sunset. The adapter labels the civil day JDN with the Hebrew date that covers its daytime; the row's legend states that the Hebrew date began the previous evening. No location logic (ADR-004). |
| Known limits | Observational era not reconstructable in general; the Qumran 364-day calendar and other sectarian calendars are out of scope; the calculated calendar is one of several historical calendars |
| Cross-check sources | `Intl.DateTimeFormat('en-u-ca-hebrew')` (ICU) where available; Hebcal published tables; Dershowitz–Reingold sample data (with their errata) |
| Scriptural reference marker | 1 Tishri AM 1 (the calendar's epoch, Molad BaHaRaD) is a marker labeled **[CONVENTION]**, not a Creation claim (doc 08) |

The adapter MUST NOT present a calculated Hebrew date in AD 33 as the date observed in
Jerusalem that year. (For the record, the calculated label of the anchor is 15 Nisan AM 3793,
which agrees with the anchor's existing rationale of Nisan 14 = Friday 3 April AD 33; this
agreement is a consistency check, not independent evidence.) The anchor's Hebrew label (calculated) is shown as CONVENTIONAL with
this note. The historical question of Nisan 14/15 in AD 33 belongs to the anchor's existing
justification (Humphreys & Waddington 1983) and is not re-opened.

## 5. Chinese calendar

| Property | Value |
|---|---|
| Variant | Modern (post-1645 "Shixian" definitions, current PRC/GB-T 33661-2017 rules): months begin on the day of astronomical new moon; the winter solstice falls in month 11; leap month is the first month without a major solar term; true (apparent) sun for solar terms |
| Rule source | Dershowitz & Reingold ch. 19 (astronomical algorithm; solar longitude and new moon from Meeus-style series); GB/T 33661-2017 for the reference meridian (UTC+8, 120°E) |
| Mathematical range | 1645–2200 CE declared for the astronomical algorithm (accuracy of the embedded ephemeris); outside that, UNSUPPORTED |
| Historical range | **EXACT-by-rule:** 1929–2100 (UTC+8 convention, ephemeris accurate). **APPROXIMATE:** 1645–1928 (Beijing local mean time 116°25′E, UTC+7:45:40, and historical computation differences cause rare one-day/one-month deviations near midnight new moons; the Ming/Qing almanacs occasionally differ from modern recomputation); 2101–2200 (ΔT uncertainty). **UNSUPPORTED:** before 1645 in the MVP, because the calendar's definitions (mean vs true moon, mean vs true solar terms, reference meridian, dynastic reforms — over 100 official calendars) changed repeatedly. |
| Optional later extension | A table-driven historical adapter from published reconstructions: Academia Sinica's Chinese–Western converter (1 CE – 2101 CE; based on *A Sino-Western Calendar for Two Thousand Years*) and Yuk Tung Liu's reconstructions (722 BCE – 2200 CE, from Zhang Peiyu et al., *Zhongguo gudai lifa*, 2008), each labeled APPROXIMATE with the source named; Hong Kong Observatory tables 1901–2100 as EXACT reference. Licensing and redistribution rights must be checked before any table is embedded. |
| Timezone | All computations in UTC+8 (1929+) or Beijing local mean time (pre-1929); a day boundary near a new moon can flip a month start — flagged APPROXIMATE when the new moon is within ±30 minutes of midnight |
| Known limits | ΔT model error for historical dates; the 2033 leap-month anomaly (correctly handled by the solstice rule but a known trap); Vietnamese, Korean (Dangi) and Japanese variants differ and are not this adapter |
| Cross-check sources | Hong Kong Observatory conversion tables (1901–2100); `Intl.DateTimeFormat('zh-u-ca-chinese')` for modern dates (ICU uses fixed UTC+8 and modern astronomy; not a historical authority) |
| Display | Sexagenary year (干支), month number with 閏 for leap months, day number; the cyclical year name is EXACT wherever the year is, since the 60-cycle is a pure count |

The MVP ships the Chinese adapter as UNSUPPORTED before 1645 rather than show a fabricated
dynastic date. This is a deliberate accuracy decision (ADR-006) and is listed for approval.

## 6. "Additional calendars" extension points

Adapters that could be added without core changes, each with the same contract and its own
validity table: Islamic (tabular vs observational — must be labeled), Coptic/Ethiopic (simple
arithmetic, EXACT from 284 CE), Persian (Solar Hijri, astronomical), Egyptian civil (365-day,
arithmetic, useful for ancient astronomical records), Babylonian (Parker–Dubberstein tables,
626 BC – AD 75, APPROXIMATE), Dangi (Korean), ISO week date, Julian Period / R.D. / Unix day.

## 7. Eclipse rows from the concept drawing

The drawing shows "Calculated eclipse data (NASA)" and "Observed eclipse data" rows. These are
not calendars; they are event series. They fit the marker-row mechanism (doc 10 §6) as an
optional Phase 5 dataset: NASA's Five Millennium Canon (Espenak & Meeus, −1999 to +3000) can be
embedded as JDN-keyed events with ΔT uncertainty; recorded eclipses (Chinese, Babylonian,
classical) can be a second series with citations. Discrepancies between the two series are
then visible on the timeline. No work on this is scheduled before Phase 5.

## 8. Range summary (what the user will see)

| Calendar | EXACT | CONVENTIONAL | APPROXIMATE | UNSUPPORTED |
|---|---|---|---|---|
| Sabbath index | always | — | — | never |
| Gregorian | 15 Oct 1582 → | before 1582 (proleptic) | — | beyond ±10^9 yr label range |
| Julian | AD 8 → 4 Oct 1582 (Rome) | before 45 BC; 45 BC–AD 8 as regular | 45 BC–AD 8 if irregular reconstruction enabled | beyond ±10^9 yr |
| Hebrew | 922 CE → | 359–921 CE; before 359 CE (proleptic calculated) | — | before AM 1 (epoch), after AM 10,000 |
| Chinese | 1929–2100 | — | 1645–1928; 2101–2200 | before 1645 (MVP) |

## 9. Library and implementation policy

| Option | Decision |
|---|---|
| Write Gregorian/Julian/Hebrew in-house from published algorithms | **Yes** (small, well-specified, testable, BigInt-native) |
| Write Chinese in-house (D&R astronomical) | **Yes, Phase 2b**; ~600 lines incl. solar-longitude and new-moon series; needs `Number` floating point internally, which is fine because the result is a JDN in a range far below 2^53 |
| `Intl.DateTimeFormat` with `-u-ca-hebrew` / `-u-ca-chinese` | Cross-check only; not a source of truth (ICU behavior varies by version and engine; no historical fidelity; no BigInt) |
| Temporal | Cross-check only; not in stable Safari as of late 2026 (web search, see 00 §References); range ±273,000 years |
| `calendrica` / `chronos` npm ports of Calendrica | Reference reading; licenses of ports vary and must be checked; not a runtime dependency |
| Any paid API | **No** |

## 10. References

- Dershowitz, N. & Reingold, E. M., *Calendrical Calculations: The Ultimate Edition*, Cambridge UP, 2018.
- Richards, E. G., "Calendars", *Explanatory Supplement to the Astronomical Almanac*, 3rd ed., 2013.
- Stern, S., *The Jewish Calendar Controversy of 921/2 CE*, Brill, 2019; Stern, S., *Calendar and Community*, Oxford, 2001.
- GB/T 33661-2017, *Calculation and promulgation of the Chinese calendar*.
- Hong Kong Observatory, Gregorian–Lunar Calendar Conversion Tables, https://www.hko.gov.hk/en/gts/time/conversion.htm
- Academia Sinica, Chinese–Western Calendar Converter, https://sinocal.sinica.edu.tw/ (1 CE – 2101 CE)
- Liu, Y. T., Chinese Calendar reconstructions, https://ytliu0.github.io/ChineseCalendar/ (722 BCE – 2200 CE), citing Zhang Peiyu et al., 2008.
- ICU `ChineseCalendar` source comments on the pre-1929 Beijing meridian (not implemented in ICU).
- Espenak, F. & Meeus, J., *Five Millennium Canon of Solar Eclipses*, NASA TP-2006-214141.
