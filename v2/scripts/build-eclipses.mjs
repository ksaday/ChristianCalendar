#!/usr/bin/env node
// Build v2/data/eclipses/{solar,lunar}.json from the NASA Five Millennium Canon raw files
// (doc 17 §4.1). Usage: node scripts/build-eclipses.mjs <raw-dir>
//   <raw-dir>/5MCSEcatalog.txt           — solar catalog text (eclipse.gsfc.nasa.gov/5MCSE/)
//   <raw-dir>/lunar/LE*.html             — the 50 century pages of LEcat5
// Dates in the canon are Julian before 1582-10-15 and Gregorian from then on, astronomical
// year numbering. Times are TD of greatest eclipse; we store the UT civil day (UT = TD − ΔT)
// and the UT minutes of greatest eclipse. Record: [jdnUT, utMin, type, mag, deltaT, saros, lat, lon].
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jdnFromJulian } from '../src/calendars/julian.js';
import { jdnFromGregorian } from '../src/calendars/gregorian.js';

const raw = process.argv[2];
if (!raw) { console.error('usage: build-eclipses.mjs <raw-dir>'); process.exit(2); }
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'eclipses');
mkdirSync(outDir, { recursive: true });

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const isJulianDate = (y, m, d) => y < 1582 || (y === 1582 && (m < 10 || (m === 10 && d < 15)));
const jdnOf = (y, m, d) => Number(isJulianDate(y, m, d) ? jdnFromJulian(BigInt(y), m, d) : jdnFromGregorian(BigInt(y), m, d));
const coord = (s) => { const m = /^(-?[\d.]+)([NSEW])$/.exec(s); if (!m) throw new Error(`bad coordinate ${s}`); const v = Number(m[1]); return (m[2] === 'S' || m[2] === 'W') ? -v : v; };

function utOf(y, m, d, hms, deltaT) {
  const [h, mi, s] = hms.split(':').map(Number);
  const tdSec = h * 3600 + mi * 60 + s;
  const ut = tdSec - deltaT;
  const shift = Math.floor(ut / 86400);
  const utMin = Math.round((ut - shift * 86400) / 60) % 1440;
  return { jdn: jdnOf(y, m, d) + shift, utMin };
}

/* ---------- solar ---------- */
const solarRows = [];
for (const line of readFileSync(join(raw, '5MCSEcatalog.txt'), 'utf8').split('\n')) {
  const t = line.trim().split(/\s+/);
  if (t.length < 14 || !/^\d+$/.test(t[0]) || !/^-?\d{1,4}$/.test(t[2]) || !(t[3] in MONTHS)) continue;
  const [cat, , yStr, mon, dStr, hms, dtStr, , sarosStr, type, , magStr, latStr, lonStr] = t;
  const y = Number(yStr), m = MONTHS[mon], d = Number(dStr), deltaT = Number(dtStr);
  const { jdn, utMin } = utOf(y, m, d, hms, deltaT);
  solarRows.push([jdn, utMin, type, Number(magStr), deltaT, Number(sarosStr), coord(latStr), coord(lonStr)]);
  if (solarRows.length !== Number(cat)) throw new Error(`solar catalog number gap at ${cat}`);
}

/* ---------- lunar ---------- */
const lunarRows = [];
const lunarDir = join(raw, 'lunar');
for (const f of readdirSync(lunarDir).filter(n => /^LE.*\.html$/.test(n)).sort()) {
  const html = readFileSync(join(lunarDir, f), 'utf8');
  for (const line of html.replace(/<[^>]+>/g, '').split('\n')) {
    const t = line.trim().split(/\s+/);
    if (t.length < 17 || !/^\d{5}$/.test(t[0]) || !/^-?\d{1,4}$/.test(t[1]) || !(t[2] in MONTHS)) continue;
    const [cat, yStr, mon, dStr, hms, dtStr, , sarosStr, type, , , penStr, umStr, , , , latStr, lonStr] = t;
    const y = Number(yStr), m = MONTHS[mon], d = Number(dStr), deltaT = Number(dtStr);
    const { jdn, utMin } = utOf(y, m, d, hms, deltaT);
    const mag = type.startsWith('N') ? Number(penStr) : Number(umStr);
    lunarRows.push({ cat: Number(cat), row: [jdn, utMin, type, mag, deltaT, Number(sarosStr), coord(latStr), coord(lonStr)] });
  }
}
lunarRows.sort((a, b) => a.cat - b.cat);
lunarRows.forEach((r, i) => { if (r.cat !== i + 1) throw new Error(`lunar catalog number gap at ${r.cat}`); });

function write(kind, rows, source) {
  const header = {
    kind, source,
    authors: 'Fred Espenak and Jean Meeus (NASA/GSFC)',
    credit: "Eclipse Predictions by Fred Espenak and Jean Meeus (NASA's GSFC)",
    retrieved: '2026-11-12',
    calendar: 'Canon dates: Julian before 1582-10-15, Gregorian after; astronomical years. Stored day = UT civil day (TD − ΔT).',
    fields: ['jdnUT', 'utMinutes', 'type', kind === 'solar' ? 'magnitude' : 'umbralMagnitude(penumbral for N)', 'deltaT_s', 'saros', 'latGreatest', 'lonGreatest'],
    count: rows.length,
  };
  const body = `{\n${Object.entries(header).map(([k, v]) => `"${k}": ${JSON.stringify(v)}`).join(',\n')},\n"rows": [\n${rows.map(r => JSON.stringify(r)).join(',\n')}\n]}\n`;
  writeFileSync(join(outDir, `${kind}.json`), body);
  console.log(`${kind}: ${rows.length} eclipses → data/eclipses/${kind}.json (${(body.length / 1024).toFixed(0)} KB)`);
}
write('solar', solarRows, 'https://eclipse.gsfc.nasa.gov/5MCSE/5MCSEcatalog.txt');
write('lunar', lunarRows.map(r => r.row), 'https://eclipse.gsfc.nasa.gov/LEcat5/LEcatalog.html (50 century pages)');
