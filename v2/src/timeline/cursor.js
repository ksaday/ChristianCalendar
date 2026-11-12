/* ============================================================
   Sabbath Calendar v2 — timeline/cursor.js
   Everything derived from the cursor JDN: the core descriptor
   plus every adapter's date and support. Pure.
   ============================================================ */

import { describeDay } from '../core/chronology.js';
import { adapters } from '../calendars/registry.js';
import { isUnsupported } from '../calendars/adapter.js';
import { anniversaryOf, isMilestone } from './sabbath-row-rules.js';

/**
 * @param {bigint} jdn
 * @param {{era?: 'BC/AD'|'BCE/CE'}} [opts]
 */
export function describeCursor(jdn, opts = {}) {
  const day = describeDay(jdn);
  const calendars = adapters.map(a => {
    const date = a.fromJdn(jdn);
    const support = a.support(jdn);
    return { id: a.id, name: a.name, date: isUnsupported(date) ? null : date, label: isUnsupported(date) ? null : a.format(date, { era: opts.era }), support };
  });
  return {
    day,
    anniversary: day.isSabbath ? anniversaryOf(jdn) : null,
    milestone: day.isSabbath ? isMilestone(day.sabbathIndex) : false,
    calendars,
  };
}
