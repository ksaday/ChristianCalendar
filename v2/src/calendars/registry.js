/* Ordered list of calendar adapters (REQ-CAL-01). Adding an adapter touches only this file. */
import { assertAdapter } from './adapter.js';
import { gregorian } from './gregorian.js';
import { julian } from './julian.js';
import { hebrew } from './hebrew.js';
import { chinese } from './chinese/chinese.js';

export const adapters = Object.freeze([julian, gregorian, hebrew, chinese].map(assertAdapter));

const byId = new Map(adapters.map(a => [a.id, a]));

/** @param {string} id */
export function getAdapter(id) {
  const a = byId.get(id);
  if (!a) throw new RangeError(`unknown calendar adapter ${id}`);
  return a;
}

export { gregorian, julian, hebrew, chinese };
