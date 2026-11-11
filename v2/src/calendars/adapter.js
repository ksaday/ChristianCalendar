/* ============================================================
   Sabbath Calendar v2 — calendars/adapter.js
   The calendar adapter contract (doc 07 §2, doc 10 §2, ADR-014).
   A calendar is a labeling function on JDN. The Sabbath index is
   always EXACT; a calendar label carries its own certainty.
   Pure: adapters may import only ../core/*.js and sibling files.
   ============================================================ */

import { ChronologyInputError } from '../core/bigint-math.js';

/** Certainty of a calendar label (never applies to Sabbath indices, which are always exact). */
export const Certainty = Object.freeze({
  /** The label is what that calendar assigned to that day, by rule, while the rule was in force. */
  EXACT: 'EXACT',
  /** A standard proleptic or calculated extension of the rule outside its historical period. */
  CONVENTIONAL: 'CONVENTIONAL',
  /** A reconstruction with known or possible errors. */
  APPROXIMATE: 'APPROXIMATE',
  /** No defensible label; the adapter declines rather than fabricate. */
  UNSUPPORTED: 'UNSUPPORTED',
});

/** Thrown for a malformed CalendarDate (bad month, day out of range, wrong calendarId). */
export class CalendarDateError extends ChronologyInputError {
  constructor(message) { super(message); this.name = 'CalendarDateError'; }
}

/**
 * @typedef {{unsupported: true, reason: string}} Unsupported
 */

/** Build an Unsupported value. */
export function unsupported(reason) {
  return Object.freeze({ unsupported: true, reason });
}

/** @returns {x is Unsupported} */
export function isUnsupported(x) {
  return typeof x === 'object' && x !== null && x.unsupported === true;
}

/**
 * @typedef {{certainty: string, reason: string, sourceId: string}} Support
 */

/** Build a Support value. */
export function support(certainty, reason, sourceId) {
  if (!Object.values(Certainty).includes(certainty)) throw new TypeError(`unknown certainty ${certainty}`);
  return Object.freeze({ certainty, reason, sourceId });
}

/**
 * Minimal structural validation of an adapter object (used by the registry and tests).
 * @param {object} a
 */
export function assertAdapter(a) {
  const required = ['id', 'name', 'variant', 'mathRange', 'fields', 'fromJdn', 'toJdn', 'support', 'format', 'nextBoundary'];
  for (const k of required) if (!(k in a)) throw new TypeError(`adapter ${a && a.id}: missing ${k}`);
  if (typeof a.mathRange.minJdn !== 'bigint' || typeof a.mathRange.maxJdn !== 'bigint') {
    throw new TypeError(`adapter ${a.id}: mathRange must be BigInt`);
  }
  return a;
}
