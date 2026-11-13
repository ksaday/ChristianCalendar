/* ============================================================
   Sabbath Calendar v2 — markers/events.js
   Bible events with their datings under each chronological
   system (doc 17 §3.3). A dating is a quoted figure or a derived
   one; `basis` says which, `source` points into SOURCES. Nothing
   here is a claim of fact about the week: positions are bands or
   days projected onto the unbroken cycle (REQ-GEN-03).
   ============================================================ */

import { toBigInt } from '../core/bigint-math.js';
import { yearLabel } from '../calendars/civil-common.js';
import { birthYears, deathYears } from './genesis.js';
import { SYSTEMS, SOURCES, getSystem, yearBand, rangeBand, bandYearLabel, civilDayLabel, INTERPRETATION } from './systems.js';

/* ---------- dating constructors ---------- */
const am = (n, basis, source) => Object.freeze({ kind: 'am', am: n, basis, source });
const yr = (y, basis, source, certainty) => Object.freeze({ kind: 'year', year: y, basis, source, certainty });
const rng = (from, to, basis, source, certainty) => Object.freeze({ kind: 'range', from, to, basis, source, certainty });
const day = (jdn, basis, source, certainty = INTERPRETATION) => Object.freeze({ kind: 'day', jdn: BigInt(jdn), basis, source, certainty });
const alt = (days, basis, source) => Object.freeze({ kind: 'alt', days: days.map(d => Object.freeze({ jdn: BigInt(d.jdn), label: d.label })), basis, source });
const none = (reason) => Object.freeze({ kind: 'none', reason });

const NO_EARLY_PRIMEVAL = none('Bible Hub gives only "before 4000 BC" for the primeval period');
const NO_HIST = none('no historical date: not datable by external records');
const NO_SO = none('no Seder Olam figure cited in this package');

const UA = 'ussher-annals';
const U = birthYears({ abramAtTerah: 130 }), UD = deathYears({ abramAtTerah: 130 });
const S = birthYears({ abramAtTerah: 70 });

const birth = (id, name, ref, extra = {}) => ({
  id, label: name, group: 'primeval', ref,
  datings: {
    ussher: am(U.get(id), `Genesis sums (Ussher reads Abram's birth in Terah's 130th year); AM ${U.get(id)} = ${4005 - U.get(id)}/${4004 - U.get(id)} BC`, 'gen-mt'),
    'seder-olam': am(S.get(id), `Genesis sums: AM ${S.get(id)}`, 'gen-mt'),
    'early-date': NO_EARLY_PRIMEVAL,
    historical: NO_HIST,
  },
  ...extra,
});

