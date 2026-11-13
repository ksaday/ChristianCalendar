# Eclipse data — provenance

| File | Content | Source | Retrieved |
|---|---|---|---|
| `solar.json` | 11,898 solar eclipses, −1999 to +3000 | Espenak & Meeus, *Five Millennium Catalog of Solar Eclipses* (NASA TP-2006-214141), `https://eclipse.gsfc.nasa.gov/5MCSE/5MCSEcatalog.txt` (catalog dated 2007-01-26) | 2026-11-12 |
| `lunar.json` | 12,064 lunar eclipses, −1999 to +3000 | Espenak & Meeus, *Five Millennium Catalog of Lunar Eclipses* (NASA TP-2009-214172), the 50 century pages linked from `https://eclipse.gsfc.nasa.gov/LEcat5/LEcatalog.html` | 2026-11-12 |

Credit line requested by the source and shown in the application: **"Eclipse Predictions by
Fred Espenak and Jean Meeus (NASA's GSFC)"**. The catalogs are works of the US Government.

Built by `scripts/build-eclipses.mjs <raw-dir>` from the raw files, which are not stored in the
repository. Conversions applied:

- Calendar dates: Julian before 1582-10-15, Gregorian from then on, astronomical year numbering
  (the catalogs' convention), converted to JDN with the v2 adapters.
- Times: the catalogs give Terrestrial Dynamical Time (TD) of greatest eclipse and ΔT. Each record
  stores the **UT civil day** and UT minutes, computed as TD − ΔT. Where that crosses midnight the
  stored day differs from the catalog's printed date (for example catalog no. 1, −1999 Jun 12
  03:14:51 TD with ΔT = 46,438 s, is stored as 11 June, 14:21 UT).
- Fields kept: type code, magnitude (solar eclipse magnitude; lunar umbral magnitude, or penumbral
  magnitude for penumbral eclipses), ΔT, Saros number, and the latitude/longitude of greatest
  eclipse (solar) or of the sub-lunar point (lunar). Gamma, path width and durations are dropped.
- The build checks that catalog numbers run without gaps; the tests check counts, ordering, the
  type alphabet and spot vectors (doc 17 §6).

ΔT uncertainty shown in the UI follows NASA's page "Uncertainty in ΔT"
(`https://eclipse.gsfc.nasa.gov/SEhelp/uncertainty2004.html`, retrieved 2026-11-12).
