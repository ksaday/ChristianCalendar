/* ============================================================
   Sabbath Calendar v2 — markers/recorded-eclipses.js
   Historically recorded eclipses (doc 17 §4.3). Each entry names
   its record and source; `status` separates a contemporary record
   ('attested') from a debated identification ('disputed') and from
   a modern association with a text ('interpretation'). A test
   requires every entry to coincide with a canon eclipse of the
   same kind on that UT day or the adjacent one.
   Dates: Julian before 15 Oct 1582, Gregorian after; astronomical
   years (0 = 1 BC, −762 = 763 BC). Only eclipses inside the canon's
   span (1999 BC – AD 3000) can be verified, so the legendary Xi–He
   eclipse of 2137 BC is deliberately not listed.
   ============================================================ */

import { civilJdn } from './systems.js';

const WIKI_SOLAR = 'Wikipedia, "List of solar eclipses in antiquity" (retrieved 2026-11-12)';
const WIKI_LUNAR = 'Wikipedia, "Historically significant lunar eclipses" (retrieved 2026-11-12)';
const STEPHENSON = 'Stephenson, F. R., Historical Eclipses and Earth\'s Rotation (Cambridge, 1997)';

/** @type {readonly {id:string, kind:'solar'|'lunar', date:[number,number,number], label:string, record:string, source:string, status:'attested'|'disputed'|'interpretation'}[]} */
export const RECORDED = Object.freeze([
  { id: 'mursili', kind: 'solar', date: [-1311, 6, 24], label: 'Mursili II (Hittite)', record: 'The "omen of the sun" in Mursili II\'s tenth year; 24 Jun 1312 BC is the usual candidate, with 1308 and 1335 BC also argued.', source: WIKI_SOLAR, status: 'disputed' },
  { id: 'double-dawn', kind: 'solar', date: [-898, 4, 21], label: 'Chinese "double dawn"', record: 'The Bamboo Annals\' "day dawned twice" in the first year of King Yi of Zhou, matched to the annular eclipse of 21 Apr 899 BC.', source: WIKI_SOLAR, status: 'disputed' },
  { id: 'bur-sagale', kind: 'solar', date: [-762, 6, 15], label: 'Assyrian eclipse (Bur-Sagale)', record: 'Assyrian eponym list, year of Bur-Sagale: "in the month Simanu an eclipse of the sun took place". Anchors Assyrian chronology; sometimes associated with Amos 8:9 (interpretation).', source: 'Wikipedia, "Assyrian eclipse" (retrieved 2026-11-12); ' + STEPHENSON, status: 'attested' },
  { id: 'archilochus', kind: 'solar', date: [-647, 4, 6], label: 'Archilochus', record: 'Archilochus fr. 122: "Zeus … made night out of noonday".', source: WIKI_SOLAR, status: 'attested' },
  { id: 'thales', kind: 'solar', date: [-584, 5, 28], label: 'Eclipse of Thales', record: 'Herodotus 1.74: the battle between Lydians and Medes halted when day became night; Thales was said to have foretold it.', source: WIKI_SOLAR + '; ' + STEPHENSON, status: 'attested' },
  { id: 'xerxes', kind: 'solar', date: [-479, 10, 2], label: 'Xerxes\' eclipse', record: 'Herodotus 7.37: an eclipse as Xerxes set out from Sardis; the exact eclipse (2 Oct 480 or 17 Feb 478 BC) is debated.', source: WIKI_SOLAR, status: 'disputed' },
  { id: 'thucydides', kind: 'solar', date: [-430, 8, 3], label: 'Thucydides (Peloponnesian War)', record: 'Thucydides 2.28: the sun eclipsed after noon in the first summer of the war; stars became visible.', source: WIKI_SOLAR, status: 'attested' },
  { id: 'phlegon', kind: 'solar', date: [29, 11, 24], label: 'Phlegon\'s eclipse', record: 'Phlegon of Tralles (Olympiades, via Eusebius) placed a great eclipse and a Bithynian earthquake in the 202nd Olympiad; the 24 Nov AD 29 eclipse is the usual identification, and its link to the Crucifixion darkness is contested.', source: 'American Astronomical Society 197 (2001) abstract 1106; Phlegon fr. 16 (Jacoby FGrH 257)', status: 'interpretation' },
  { id: 'mirian', kind: 'solar', date: [319, 5, 6], label: 'Mirian III (Iberia)', record: 'The darkness during Mirian III\'s hunt, preceding the Christianization of Iberia, is thought to be this eclipse.', source: WIKI_SOLAR, status: 'disputed' },
  { id: 'firmicus', kind: 'solar', date: [334, 7, 17], label: 'Firmicus Maternus', record: 'Recorded by Firmicus Maternus in his Mathesis.', source: WIKI_SOLAR, status: 'attested' },
  { id: 'louis-pious', kind: 'solar', date: [840, 5, 5], label: 'Louis the Pious', record: 'Frankish annals: the total eclipse of 5 May 840 terrified the emperor, who died weeks later.', source: STEPHENSON, status: 'attested' },
  { id: 'henry-i', kind: 'solar', date: [1133, 8, 2], label: 'King Henry\'s eclipse', record: 'English chronicles (Anglo-Saxon Chronicle, William of Malmesbury): the eclipse as Henry I left England for the last time.', source: STEPHENSON, status: 'attested' },
  { id: 'igor', kind: 'solar', date: [1185, 5, 1], label: 'Tale of Igor\'s Campaign', record: 'The Hypatian Chronicle and the Tale of Igor\'s Campaign record the eclipse at the start of Igor Svyatoslavich\'s march.', source: STEPHENSON, status: 'attested' },
  { id: 'clavius-1560', kind: 'solar', date: [1560, 8, 21], label: 'Clavius at Coimbra', record: 'Christopher Clavius witnessed totality at Coimbra ("stars appeared").', source: STEPHENSON, status: 'attested' },
  { id: 'clavius-1567', kind: 'solar', date: [1567, 4, 9], label: 'Clavius at Rome', record: 'Clavius saw a thin ring of light around the Moon at Rome — an annular–total (hybrid) eclipse.', source: STEPHENSON, status: 'attested' },
  { id: 'halley-1715', kind: 'solar', date: [1715, 5, 3], label: 'Halley\'s eclipse', record: 'Edmond Halley predicted the path across England to within minutes and gathered timings from observers (22 Apr 1715 Old Style).', source: 'Halley, Phil. Trans. 29 (1715) 245–262', status: 'attested' },
  { id: 'tecumseh-1806', kind: 'solar', date: [1806, 6, 16], label: 'Tecumseh\'s eclipse', record: 'The total eclipse across the United States observed by Bowditch at Salem and foretold by Tenskwatawa.', source: 'Bowditch, Mem. Amer. Acad. Arts Sci. 3 (1809)', status: 'attested' },
  { id: 'baily-1836', kind: 'solar', date: [1836, 5, 15], label: 'Baily\'s beads', record: 'Francis Baily described the beads at the limb during the annular eclipse seen from Scotland.', source: 'Baily, Mem. Roy. Astron. Soc. 10 (1838)', status: 'attested' },
  { id: 'photo-1851', kind: 'solar', date: [1851, 7, 28], label: 'First eclipse photograph', record: 'Berkowski\'s daguerreotype of the corona at Königsberg.', source: 'Schielicke & Wittmann, Acta Historica Astronomiae 25 (2005)', status: 'attested' },
  { id: 'helium-1868', kind: 'solar', date: [1868, 8, 18], label: 'Helium discovered', record: 'Janssen observed the yellow prominence line (helium) at Guntur, India.', source: 'Janssen, C. R. Acad. Sci. 67 (1868)', status: 'attested' },
  { id: 'eddington-1919', kind: 'solar', date: [1919, 5, 29], label: 'Eddington\'s eclipse', record: 'Expeditions to Príncipe and Sobral measured starlight deflection, confirming general relativity.', source: 'Dyson, Eddington & Davidson, Phil. Trans. A 220 (1920) 291–333', status: 'attested' },
  { id: 'se-1991', kind: 'solar', date: [1991, 7, 11], label: 'Great eclipse of 1991', record: 'Totality over Hawaii and Mexico, 6 m 53 s at maximum.', source: 'NASA eclipse bulletins', status: 'attested' },
  { id: 'se-1999', kind: 'solar', date: [1999, 8, 11], label: 'European eclipse of 1999', record: 'Totality across Europe, the Middle East and India.', source: 'NASA eclipse bulletins', status: 'attested' },
  { id: 'se-2017', kind: 'solar', date: [2017, 8, 21], label: 'Great American eclipse', record: 'Totality coast to coast across the United States.', source: 'NASA eclipse bulletins', status: 'attested' },
  { id: 'se-2024', kind: 'solar', date: [2024, 4, 8], label: 'North American eclipse of 2024', record: 'Totality from Mexico through the United States to Canada.', source: 'NASA eclipse bulletins', status: 'attested' },

  { id: 'zhou-shu', kind: 'lunar', date: [-1136, 1, 29], label: 'Zhou-Shu eclipse', record: 'A lunar eclipse in the Zhou-Shu has been tentatively matched to 29 Jan 1137 BC.', source: WIKI_LUNAR, status: 'disputed' },
  { id: 'babylon-721', kind: 'lunar', date: [-720, 3, 19], label: 'Earliest Babylonian eclipse record', record: 'Ptolemy, Almagest IV.6: the first of three Babylonian lunar eclipses in the reign of Mardokempad (Marduk-apla-iddina), 19/20 Mar 721 BC.', source: 'Ptolemy, Almagest IV.6 (Toomer 1984); ' + STEPHENSON, status: 'attested' },
  { id: 'aristophanes', kind: 'lunar', date: [-424, 10, 9], label: 'Aristophanes, The Clouds', record: 'The Clouds (419 BC) alludes to a lunar eclipse two years earlier.', source: WIKI_LUNAR, status: 'interpretation' },
  { id: 'nicias', kind: 'lunar', date: [-412, 8, 27], label: 'Nicias at Syracuse', record: 'Thucydides 7.50: Nicias delayed the Athenian withdrawal after the eclipse (night of 27/28 Aug 413 BC); the fleet was destroyed.', source: WIKI_LUNAR + '; ' + STEPHENSON, status: 'attested' },
  { id: 'gaugamela', kind: 'lunar', date: [-330, 9, 20], label: 'Before Gaugamela', record: 'Arrian 3.7.6 and the Babylonian astronomical diary record the total lunar eclipse eleven days before the battle.', source: STEPHENSON, status: 'attested' },
  { id: 'pydna', kind: 'lunar', date: [-167, 6, 21], label: 'Before Pydna', record: 'Livy 44.37: Sulpicius Gallus explained the eclipse to the Roman army the night before the battle.', source: STEPHENSON, status: 'attested' },
  { id: 'herod', kind: 'lunar', date: [-3, 3, 13], label: 'Josephus\' eclipse (death of Herod)', record: 'Josephus, Antiquities 17.6.4: an eclipse of the moon shortly before Herod\'s death; usually identified with the partial eclipse of 13 Mar 4 BC.', source: 'Wikipedia, "Chronology of Jesus" (retrieved 2026-11-12)', status: 'attested' },
  { id: 'hw-33', kind: 'lunar', date: [33, 4, 3], label: '3 April AD 33 (Humphreys–Waddington)', record: 'Partial lunar eclipse at moonrise over Jerusalem on Friday 3 Apr AD 33, proposed as the "moon turned to blood" of Acts 2:20 — the day before Sabbath #1.', source: 'Humphreys & Waddington, Nature 306 (1983) 743–746', status: 'interpretation' },
  { id: 'constantinople', kind: 'lunar', date: [1453, 5, 22], label: 'Fall of Constantinople', record: 'A partial eclipse during the siege, read as fulfilling a prophecy about the city.', source: WIKI_LUNAR, status: 'attested' },
  { id: 'columbus', kind: 'lunar', date: [1504, 3, 1], label: 'Columbus in Jamaica', record: 'Columbus used the eclipse predicted in Regiomontanus\' almanac (evening of 29 Feb 1504 local) to obtain supplies.', source: WIKI_LUNAR, status: 'attested' },
].map(e => Object.freeze({ ...e, jdn: civilJdn(e.date[0], e.date[1], e.date[2]) })));

