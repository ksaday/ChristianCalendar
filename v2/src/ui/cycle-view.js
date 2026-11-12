/* ============================================================
   Sabbath Calendar v2 — ui/cycle-view.js
   Seven-day cycle detail: Sunday → Saturday, Sabbath last (REQ-UI-06).
   ============================================================ */

import { describeCursor } from '../timeline/cursor.js';
import { DAY_NAMES } from '../core/chronology.js';
import { fmtInt, sabbathLabel } from './format.js';
import { adapters } from '../calendars/registry.js';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SHORT = { julian: 'Jul.', gregorian: 'Greg.', hebrew: 'Heb.', chinese: 'Chin.' };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Compact per-cell label. */
function shortLabel(c, era) {
  const d = c.date;
  if (!d) return '—';
  if (c.id === 'gregorian' || c.id === 'julian') {
    const y = d.year <= 0n ? `${1n - d.year} ${era === 'BCE/CE' ? 'BCE' : 'BC'}` : d.year < 1000n ? (era === 'BCE/CE' ? `${d.year} CE` : `AD ${d.year}`) : `${d.year}`;
    return `${d.day} ${MON[d.month - 1]} ${y}`;
  }
  if (c.id === 'hebrew') return `${d.day} ${d.extras.monthName} ${d.year}`;
  if (c.id === 'chinese') return `${d.extras.stemBranch} ${d.leapMonth ? '閏' : ''}${d.month}/${d.day}`;
  return c.label;
}

/**
 * @param {HTMLElement} root
 * @param {ReturnType<typeof describeCursor>} d cursor description
 * @param {{era: string}} opts
 */
export function renderCycleView(root, d, opts) {
  const first = d.day.cycleFirst, cycle = d.day.cycle;
  const days = [];
  for (let k = 0n; k < 7n; k++) days.push(describeCursor(first + k, opts));
  const gregFirst = days[0].calendars.find(c => c.id === 'gregorian').label ?? '';
  const gregLast = days[6].calendars.find(c => c.id === 'gregorian').label ?? '';
  const head = days.map((x, i) => {
    const sab = i === 6, cur = x.day.jdn === d.day.jdn;
    return `<th class="${sab ? 'sab' : ''} ${cur ? 'cursor-col' : ''}" scope="col"><span class="dow">${esc(DAY_NAMES[x.day.dayOfWeek].slice(0, 3))}</span>${sab ? '<br><span class="seal-inline ' + (cycle <= 0n ? 'pre' : '') + '">#' + esc(fmtInt(cycle)) + '</span>' : ''}</th>`;
  }).join('');
  const rowJdn = days.map((x) => `<td class="${x.day.jdn === d.day.jdn ? 'cursor-col' : ''} ${x.day.isSabbath ? 'sab-col' : ''}"><a href="#" class="jump-link" data-jdn="${x.day.jdn}" title="Set the cursor to this day">${esc(fmtInt(x.day.jdn))}</a></td>`).join('');
  const calRows = adapters.map(a => `<tr><th scope="row">${esc(SHORT[a.id] ?? a.name)}</th>${days.map(x => {
    const c = x.calendars.find(y => y.id === a.id);
    return `<td class="cell-cal ${x.day.jdn === d.day.jdn ? 'cursor-col' : ''} ${x.day.isSabbath ? 'sab-col' : ''}"><span class="cert-dot ${c.support.certainty}" title="${esc(c.support.certainty.toLowerCase())}: ${esc(c.support.reason)}"></span>${esc(shortLabel(c, opts.era))}</td>`;
  }).join('')}</tr>`).join('');
  root.innerHTML = `<h2>Cycle #${esc(fmtInt(cycle))} <span class="sub">(${esc(gregFirst)} → ${esc(gregLast)}, ending on ${esc(sabbathLabel(cycle))})</span></h2>
    <div class="cycle-nav"><button class="btn jump" data-jdn="${first - 7n}">◀ cycle #${esc(fmtInt(cycle - 1n))}</button><span>Sunday → Saturday · civil days</span><button class="btn jump" data-jdn="${first + 7n}">cycle #${esc(fmtInt(cycle + 1n))} ▶</button></div>
    <table class="cycle-table"><thead><tr><th scope="col"></th>${head}</tr></thead><tbody><tr><th scope="row">JDN</th>${rowJdn}</tr>${calRows}</tbody></table>`;
}
