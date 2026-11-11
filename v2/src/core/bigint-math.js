/* ============================================================
   Sabbath Calendar v2 — core/bigint-math.js
   Arbitrary-precision integer helpers with mathematical floor
   semantics. Every division or modulo in the core goes through
   floorDiv / floorMod (REQ-CORE-03, ADR-002).
   Pure: no Date, Intl, DOM, clock, random or network access.
   ============================================================ */

/** Thrown when an input is not an integer in an accepted form (REQ-CORE-14). */
export class ChronologyInputError extends TypeError {
  constructor(message) {
    super(message);
    this.name = 'ChronologyInputError';
  }
}

const INTEGER_STRING = /^[+\-−]?\d+$/;

/**
 * Normalize an IntegerInput to a BigInt.
 * Accepts: bigint; number that is a safe integer; string of optional sign
 * (ASCII '+', '-', or U+2212 MINUS SIGN) followed by digits. Thousands
 * separators ',' and '_' and interior spaces are tolerated so that formatted
 * values produced by the presentation layer round-trip.
 * Everything else throws ChronologyInputError. Nothing is ever coerced silently.
 * @param {bigint|number|string} value
 * @param {string} [label] name used in error messages
 * @returns {bigint}
 */
export function toBigInt(value, label = 'value') {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new ChronologyInputError(
        `${label} must be a safe integer when given as a number; got ${String(value)}`);
    }
    return BigInt(value);
  }
  if (typeof value === 'string') {
    const s = value.replace(/[,_\s]/g, '');
    if (!INTEGER_STRING.test(s)) {
      throw new ChronologyInputError(`${label} must be a signed decimal integer string; got ${JSON.stringify(value)}`);
    }
    return BigInt(s.replace('−', '-').replace(/^\+/, ''));
  }
  throw new ChronologyInputError(`${label} must be a bigint, safe-integer number, or integer string; got ${typeof value}`);
}

/**
 * Mathematical floor division: ⌊a / b⌋.
 * BigInt's native '/' truncates toward zero; this corrects the result when the
 * operands have opposite signs and the division is inexact.
 * @param {bigint} a
 * @param {bigint} b non-zero
 * @returns {bigint}
 */
export function floorDiv(a, b) {
  if (b === 0n) throw new RangeError('floorDiv: division by zero');
  const q = a / b;
  return (a % b !== 0n && ((a < 0n) !== (b < 0n))) ? q - 1n : q;
}

/**
 * Mathematical modulo with the sign of the divisor: a − b·⌊a / b⌋.
 * For b > 0 the result is always in [0, b).
 * @param {bigint} a
 * @param {bigint} b non-zero
 * @returns {bigint}
 */
export function floorMod(a, b) {
  if (b === 0n) throw new RangeError('floorMod: division by zero');
  const r = a % b;
  return (r !== 0n && ((r < 0n) !== (b < 0n))) ? r + b : r;
}

/**
 * Absolute value for BigInt.
 * @param {bigint} a
 * @returns {bigint}
 */
export function absBig(a) {
  return a < 0n ? -a : a;
}
