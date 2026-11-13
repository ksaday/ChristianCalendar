/* ============================================================
   Sabbath Calendar v2 — markers/genesis.js
   The Masoretic begetting ages of Genesis 5 and 11 (verified
   against the KJV text, 2026-11-12) and the Anno Mundi years that
   follow from them by addition (doc 17 §3.2). Pure arithmetic on
   the text's own numbers; no calendar, no JDN, no Creation date.
   Both the Ussher and the Seder Olam systems use these sums; they
   differ only in Abram's birth (Terah 70 vs 130).
   ============================================================ */

/** @typedef {{id: string, name: string, ageAtSon: number|null, lifespan: number|null, son?: string, ref: string}} Patriarch */

/** Genesis 5 (Adam → Noah) and 11:10–32 (Shem → Terah), Masoretic numbers. */
export const PATRIARCHS = Object.freeze([
  { id: 'adam', name: 'Adam', ageAtSon: 130, lifespan: 930, son: 'seth', ref: 'Gen 5:3–5' },
  { id: 'seth', name: 'Seth', ageAtSon: 105, lifespan: 912, son: 'enosh', ref: 'Gen 5:6–8' },
  { id: 'enosh', name: 'Enosh', ageAtSon: 90, lifespan: 905, son: 'kenan', ref: 'Gen 5:9–11' },
  { id: 'kenan', name: 'Kenan', ageAtSon: 70, lifespan: 910, son: 'mahalalel', ref: 'Gen 5:12–14' },
  { id: 'mahalalel', name: 'Mahalalel', ageAtSon: 65, lifespan: 895, son: 'jared', ref: 'Gen 5:15–17' },
  { id: 'jared', name: 'Jared', ageAtSon: 162, lifespan: 962, son: 'enoch', ref: 'Gen 5:18–20' },
  { id: 'enoch', name: 'Enoch', ageAtSon: 65, lifespan: 365, son: 'methuselah', ref: 'Gen 5:21–24' },
  { id: 'methuselah', name: 'Methuselah', ageAtSon: 187, lifespan: 969, son: 'lamech', ref: 'Gen 5:25–27' },
  { id: 'lamech', name: 'Lamech', ageAtSon: 182, lifespan: 777, son: 'noah', ref: 'Gen 5:28–31' },
  { id: 'noah', name: 'Noah', ageAtSon: 500, lifespan: 950, son: 'shem', ref: 'Gen 5:32; 9:29' },
  // Shem begat Arpachshad "two years after the flood" (Gen 11:10); the Flood was in Noah's 600th year (Gen 7:11).
  { id: 'shem', name: 'Shem', ageAtSon: null, lifespan: 600, son: 'arpachshad', ref: 'Gen 11:10–11' },
  { id: 'arpachshad', name: 'Arpachshad', ageAtSon: 35, lifespan: 438, son: 'shelah', ref: 'Gen 11:12–13' },
  { id: 'shelah', name: 'Shelah', ageAtSon: 30, lifespan: 433, son: 'eber', ref: 'Gen 11:14–15' },
  { id: 'eber', name: 'Eber', ageAtSon: 34, lifespan: 464, son: 'peleg', ref: 'Gen 11:16–17' },
  { id: 'peleg', name: 'Peleg', ageAtSon: 30, lifespan: 239, son: 'reu', ref: 'Gen 11:18–19' },
  { id: 'reu', name: 'Reu', ageAtSon: 32, lifespan: 239, son: 'serug', ref: 'Gen 11:20–21' },
  { id: 'serug', name: 'Serug', ageAtSon: 30, lifespan: 230, son: 'nahor', ref: 'Gen 11:22–23' },
  { id: 'nahor', name: 'Nahor', ageAtSon: 29, lifespan: 148, son: 'terah', ref: 'Gen 11:24–25' },
  { id: 'terah', name: 'Terah', ageAtSon: 70, lifespan: 205, son: 'abraham', ref: 'Gen 11:26, 32' },
]);

/** Noah's age when the Flood began (Gen 7:11) and the gap to Arpachshad's birth (Gen 11:10). */
export const FLOOD_IN_NOAHS_YEAR = 600;
export const ARPACHSHAD_AFTER_FLOOD = 2;

/**
 * Anno Mundi of each birth as the traditions reckon it: the count starts at Adam's creation
 * (Adam = 0), so a son born when his father was N is born in AM (father's AM + N) — Seth AM 130,
 * the Flood AM 1656, Abram AM 1948 (or 2008). Adam's own creation is displayed as AM 1.
 * @param {{abramAtTerah?: number}} [opts] 70 (Gen 11:26; Seder Olam) or 130 (Ussher: Gen 11:32 + 12:4 + Acts 7:4)
 * @returns {Map<string, number>} id → AM of birth (Flood under 'flood')
 */
export function birthYears(opts = {}) {
  const abramAtTerah = opts.abramAtTerah ?? 70;
  const am = new Map([['adam', 0]]);
  let flood = null;
  for (const p of PATRIARCHS) {
    const born = am.get(p.id);
    if (p.id === 'noah') { flood = born + FLOOD_IN_NOAHS_YEAR; am.set('flood', flood); am.set('shem', born + p.ageAtSon); continue; }
    if (p.id === 'shem') { am.set('arpachshad', flood + ARPACHSHAD_AFTER_FLOOD); continue; }
    if (p.id === 'terah') { am.set('abraham', born + abramAtTerah); continue; }
    am.set(p.son, born + p.ageAtSon);
  }
  return am;
}

/** Anno Mundi of each death (Enoch: his translation, Gen 5:24). */
export function deathYears(opts = {}) {
  const births = birthYears(opts);
  const out = new Map();
  for (const p of PATRIARCHS) out.set(p.id, births.get(p.id) + p.lifespan);
  return out;
}
