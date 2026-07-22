# The Christian Calendar

A one-page website that overlays a serial **Sabbath Number** on the regular
Gregorian calendar, counting every Saturday in unbroken sequence since the
Passover Sabbath of the Resurrection week — **Saturday, 4 April AD 33**
(Julian Day Number 1,733,205), which is **Sabbath #1**.

## Files

```
christian-calendar/
├── index.html        page structure: header, calendar + video sections, footer
├── css/style.css     complete standalone stylesheet (all colors self-defined)
├── js/calendar.js    all logic: JDN math, rendering, navigation, self-checks
└── README.md         this file
```

## Running it

No build step, no server, no internet required.
Open `index.html` in any browser, or upload the folder to any web host
(GitHub Pages, Netlify, church website, etc.) keeping the folder layout intact.

## How the counting works

- Every date is converted to its **Julian Day Number (JDN)** — a continuous
  integer day count used by astronomers, immune to the 1582 Julian→Gregorian
  calendar reform (the 7-day week ran unbroken through it).
- A day is a Sabbath iff `JDN mod 7 == 5` (Saturday).
- `SabbathNumber = (JDN − 1,733,205) / 7 + 1`

Built-in self-checks run on every page load (result shown in the footer):
- 11 April 2026 → JDN 2,461,142 → Sabbath **#103,992**
- 4 April AD 33 → Sabbath **#1**, Anniversary Sabbath

## Special markings

- **Gold seal** on every Saturday: its serial Sabbath number.
- **✦ Anniversary Sabbath**: the first Saturday on/after 4 April each year,
  labelled with the ordinal year since the Resurrection week.
  (Calendar-anchored rather than "every 52nd number", which would drift —
  a solar year is 52.18 weeks.)
- **Wine-colored seal**: milestone Sabbaths (every 1,000th).
- **Green circle**: today.

## Adding your videos

Each placeholder card in the right-hand section looks like:

```html
<article class="video-card">
  <div class="video-thumb" role="img" aria-label="Video placeholder">
    <span class="play">&#9654;</span>
  </div>
  <h3>What is the Christian Calendar?</h3>
  <p class="video-meta">Episode 1 · coming soon</p>
</article>
```

When a video is ready, replace the `<div class="video-thumb">…</div>` with:

```html
<iframe style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px"
        src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
        title="Episode 1 — What is the Christian Calendar?"
        allowfullscreen></iframe>
```

and update the title/meta text. Nothing else needs to change.

## Dating references

- Humphreys & Waddington, "Dating the Crucifixion," *Nature* 306 (1983)
- NASA Five Millennium Catalog of Solar/Lunar Eclipses (Espenak & Meeus),
  eclipse.gsfc.nasa.gov
- Dates before 15 Oct 1582 are displayed in the proleptic Gregorian calendar.
  Note: the anchor (Julian 4 April AD 33) therefore appears on **2 April AD 33**
  in the year-33 view — same physical day (JDN 1,733,205), different calendar label.
  It is marked "✦ #1" on the calendar.

*"There remaineth therefore a rest to the people of God." — Hebrews 4:9*