/** @type {readonly {id:string,label:string,group:string,ref:string,datings:Record<string, object>}[]} */
export const EVENTS = Object.freeze([
  { id: 'adam', label: 'Creation of Adam', group: 'primeval', ref: 'Gen 1:26–2:3', datings: {
    ussher: day(259258n, 'Sunday 23 October 4004 BC (Julian), "the entrance of the night preceding the 23rd"; AM 1', 'wiki-ussher'),
    'seder-olam': am(1, 'AM 1 (the calendar epoch, 1 Tishri 3761 BCE, is the molad of the preceding "year of chaos"; popular Jewish chronology counts Adam from 3760 BCE)', 'je-seder-olam'),
    'early-date': NO_EARLY_PRIMEVAL, historical: NO_HIST } },
  birth('seth', 'Seth born', 'Gen 5:3'),
  birth('enosh', 'Enosh born', 'Gen 5:6'),
  birth('kenan', 'Kenan born', 'Gen 5:9'),
  birth('mahalalel', 'Mahalalel born', 'Gen 5:12'),
  birth('jared', 'Jared born', 'Gen 5:15'),
  birth('enoch', 'Enoch born', 'Gen 5:18'),
  birth('methuselah', 'Methuselah born', 'Gen 5:21'),
  birth('lamech', 'Lamech born', 'Gen 5:25'),
  { id: 'adam-dies', label: 'Adam dies', group: 'primeval', ref: 'Gen 5:5', datings: {
    ussher: yr(-3073, 'Annals §21: 930d AM, 3074 BC', UA), 'seder-olam': am(UD.get('adam'), 'Gen 5:5: 930 years → AM 930', 'gen-mt'), 'early-date': NO_EARLY_PRIMEVAL, historical: NO_HIST } },
  { id: 'enoch-taken', label: 'Enoch taken', group: 'primeval', ref: 'Gen 5:24', datings: {
    ussher: yr(-3016, 'Annals: 987d AM, 3017 BC', UA), 'seder-olam': am(UD.get('enoch'), 'Gen 5:23–24: 365 years → AM 987', 'gen-mt'), 'early-date': NO_EARLY_PRIMEVAL, historical: NO_HIST } },
  birth('noah', 'Noah born', 'Gen 5:28'),
  { id: 'flood', label: 'The Flood', group: 'primeval', ref: 'Gen 7:11', datings: {
    ussher: yr(-2348, 'Annals §33–40: the Flood began 1656a AM, 2349 BC and the earth was dry 1657a AM, 2348 BC; ABR: AM 1656 = 2349 BC', UA),
    'seder-olam': am(S.get('flood'), 'Gen 7:11: Noah\'s 600th year → AM 1656 (popular Jewish date 2105 BCE)', 'gen-mt'),
    'early-date': none('Bible Hub: "before 2500 BC"'), historical: NO_HIST } },
  birth('arpachshad', 'Arpachshad born', 'Gen 11:10'),
  birth('shelah', 'Shelah born', 'Gen 11:12'),
  birth('eber', 'Eber born', 'Gen 11:14'),
  { id: 'babel', label: 'Tower of Babel (days of Peleg)', group: 'primeval', ref: 'Gen 10:25; 11:1–9', datings: {
    ussher: yr(-2246, 'Annals: 1757d AM, 2247 BC — the dispersion at Peleg\'s birth', UA),
    'seder-olam': am(1996, 'Seder Olam: the confusion of tongues 1,996 years after creation, in Peleg\'s last year', 'je-seder-olam'),
    'early-date': none('Bible Hub: "before 2100 BC"'), historical: NO_HIST } },
  birth('reu', 'Reu born', 'Gen 11:18'),
  birth('serug', 'Serug born', 'Gen 11:20'),
  birth('nahor', 'Nahor born', 'Gen 11:22'),
  birth('terah', 'Terah born', 'Gen 11:24'),
  { id: 'noah-dies', label: 'Noah dies', group: 'primeval', ref: 'Gen 9:29', datings: {
    ussher: yr(-1997, 'Annals §62: 2006d AM, 1998 BC', UA), 'seder-olam': am(UD.get('noah'), 'Gen 9:29: 950 years → AM 2006', 'gen-mt'), 'early-date': NO_EARLY_PRIMEVAL, historical: NO_HIST } },
  { id: 'abraham', label: 'Abraham born', group: 'patriarchs', ref: 'Gen 11:26, 32; 12:4', datings: {
    ussher: yr(-1995, 'Annals §63: 2008c AM, 1996 BC (Abram born in Terah\'s 130th year: Gen 11:32, 12:4, Acts 7:4)', UA),
    'seder-olam': am(S.get('abraham'), 'Gen 11:26: Terah 70 → AM 1948 (popular date 1813 BCE)', 'gen-mt'),
    'early-date': yr(-2165, 'derived: Isaac born 2066 BC (Bible Hub) − 100 years (Gen 21:5) = 2166 BC', 'biblehub'),
    historical: NO_HIST } },
  { id: 'abraham-call', label: 'Call of Abraham', group: 'patriarchs', ref: 'Gen 12:1–4', datings: {
    ussher: yr(-1921, 'Annals §70: 2083a AM, 1922 BC (Wikipedia: Abraham\'s migration 1922/1921 BC)', UA),
    'seder-olam': am(S.get('abraham') + 75, 'derived: Abraham AM 1948 + 75 (Gen 12:4) = AM 2023', 'gen-mt'),
    'early-date': yr(-2090, 'derived: 2166 − 75 (Gen 12:4) = 2091 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'isaac', label: 'Isaac born', group: 'patriarchs', ref: 'Gen 21:5', datings: {
    ussher: yr(-1895, 'Annals §85: 2108c AM, 1896 BC', UA), 'seder-olam': am(S.get('abraham') + 100, 'derived: Abraham 100 (Gen 21:5) = AM 2048', 'gen-mt'),
    'early-date': yr(-2065, 'Bible Hub: 2066 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'jacob', label: 'Jacob and Esau born', group: 'patriarchs', ref: 'Gen 25:26', datings: {
    ussher: yr(-1835, 'Annals §98: 2168c AM, 1836 BC', UA), 'seder-olam': am(S.get('abraham') + 160, 'derived: Isaac 60 (Gen 25:26) = AM 2108', 'gen-mt'),
    'early-date': yr(-2005, 'Bible Hub: 2006 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'joseph', label: 'Joseph born', group: 'patriarchs', ref: 'Gen 30:22–24', datings: {
    ussher: yr(-1744, 'Annals: 2259c AM, 1745 BC ("Jacob was 91 years old when Joseph was born")', UA), 'seder-olam': am(S.get('abraham') + 251, 'derived: Jacob 91 (Gen 41:46; 45:6; 47:9) = AM 2199', 'gen-mt'),
    'early-date': yr(-1915, 'Bible Hub: 1916 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'joseph-sold', label: 'Joseph sold into Egypt', group: 'patriarchs', ref: 'Gen 37:2, 28', datings: {
    ussher: yr(-1727, 'Annals §128: 2276c AM, 1728 BC (Joseph 17)', UA), 'seder-olam': am(S.get('abraham') + 268, 'derived: Joseph 17 (Gen 37:2) = AM 2216', 'gen-mt'),
    'early-date': yr(-1897, 'Bible Hub: 1898 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'joseph-egypt', label: 'Joseph over Egypt', group: 'patriarchs', ref: 'Gen 41:46', datings: {
    ussher: yr(-1714, 'Annals §131: 2289b AM, 1715 BC (Joseph 30)', UA), 'seder-olam': am(S.get('abraham') + 281, 'derived: Joseph 30 (Gen 41:46) = AM 2229', 'gen-mt'),
    'early-date': yr(-1885, 'Bible Hub: 1886 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'descent', label: 'Jacob\'s family moves to Egypt', group: 'patriarchs', ref: 'Gen 46:6; 47:9', datings: {
    ussher: yr(-1705, 'Annals §135: 2298b AM, 1706 BC (ABR: AM 2298)', UA), 'seder-olam': am(2448 - 210, 'derived: Exodus AM 2448 − 210 years in Egypt = AM 2238', 'seder-olam-sojourn'),
    'early-date': yr(-1874, 'Bible Hub: 1875 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'moses', label: 'Moses born', group: 'exodus', ref: 'Ex 2:2; 7:7', datings: {
    ussher: yr(-1570, 'Annals §162: 2433 AM, 1571 BC', UA), 'seder-olam': am(2448 - 80, 'derived: Exodus AM 2448 − 80 (Ex 7:7) = AM 2368', 'gen-mt'),
    'early-date': yr(-1524, 'Bible Hub: 1525 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'exodus', label: 'The Exodus', group: 'exodus', ref: 'Ex 12:40–41', datings: {
    ussher: yr(-1490, 'Annals §172: 2513b AM, 1491 BC (ABR: AM 2513 = 1491 BC)', UA),
    'seder-olam': am(2448, 'Seder Olam: Exodus AM 2448 (popular date 1313 BCE)', 'wiki-seder-olam'),
    'early-date': yr(-1445, 'Bible Hub: 1446 BC (480 years before the Temple of 966 BC, 1 Kgs 6:1)', 'biblehub'),
    historical: rng(-1299, -1200, 'if historical, the 13th century BCE under Ramesses II; 1130 and 1525 BCE also proposed; no consensus on historicity', 'wiki-exodus') } },
  { id: 'entry', label: 'Entry into Canaan', group: 'exodus', ref: 'Josh 4:19; Num 14:33', datings: {
    ussher: yr(-1450, 'Annals §290: 2553b AM, 1451 BC', UA), 'seder-olam': am(2488, 'derived: Exodus + 40 (Num 14:33) = AM 2488', 'gen-mt'),
    'early-date': yr(-1405, 'Bible Hub: 1406 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'saul', label: 'Saul becomes king', group: 'monarchy', ref: '1 Sam 10; Acts 13:21', datings: {
    ussher: yr(-1094, 'Annals: 2909c AM, 1095 BC (Saul 40 years, Acts 13:21)', UA), 'seder-olam': am(2928 - 4 - 40 - 2, 'derived: Temple AM 2928 − 4 (Solomon) − 40 (David) − 2 (Saul, per Seder Olam) = AM 2882', 'je-seder-olam'),
    'early-date': yr(-1042, 'Bible Hub: 1043 BC', 'biblehub'), historical: rng(-1029, -1010, 'Galil: c. 1030–1010 BCE (Albright–Thiele c. 1021–1000)', 'wiki-monarchy') } },
  { id: 'david', label: 'David becomes king', group: 'monarchy', ref: '2 Sam 5:4', datings: {
    ussher: yr(-1054, 'Annals: 2949c AM, 1055 BC', UA), 'seder-olam': am(2928 - 4 - 40, 'derived: Temple AM 2928 − 4 − 40 = AM 2884', 'je-seder-olam'),
    'early-date': yr(-1009, 'Bible Hub: 1010 BC', 'biblehub'), historical: rng(-1007, -970, 'Galil: c. 1008–970 BCE', 'wiki-monarchy') } },
  { id: 'solomon', label: 'Solomon becomes king', group: 'monarchy', ref: '1 Kgs 2:12', datings: {
    ussher: yr(-1014, 'Annals §459: 2990a AM, 1015 BC', UA), 'seder-olam': am(2928 - 4, 'derived: Temple in Solomon\'s 4th year (1 Kgs 6:1) = AM 2924', 'je-seder-olam'),
    'early-date': yr(-969, 'derived: Temple 966 BC in Solomon\'s 4th year (1 Kgs 6:1) = 970 BC', 'biblehub'), historical: rng(-969, -931, 'Galil: c. 970–931 BCE', 'wiki-monarchy') } },
  { id: 'temple-founded', label: 'Solomon\'s Temple founded', group: 'monarchy', ref: '1 Kgs 6:1', datings: {
    ussher: yr(-1011, 'Annals §464: 2992c AM, 1012 BC (Wikipedia: Temple 1012 BC)', UA), 'seder-olam': am(2928, 'Seder Olam: 480 years after the Exodus (1 Kgs 6:1) = AM 2928 (popular date 833 BCE)', 'je-seder-olam'),
    'early-date': yr(-965, 'Bible Hub: 966 BC', 'biblehub'), historical: rng(-966, -957, 'c. 966 BCE (1 Kgs 6:1 reckoning) to c. 958/9 BCE (Josephus-based)', 'wiki-solomon-temple') } },
  { id: 'temple-dedicated', label: 'Solomon\'s Temple dedicated', group: 'monarchy', ref: '1 Kgs 6:38; 8', datings: {
    ussher: yr(-1004, 'Annals §467: 3000a AM, 1005 BC (11th year, month Bul)', UA), 'seder-olam': am(2928 + 7, 'derived: seven years of building (1 Kgs 6:38) = AM 2935', 'gen-mt'),
    'early-date': yr(-958, 'Bible Hub: 959 BC', 'biblehub'), historical: NO_HIST } },
  { id: 'division', label: 'Kingdom divided', group: 'monarchy', ref: '1 Kgs 12', datings: {
    ussher: yr(-974, 'Annals §475: 3029c AM, 975 BC', UA), 'seder-olam': am(2924 + 40, 'derived: Solomon 40 years (1 Kgs 11:42) = AM 2964', 'gen-mt'),
    'early-date': yr(-930, 'Bible Hub: 931 BC', 'biblehub'), historical: rng(-930, -926, 'c. 930 BCE (also 926)', 'wiki-monarchy') } },
  { id: 'samaria', label: 'Fall of Samaria', group: 'exile', ref: '2 Kgs 17:5–6', datings: {
    ussher: yr(-720, 'Annals: 3283 AM, 721 BC ("Shalmaneser took Samaria")', UA), 'seder-olam': am(3205, 'Seder Olam reckoning: Samaria destroyed AM 3205', 'wiki-seder-olam'),
    'early-date': yr(-721, 'Bible Hub: 722 BC', 'biblehub'), historical: rng(-721, -720, '722–720 BCE (Shalmaneser V; Sargon II claims the capture)', 'wiki-samaria', 'APPROXIMATE') } },
  { id: 'jerusalem-597', label: 'Jerusalem taken; Jehoiachin exiled', group: 'exile', ref: '2 Kgs 24:10–16', datings: {
    ussher: yr(-598, 'Annals §793: 3405c AM, 599 BC', UA), 'seder-olam': am(3328, 'Seder Olam reckoning: Jehoiachin\'s exile 433 BCE = AM 3328', 'wiki-seder-olam'),
    'early-date': yr(-596, 'Bible Hub: 597 BC', 'biblehub'), historical: day(1503444n, '16 March 597 BC (Julian) = 2 Adar of Nebuchadnezzar\'s 7th year, Babylonian Chronicle BM 21946', 'wiki-597', 'EXACT') } },
  { id: 'temple-destroyed', label: 'First Temple destroyed', group: 'exile', ref: '2 Kgs 25:8–9', datings: {
    ussher: yr(-587, 'Annals §843: 3416c AM, 588 BC (Wikipedia: Ussher 588 BC)', UA), 'seder-olam': am(3338, 'Seder Olam: 3,338 years after creation (popular date 423/422 BCE)', 'je-seder-olam'),
    'early-date': yr(-585, 'Bible Hub: 586 BC', 'biblehub'), historical: rng(-586, -585, 'Tammuz/Av 587 BC (Albright, Young) or 586 BC (Thiele)', 'wiki-587', 'APPROXIMATE') } },
  { id: 'babylon-falls', label: 'Babylon falls to Cyrus', group: 'exile', ref: 'Dan 5:30–31', datings: {
    ussher: yr(-537, 'Annals §935: 3466b AM, 538 BC', UA), 'seder-olam': NO_SO, 'early-date': none('not on the Bible Hub timeline'),
    historical: day(1524838n, '12 October 539 BC (Julian) = 16 Tašrîtu, Babylonian Chronicle; Cyrus entered 28/29 October', 'wiki-babylon', 'EXACT') } },
  { id: 'cyrus-decree', label: 'Decree of Cyrus; return from exile', group: 'exile', ref: 'Ezra 1:1–4', datings: {
    ussher: yr(-535, 'Annals §951: 3468c AM, 536 BC', UA), 'seder-olam': am(3390, 'Seder Olam reckoning: return under Cyrus 370 BCE = AM 3390', 'wiki-seder-olam'),
    'early-date': yr(-536, 'Bible Hub: 537 BC', 'biblehub'), historical: yr(-537, '538 BCE, Cyrus\' first regnal year over Babylon', 'wiki-chronology-bible') } },
  { id: 'second-temple', label: 'Second Temple completed', group: 'exile', ref: 'Ezra 6:15', datings: {
    ussher: yr(-514, 'Annals §1032: 3489 AM, 515 BC (3 Adar, 6th year of Darius)', UA), 'seder-olam': am(3408, 'Seder Olam: 70 years after AM 3338 = AM 3408', 'je-seder-olam'),
    'early-date': yr(-514, 'Bible Hub: 515 BC', 'biblehub'), historical: rng(-515, -514, 'spring 516 BCE (3 Adar, Darius year 6); 515 BCE by another count', 'wiki-2nd-temple') } },
  { id: 'ezra', label: 'Ezra comes to Jerusalem', group: 'exile', ref: 'Ezra 7:7–9', datings: {
    ussher: yr(-466, 'Annals §1203: 3537c AM, 467 BC', UA), 'seder-olam': NO_SO, 'early-date': yr(-457, 'Bible Hub: 458 BC', 'biblehub'),
    historical: yr(-457, '458 BCE (7th year of Artaxerxes I); 398 BCE if Artaxerxes II', 'wiki-ezra') } },
  { id: 'nehemiah', label: 'Nehemiah rebuilds the walls', group: 'exile', ref: 'Neh 2:1', datings: {
    ussher: yr(-453, 'Annals §1227: 3550c AM, 454 BC', UA), 'seder-olam': NO_SO, 'early-date': yr(-443, 'Bible Hub: 444 BC', 'biblehub'),
    historical: yr(-444, '445 BCE (20th year of Artaxerxes I)', 'wiki-ezra') } },
  { id: 'maccabees', label: 'Rededication of the Temple (Hanukkah)', group: 'exile', ref: '1 Macc 4:52–59', datings: {
    ussher: yr(-164, 'Annals §3418–3423: 3840a AM, 165 BC', UA), 'seder-olam': NO_SO, 'early-date': none('not on the Bible Hub timeline'),
    historical: yr(-163, '25 Kislev 164 BCE', 'wiki-2nd-temple') } },
  { id: 'herod-dies', label: 'Death of Herod the Great', group: 'nt', ref: 'Matt 2:19', datings: {
    ussher: yr(-3, '4 BC (Wikipedia: Ussher followed Josephus)', 'wiki-ussher'), 'seder-olam': NO_SO, 'early-date': none('not on the Bible Hub timeline'),
    historical: yr(-3, '4 BC, after the lunar eclipse of 13 March; 1 BC is a minority view', 'wiki-jesus') } },
  { id: 'nativity', label: 'Birth of Jesus', group: 'nt', ref: 'Matt 2:1; Luke 2:1–7', datings: {
    ussher: yr(-4, 'Annals §6047 ff.: 4000a AM, 5 BC (Wikipedia: Ussher chose 5 BC)', 'wiki-ussher'), 'seder-olam': NO_SO,
    'early-date': yr(-4, 'Bible Hub: 5 BC', 'biblehub'), historical: rng(-5, -3, 'between 6 BC and 4 BC (most scholars)', 'wiki-jesus') } },
  { id: 'crucifixion', label: 'Crucifixion', group: 'nt', ref: 'Matt 27; Mark 15; Luke 23; John 19', datings: {
    ussher: yr(33, 'Annals §6400 ff.: 4036 AM, JP 4746 = AD 33', UA), 'seder-olam': NO_SO, 'early-date': yr(30, 'Bible Hub: AD 30', 'biblehub'),
    historical: alt([{ jdn: 1732112n, label: 'Friday 7 April AD 30' }, { jdn: 1733204n, label: 'Friday 3 April AD 33' }], 'the two leading candidates; 3 April AD 33 is the anchor\'s own basis (Humphreys & Waddington 1983) and the day before Sabbath #1', 'wiki-jesus') } },
  { id: 'second-temple-destroyed', label: 'Second Temple destroyed', group: 'nt', ref: 'Luke 21:6', datings: {
    ussher: yr(70, 'Annals §6980: 4074a AM, AD 70', UA), 'seder-olam': am(3828, 'Seder Olam: AM 3828 (68 CE)', 'je-seder-olam'),
    'early-date': none('not on the Bible Hub timeline'), historical: yr(70, 'Tisha B\'Av AD 70 (4 or 30 August)', 'wiki-2nd-temple') } },
]);

export const GROUPS = Object.freeze({ primeval: 'Primeval (Genesis 1–11)', patriarchs: 'Patriarchs', exodus: 'Exodus', monarchy: 'Monarchy', exile: 'Exile and return', nt: 'New Testament' });

/** Creation-epoch conventions drawn on the row under every system (doc 08 §4). */
export const EPOCHS = Object.freeze([
  { id: 'epoch-hebrew', jdn: 347998n, label: 'Hebrew AM epoch', detail: 'Monday 7 October 3761 BC (Julian): 1 Tishri AM 1, the molad of the "year of chaos" — a calendar convention, not a Creation-day claim', source: 'doc-08' },
  { id: 'epoch-byzantine', jdn: -290495n, label: 'Byzantine era epoch', detail: 'Saturday 1 September 5509 BC (Julian): the Septuagint-based civil era of Constantinople', source: 'doc-08' },
]);

/* ---------- resolution ---------- */
const dayText = civilDayLabel;

/**
 * Resolve one dating under a system to a position.
 * @returns {null | {kind: string, start: bigint, end: bigint, jump: bigint, points: {jdn: bigint, label: string}[], figure: string, basis: string, source: string, sourceText: string, certainty: string, reason?: string}}
 */
export function resolveDating(systemId, dating, era = 'BC/AD') {
  const system = getSystem(systemId);
  if (!dating || dating.kind === 'none') return null;
  const common = { basis: dating.basis, source: dating.source, sourceText: SOURCES[dating.source], certainty: dating.certainty || INTERPRETATION };
  if (dating.kind === 'am') {
    const band = system.amBand(dating.am);
    return { kind: 'band', ...band, jump: band.start, points: [], figure: `${system.amLabel(dating.am)} · ${bandYearLabel(band, era)}`, ...common };
  }
  if (dating.kind === 'year') {
    const band = yearBand(dating.year);
    return { kind: 'band', ...band, jump: band.start, points: [], figure: yearLabel(toBigInt(dating.year), era), ...common };
  }
  if (dating.kind === 'range') {
    const band = rangeBand(dating.from, dating.to);
    return { kind: 'band', ...band, jump: band.start, points: [], figure: `c. ${yearLabel(toBigInt(dating.from), era)} – ${yearLabel(toBigInt(dating.to), era)}`, ...common };
  }
  if (dating.kind === 'day') {
    return { kind: 'day', start: dating.jdn, end: dating.jdn, jump: dating.jdn, points: [{ jdn: dating.jdn, label: dayText(dating.jdn, era) }], figure: dayText(dating.jdn, era), ...common };
  }
  if (dating.kind === 'alt') {
    const js = dating.days.map(d => d.jdn);
    const start = js.reduce((a, b) => (a < b ? a : b)), end = js.reduce((a, b) => (a > b ? a : b));
    return { kind: 'alt', start, end, jump: end, points: dating.days.map(d => ({ jdn: d.jdn, label: d.label })), figure: dating.days.map(d => d.label).join(' or '), ...common };
  }
  throw new TypeError(`unknown dating kind ${dating.kind}`);
}

/** All events resolved under one system (events without a figure get `position: null`). */
export function resolvedEvents(systemId, era) {
  return EVENTS.map(e => ({ event: e, dating: e.datings[systemId], position: resolveDating(systemId, e.datings[systemId], era) }));
}

/** Events whose position overlaps [start, end] under a system. */
export function eventsBetween(systemId, start, end, era) {
  const s = toBigInt(start), t = toBigInt(end);
  return resolvedEvents(systemId, era).filter(r => r.position && r.position.end >= s && r.position.start <= t);
}

/** Events containing the day, plus the nearest before and after. */
export function eventsAround(systemId, jdn, era) {
  const j = toBigInt(jdn);
  const all = resolvedEvents(systemId, era).filter(r => r.position);
  const containing = all.filter(r => r.position.start <= j && r.position.end >= j);
  let previous = null, next = null;
  for (const r of all) {
    if (r.position.end < j && (!previous || r.position.end > previous.position.end)) previous = r;
    if (r.position.start > j && (!next || r.position.start < next.position.start)) next = r;
  }
  return { containing, previous, next };
}

export function getEvent(id) { const e = EVENTS.find(x => x.id === id); if (!e) throw new RangeError(`unknown event ${id}`); return e; }
export { SYSTEMS, SOURCES, getSystem, INTERPRETATION };
