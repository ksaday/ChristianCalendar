/* ============================================================
   Sabbath Calendar v2 — timeline/url-state.js
   Hash ⇄ {cursorJdn, level}. Decimal strings, never Number.
   ============================================================ */

import { toBigInt } from '../core/bigint-math.js';
import { isLevel } from './zoom.js';

/** @param {{cursorJdn: bigint, level: string}} s */
export function serialize(s) {
  return `#j=${s.cursorJdn.toString()}&z=${s.level}`;
}

/**
 * @param {string} hash e.g. "#j=2461142&z=week"
 * @returns {{cursorJdn: bigint, level: string} | null} null when absent or malformed
 */
export function parse(hash) {
  if (!hash || hash[0] !== '#') return null;
  const params = new URLSearchParams(hash.slice(1));
  const j = params.get('j'), z = params.get('z');
  if (j === null || z === null) return null;
  try {
    if (!isLevel(z)) return null;
    return { cursorJdn: toBigInt(j, 'j'), level: z };
  } catch { return null; }
}