/**
 * Find the canon eclipse for a recorded entry: same kind, same UT day, else the adjacent day
 * (records east of Greenwich fall on the local evening). Returns {eclipse, offsetDays} or null.
 * @param {typeof RECORDED[number]} entry
 * @param {{solar?: object, lunar?: object}} sets parsed canon sets by kind
 */
export function matchCanon(entry, sets) {
  const set = sets[entry.kind];
  if (!set) return null;
  for (const off of [0n, 1n, -1n]) {
    const j = entry.jdn + off;
    const i = lowerBoundNum(set.jdns, Number(j));
    if (i < set.rows.length && set.rows[i].jdnNum === Number(j)) return { eclipse: set.rows[i], offsetDays: Number(off) };
  }
  return null;
}
function lowerBoundNum(jdns, x) { let lo = 0, hi = jdns.length; while (lo < hi) { const m = (lo + hi) >>> 1; if (jdns[m] < x) lo = m + 1; else hi = m; } return lo; }

/** Recorded entries with their canon match attached (entries without a match are dropped and reported). */
export function recordedWithCanon(sets) {
  const out = [], missing = [];
  for (const e of RECORDED) {
    const m = matchCanon(e, sets);
    if (m) out.push(Object.freeze({ ...e, canon: m.eclipse, offsetDays: m.offsetDays })); else missing.push(e.id);
  }
  return { entries: Object.freeze(out), missing };
}
