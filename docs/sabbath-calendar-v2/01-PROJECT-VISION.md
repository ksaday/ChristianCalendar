# 01 — Project Vision

## 1. Statement

Build a mathematically complete, exact, continuously numbered seven-day Sabbath Calendar in
which **the Sabbath sequence is the primary chronology** and every other calendar
(Gregorian, Julian, Hebrew, Chinese, and future adapters) is a synchronized representation
of the same underlying day count.

> ONE ABSOLUTE SABBATH ANCHOR. ONE UNBROKEN SEVEN-DAY CYCLE. UNBOUNDED INTEGER NUMBERING.
> MULTIPLE SYNCHRONIZED CALENDAR SYSTEMS.

## 2. The anchor **[AXIOM]**

Sabbath #1 is Saturday, 4 April AD 33 in the Julian calendar, Julian Day Number 1,733,205.
This is inherited unchanged from the ChristianCalendar project. This package does not
re-examine it, and no document in this package proposes an alternative.

## 3. Three models that must never be confused

| Model | Nature | Boundary | Role in the system |
|---|---|---|---|
| **Mathematical** | Integer sequence `n ∈ ℤ`, `SabbathJDN(n) = 1733205 + 7(n−1)` | None in either direction | The engine. Always exact. |
| **Biblical Creation** | Genesis 2:1–3 names a first seventh day | Possibly finite in the past | A research track and an optional, labeled marker. Never inside the engine. |
| **Historical evidence** | What chronology can actually establish about weekly observance and civil dates | Fades with distance from the present | Governs certainty labels on *calendar dates*, never on Sabbath numbers. |

The engine must remain complete and functional if no defensible Creation date is ever
identified. No Creation date is invented to create a finite beginning.

## 4. What "complete" means

1. Every integer corresponds to exactly one Sabbath; every Sabbath has exactly one integer.
2. Consecutive Sabbaths are exactly seven days apart, always.
3. Every day on the timeline belongs to exactly one seven-day cycle.
4. Any Sabbath or day can be reached by direct arithmetic, never by stepping week by week.
5. There is no numeric ceiling inside the arithmetic contract (arbitrary-precision integers).
6. Zero and negative indices are first-class, not special cases.

## 5. What "synchronized" means

Every row of the timeline is a function of one shared coordinate: the Julian Day Number
(as an arbitrary-precision integer). Rows never carry independent state. Moving the cursor
moves every row because every row is re-derived from the same JDN.

## 6. What "honest" means

A Sabbath number is a mathematical fact within the model. A calendar date is a claim about
how a civilization labeled that day, and that claim has a certainty that depends on period,
place and calendar variant. The system shows both and never lets the first lend borrowed
certainty to the second.

## 7. Scope of this generation

In scope: the Chronology Core; Gregorian, Julian, Hebrew and Chinese adapters with declared
validity; the synchronized timeline with lookups, zooming and cycle detail; a complete
verification suite; documentation of assumptions and limits.

Explicitly deferred (Phase 5, each requiring separate approval): sunset-based religious
Sabbath boundaries, additional calendars (Islamic, Coptic, Ethiopic, Persian, Egyptian
civil, Babylonian reconstructions), the Creation Tradition Markers module, and the
eclipse-correlation rows shown in the concept drawing.

## 8. Non-goals

- Re-dating the Crucifixion or the anchor.
- Proving continuous weekly observance back to Creation.
- Reconstructing ancient observed Hebrew or Chinese calendars where the record is lost.
- Any server, database, framework, or paid data service.
- Replacing the original ChristianCalendar application; it remains the reference.

## 9. Guiding constraints inherited from the owner's rules

Sabbath #1 immutable · preserve validated behavior · exact seven-day integer arithmetic in
both directions · no gaps, overlaps or resets · Sabbath #0 retained · infinity is not a date
· no fabricated conversions · no Creation date forced into the engine · conversions
subordinate to the common chronology · modular · zero-cost dependencies · no
over-engineering · explicit about proof versus interpretation.
