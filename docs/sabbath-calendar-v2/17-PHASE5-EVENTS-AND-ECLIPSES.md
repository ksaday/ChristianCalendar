# 17 — Phase 5 addendum: Bible-event markers, Tradition Markers, eclipse rows

Status: approved in principle by the owner on 2026-11-12 ("5.6 Eclipse rows", "5.2 Tradition
Markers", and "add (even estimates) dates or years from the Bible on the calendar, major ones
like Adam, Noah, Moses"). This addendum records the design choices made for that work, in the
same spirit as docs 00–16: the engine is untouched, every date carries its source, and
interpretation is never presented as proof.

## 1. Scope

| Item | Delivered as |
|---|---|
| 5.2 Tradition Markers (doc 08 §4) | Generalised into the **Bible events** row: a dated event list under several named chronological *systems*; the three Creation-epoch markers of doc 08 §4 are part of it |
| Owner's request: Bible dates/years (Adam, Noah, Moses …) | Same row, 52 events from Adam to the destruction of the Second Temple |
| 5.6 Eclipse rows | Two rows: **Eclipses · calculated** (NASA Five Millennium Canon, −1999 to +3000) and **Eclipses · recorded** (a curated list of historically attested eclipses, each verified against the canon) |

Out of scope and unchanged: core, adapters, timeline mathematics, the original application.

## 2. Non-negotiables carried forward

- Sabbath #1 = JDN 1,733,205 and `SabbathJDN(n) = 1733205 + 7(n−1)` are not touched.
- No Creation date enters `src/core/`, `src/calendars/` or `src/timeline/` (`check-core` still
  fails on the word "creation" there). The new `src/markers/` layer is the only place such
  dates exist, as *data about traditions*.
- Nothing is fabricated: every event dating is either (a) a figure quoted from a cited source,
  or (b) a figure **derived** by stated arithmetic from a cited anchor plus an explicit
  scriptural interval (the derivation string is stored next to the number and shown in the UI).
- Marker certainty is `INTERPRETATION` for traditional/estimated datings. Historically anchored
  days (for example 16 March 597 BC from the Babylonian Chronicle) carry `EXACT`/`APPROXIMATE`
  *as historical dates*; they are still shown on the events row, never used by the engine.

## 3. Chronological systems (the "tradition" selector)

A **system** is a named way of assigning years to biblical events. Four are shipped; the user
picks one at a time for the row, and the cursor card lists all four for the event nearest the
cursor.

| id | Name | Year unit used for positioning | Primary sources (retrieved 2026-11-12) |
|---|---|---|---|
| `ussher` | Ussher, *Annales* (1650) | The BC/AD year printed in the heading of the *Annals* entry (civil-year band); Ussher's own Anno Mundi years (23 Oct → 22 Oct, Julian, AM 1 = 4004 BC) for the Genesis 5/11 births he does not head separately | Ussher, *The Annals of the World* (1658), English text on archive.org (item `AnnalsOfTheWorld`), every entry headed "AM, JP, BC": Flood 1656a AM = 2349 BC, Abram 2008c AM = 1996 BC, call 2083a AM = 1922 BC, Exodus 2513b AM = 1491 BC, Temple 2992c AM = 1012 BC, Samaria 3283 AM = 721 BC, Temple burned 3416c AM = 588 BC, Cyrus 3468c AM = 536 BC, AD 33, AD 70; Wikipedia "Ussher chronology" (Creation Sun 23 Oct 4004 BC; Nativity 5 BC; Herod † 4 BC); Associates for Biblical Research, "Ussher, Explained and Corrected" (cross-check of Flood, Abram, Exodus) |
| `seder-olam` | Seder Olam Rabbah / traditional Jewish | Hebrew Anno Mundi years of the fixed calendar (1 Tishri – 29 Elul), as popular Jewish chronology applies them (Exodus AM 2448 = 1313 BCE) | Jewish Encyclopedia "Seder Olam Rabbah" (Babel AM 1996; Temple 480 years after Exodus; First Temple stood 410 years, destroyed AM 3338; captivity 70 years; Second Temple 420 years, destroyed AM 3828; Persian 34, Greek 180, Hasmonean 103, Herodian 103 years); Wikipedia "Seder Olam Rabbah" (Exodus AM 2448; 3338 = 423/422 BCE; 3828 = 68 CE) |
| `early-date` | Early-date conservative (Thiele / Wood / ESV Study Bible, as tabulated by Bible Hub) | Julian/Gregorian civil years | biblehub.com/timeline (Isaac 2066, Jacob 2006, Joseph 1916, Egypt 1875, Moses 1525, Exodus 1446, Jericho 1406, Saul 1043, David 1010, Temple 966, dedication 959, division 931, Samaria 722, Jehoiachin 597, Jerusalem 586, Cyrus 537, Second Temple 515, Ezra 458, Nehemiah 444, Nativity 5 BC, Crucifixion AD 30) |
| `historical` | Critical / historical (external synchronisms) | Civil years, year ranges, or exact days | Wikipedia articles: Siege of Jerusalem (597 BC) — 16 Mar 597 BC, BM 21946; Siege of Jerusalem (587 BC) — July 587 or 586; Fall of Babylon — 12 Oct 539 BC; Second Temple — spring 516; Chronology of Jesus — 6–4 BC, Herod † 4 BC after the 13 Mar 4 BC eclipse, crucifixion Fri 7 Apr AD 30 or Fri 3 Apr AD 33; United monarchy (Galil: Saul c. 1030–1010, David c. 1008–970, Solomon c. 970–931; division c. 930); Ezra–Nehemiah (458 / 398; 445); Assyrian eclipse (15 Jun 763 BC) |

Why these four: Ussher is the classic published MT chronology with a full Adam→Christ table;
Seder Olam is the living Jewish count behind the Hebrew calendar row; the early-date table is
what most evangelical study Bibles print; the historical column shows where external records
fix a date and where they fix nothing. The Septuagint-based systems (Alexandrian 5493 BC,
Byzantine 5509 BC) are represented only by their Creation-epoch markers (doc 08 §4), because
no single published LXX event table exists that could be cited row by row.

### 3.1 Year-to-position rule (no invented days)

A dating is one of:

- `day`: a claimed civil day → a single JDN (Ussher's Creation Sunday; 16 Mar 597 BC; Fri 3 Apr AD 33 …).
- `am`: an Anno Mundi year in a system with an AM epoch → the **band** of that year
  (Ussher: 23 Oct → 22 Oct Julian; Seder Olam: 1 Tishri → 29 Elul via the Hebrew adapter).
  The Genesis sums count from Adam = 0 (Seth AM 130, Flood AM 1656), as both traditions do.
- `year`: a civil year (astronomical numbering) → the band 1 Jan → 31 Dec (Julian before 1582-10-15, else Gregorian).
- `range`: `[fromYear, toYear]` → band from 1 Jan of the first to 31 Dec of the last.
- `none`: the system gives no figure (for example the historical column for Adam) → listed as "no date in this system", nothing drawn.

A band is drawn as a shaded bar with a hollow diamond at its centre; the label is the event name,
placed in one of two lanes above and below the line; the hover/aria text gives the system's
figure ("1491 BC", or "AM 1656 · 2106/2105 BC"), the basis ("Annals §172: 2513b AM, 1491 BC"),
the source, and the cycle span (Ussher's Exodus: "cycles #−79,480 – #−79,428").
Because the position is a band, the UI never claims a weekday for an event whose source gives
only a year.

### 3.2 Masoretic genealogical arithmetic (shared by `ussher` and `seder-olam`)

The pre-Abraham years are sums of the begetting ages of Genesis 5 and 11 (Masoretic Text,
verified against the KJV text on 2026-11-12). Both systems use them unchanged; Ussher's only
departure is Abram's birth in Terah's 130th year (AM 2008, Gen 11:32 + 12:4 + Acts 7:4) where
Seder Olam uses Terah's 70th (AM 1948).

| Born | Age at son | AM of son's birth | Lifespan | Death AM |
|---|---|---|---|---|
| Adam | 130 | Seth 130 | 930 | 930 |
| Seth | 105 | Enosh 235 | 912 | 1042 |
| Enosh | 90 | Kenan 325 | 905 | 1140 |
| Kenan | 70 | Mahalalel 395 | 910 | 1235 |
| Mahalalel | 65 | Jared 460 | 895 | 1290 |
| Jared | 162 | Enoch 622 | 962 | 1422 |
| Enoch | 65 | Methuselah 687 | 365 | taken 987 |
| Methuselah | 187 | Lamech 874 | 969 | 1656 |
| Lamech | 182 | Noah 1056 | 777 | 1651 |
| Noah | 500 (Gen 5:32); Flood in his 600th year (Gen 7:11) | Flood 1656 | 950 | 2006 |
| Shem | Arpachshad "two years after the flood" (Gen 11:10) | 1658 | | |
| Arpachshad 35 → Shelah 1693; Shelah 30 → Eber 1723; Eber 34 → Peleg 1757; Peleg 30 → Reu 1787; Reu 32 → Serug 1819; Serug 30 → Nahor 1849; Nahor 29 → Terah 1878; Terah 70 → Abram 1948 (Seder Olam) / 130 → 2008 (Ussher) | | | | |

Adam is AM 1 in the sense "the first year of the world"; the two-year "year of chaos" offset
between Seder Olam's own count and the modern Hebrew AM is noted in the data file and not
silently applied (popular Jewish chronology uses the figures above directly: Flood 2105 BCE,
Exodus 1313 BCE, First Temple 833 BCE, destruction 423 BCE, Second Temple destroyed 68 CE).

### 3.3 Event list (52)

Primeval (Gen 5–11): Creation of Adam, Seth, Enosh, Kenan, Mahalalel, Jared, Enoch, Methuselah,
Lamech born; Adam dies; Enoch taken; Noah born; the Flood; Arpachshad, Shelah, Eber born; Tower of
Babel; Reu, Serug, Nahor, Terah born; Noah dies. Abraham born opens the patriarchs.
Patriarchs: Abraham's call, Isaac, Jacob, Joseph born, Joseph sold, Joseph over Egypt, Jacob to
Egypt. Exodus: Moses born, Exodus, entry into Canaan. Monarchy: Saul, David, Solomon, Temple
founded, Temple dedicated, kingdom divided. Exile: Samaria falls, Jerusalem taken (Jehoiachin),
Temple destroyed, Babylon falls to Cyrus, Cyrus' decree, Second Temple completed, Ezra,
Nehemiah, Maccabean rededication. New Testament: Herod dies, Jesus born, Crucifixion, Second
Temple destroyed. Ussher's Creation day is the first event under his system; the Hebrew AM epoch
and the Byzantine era epoch from doc 08 §4 are drawn under every system as small grey diamonds.

## 4. Eclipse rows

### 4.1 Data

- Source: Espenak & Meeus, *Five Millennium Canon/Catalog of Solar Eclipses* (−1999 to +3000,
  11,898 entries, `5MCSE/5MCSEcatalog.txt`, 2007-01-26) and *of Lunar Eclipses* (12,064 entries,
  the 50 `LEcat5/LE*.html` century pages), NASA/GSFC. Public-domain US Government work; the
  requested credit line "Eclipse Predictions by Fred Espenak and Jean Meeus (NASA's GSFC)" is
  shown in the UI footer and in `data/eclipses/PROVENANCE.md`.
- Build: `scripts/build-eclipses.mjs <raw-dir>` parses the raw files (kept outside the repo) and
  writes `v2/data/eclipses/solar.json` and `lunar.json`. Calendar dates are converted with the
  v2 adapters: Julian for dates before 1582-10-15, Gregorian after (the canon's convention;
  astronomical year numbering, year 0 = 1 BC). Times are TD; the stored civil day is the
  **UT day** (`UT = TD − ΔT`, ΔT from the canon), because that is the day at Greenwich on which
  the eclipse happened. Local civil dates east of Greenwich may be one day later near midnight.
- Record (array, to keep the files ≈ 0.5 MB each): `[jdnUT, utMinutes, type, magnitude, deltaT, saros, lat, lon]`.
  Solar types P/A/T/H with the canon suffixes; lunar N/P/T with suffixes; magnitude is the
  solar eclipse magnitude or the lunar umbral magnitude (penumbral magnitude for N).
- The files are fetched lazily by the UI only when a row that needs them is on; the markers
  module itself is pure (`parseCanon(json)`), so Node tests read the files from disk.

### 4.2 ΔT uncertainty (shown, not hidden)

σ(ΔT) follows NASA's statement of Morrison & Stephenson (2004): σ = 0.8 t² s with
t = (year − 1820)/100, valid −1000 … +1200 and used here through 2005; outside that, Huber's
Brownian model σ = 365.25·N·√((N·Q/3)(1 + N/M))/1000 with Q = 0.058 ms²/yr, M = 2500 and N
years from the calibration year (−500 before 500 BCE; 2005 after). Each tooltip shows
"ΔT = 25,400 s ± 636 s". If the UT instant ± σ crosses midnight, the tick is flagged
"civil day ±1 (ΔT)". The seven-day cycle is unaffected either way; only the calendar day
label of the eclipse is uncertain.

### 4.3 Recorded eclipses

`src/markers/recorded-eclipses.js` lists 35 eclipses with a historical record: 25 solar
(Mursili II 1312 BC, Chinese "double dawn" 899 BC, Assyrian/Bur-Sagale 763 BC, Archilochus 648 BC,
Thales 585 BC, Xerxes 480 BC, Thucydides 431 BC, Phlegon AD 29, Mirian III 319, Firmicus 334, Louis
the Pious 840, Henry I 1133, Igor 1185, Clavius 1560 and 1567, Halley 1715, 1806, Baily 1836, first
photograph 1851, helium 1868, Eddington 1919, 1991, 1999, 2017, 2024) and 10 lunar (Zhou-Shu 1137 BC,
the earliest Babylonian record 721 BC, Aristophanes 425 BC, Nicias 413 BC, Gaugamela 331 BC, Pydna
168 BC, Josephus/Herod 4 BC, 3 Apr AD 33, Constantinople 1453, Columbus 1504). Each entry has the
date, a one-line record, a source and a `status`: `attested` (a contemporary record), `disputed`
(an identification argued in the literature) or `interpretation` (a modern association with a
text, such as Phlegon's eclipse with the Crucifixion darkness, or 3 Apr AD 33 with Acts 2:20).
A test asserts that **every recorded entry coincides with a canon entry** of the same kind on that
UT day or the adjacent one; all 35 do, 34 on the same day (the Chinese "double dawn" falls on the
canon's previous UT day, 22:22 UT, i.e. the next morning in China). The legendary Xi–He eclipse
(Shu Jing) is not listed: its candidate date of 2137 BC is outside the canon and cannot be checked.

### 4.4 Rendering

- Calculated row: individual ticks (☉ solar, ☾ lunar; filled for total/annular/hybrid,
  hollow for partial, dotted for penumbral) when at most 400 fall in the viewport; otherwise
  the row collapses to "N solar + M lunar eclipses in view — zoom in", exactly like an
  UNSUPPORTED calendar row collapses today. Labels appear when ticks are ≥ 56 px apart.
- Recorded row: always individual, always labelled when space allows; `disputed` entries are
  drawn hollow with a "?" and say so in the tooltip.
- Clicking any eclipse tick moves the cursor to that day (existing `data-jdn` behaviour).
- Cursor card: an "Eclipses" line when the cursor day has one, with type, magnitude, UT time
  of greatest eclipse, ΔT ± σ, Saros, and the sub-point of greatest eclipse.

## 5. UI additions

- Rows menu: **Bible events** (checkbox + chronology select), **Eclipses · calculated**,
  **Eclipses · recorded**. Defaults: Bible events on (owner's request 2026-11-12; ADR-015),
  recorded on, calculated on except on narrow screens (data size). The two canon files
  (≈ 0.5 MB each) are fetched only when one of the eclipse rows is on.
- Cursor card: "Eclipses on this day" (type, UT of greatest eclipse, magnitude, Saros,
  ΔT ± σ, and the historical record if one exists) and "Bible events" (the event or events
  whose band contains the cursor, the figure in all four systems, and buttons to the previous
  and next dated event).
- Legend: ◇ tradition / estimate (band = year), ☉ solar, ☾ lunar.
- Go to… dialog: new mode **Bible event** (system + event → cursor to the band's first day or
  the claimed day).
- Footer: the NASA credit line and the sentence "Event dates are traditions or estimates with
  their sources; the Sabbath count does not depend on any of them."

## 6. Tests

| ID | Check |
|---|---|
| T-EVT-01 | Genesis arithmetic table reproduces Flood AM 1656, Abram AM 1948/2008, Enoch taken 987, Noah † 2006 |
| T-EVT-02 | Ussher anchors: Creation JDN 259,258 is a Sunday and starts AM 1; AM 1656 = Oct 2349 – Oct 2348 BC; Exodus band contains spring 1491 BC; Temple 1012 BC |
| T-EVT-03 | Seder Olam bands via the Hebrew adapter: AM 2448 contains Nisan 1313 BCE; AM 3338 = 424/423 BC (popular "423/422 BCE" counts the year by its spring); AM 3828 = AD 67/68 |
| T-EVT-04 | Every dating has a `basis` string and a `source`; every derived figure cites its interval; no dating lies outside its system's declared coverage |
| T-EVT-05 | Exact historical days: 16 Mar 597 BC, 12 Oct 539 BC, 13 Mar 4 BC, 7 Apr AD 30 (Friday), 3 Apr AD 33 = anchor − 1 (Friday) |
| T-EVT-06 | Markers layer imports only core/calendars; no DOM, no fetch; `check-core` extended |
| T-ECL-01 | Canon parse: 11,898 solar / 12,064 lunar; JDNs strictly increasing; types in the key's alphabet |
| T-ECL-02 | Spot vectors: 2017-08-21 T, 1999-08-11 T, 2024-04-08 T, 763-06-15 BC T, 585-05-28 BC T, 331-09-20 BC lunar T, AD 33-04-03 lunar P (umbral 0.576), 4 BC-03-13 lunar P; no eclipse on Sabbath #1; the first canon entry's UT day is one day before its TD date |
| T-ECL-03 | σ(ΔT): −1000 → 636 s; 1820 → 0; 2005 → 2.7 s; Huber at −2000 > σ(−1000) |
| T-ECL-04 | Every recorded eclipse matches a canon entry of its kind on the same UT day or the adjacent one |
| T-ECL-05 | Viewport query is O(log n + k): binary search; budget ≤ 400 ticks or collapsed |
| T-UI-15 | Bible events row shows the Exodus band (Ussher, 1491 BC) at week zoom; the cursor card lists all four systems |
| T-UI-16 | Calculated-eclipse row collapses with counts at century zoom and shows individual ticks, including 21 Aug 2017, at year zoom |
| T-UI-17 | Recorded-eclipse row shows Eddington 1919 and 2017 at decade zoom; the cursor card describes the 2017 eclipse with ΔT |
| T-UI-18 | Go to… Bible event (Ussher, Exodus) previews "1491 BC" with its basis and jumps to 1 Jan 1491 BC (JDN 1,176,836) |
| T-UI-07 | axe-core: no violations, including rows that have no item in view |

## 7. Deviations from the 2026-11-11 package

- Location: `src/markers/` as its own layer instead of `src/calendars/markers/` (doc 09 tree),
  so the layer rules can forbid calendars from importing it.
- A7/ADR-010 said the Tradition Markers module is off by default. On 2026-11-12 the owner asked
  for Bible dates "on the calendar"; the Bible events row is therefore **on by default**, with
  the INTERPRETATION styling and disclaimer unchanged (ADR-015).
- The Creation-epoch markers are now part of the Bible events row rather than the reference
  marker row, so they share its on/off switch.

## 8. Results (2026-11-13)

| Check | Result |
|---|---|
| Node suite | 94 tests pass (83 before Phase 5, 11 new) |
| `check-core` | OK, 23 files; the markers layer is the only one allowed the word "creation" |
| Canon build | 11,898 solar and 12,064 lunar eclipses; catalogue numbers contiguous |
| Recorded eclipses | 35 of 35 coincide with a canon eclipse |
| UI smoke harness | 16 of 16 pass in the visible desktop-app pane and in headless Chrome (`npm run check:browser`); slowest render 5 ms over the whole zoom ladder |
| axe-core 4.10.2 | 0 violations after one fix (empty rows now carry one list item), in both browsers |
| Timezones | suite green under UTC, Pacific/Kiritimati and Pacific/Pago_Pago |
