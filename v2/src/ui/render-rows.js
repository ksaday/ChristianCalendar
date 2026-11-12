/* ============================================================
   Sabbath Calendar v2 — ui/render-rows.js
   Paints the synchronized rows as SVG from one viewport. Every
   row is a pure function of (cursorJdn, level, width, options).
   ============================================================ */

import { ANCHOR_JDN } from '../core/chronology.js';
import { adapters } from '../calendars/registry.js';
import { sabbathTicks, calendarTicks, markerTicks } from '../timeline/ticks.js';
import { fmtInt } from './format.js';

export const ROW_H = 58, TOP_PAD = 8, LABEL_W = 96;
const NS = 'http://www.w3.org/2000/svg';
const CHAR_PX = 6.4;

function el(name, attrs = {}, text) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

const clip = (s, maxChars) => (s.length > maxChars ? s.slice(0, Math.max(0, maxChars - 1)) + '…' : s);

function labelFits(lastEnd, x, label) {
  return x >= lastEnd ? x + label.length * CHAR_PX + 6 : null;
}

/**
 * @param {SVGSVGElement} svg
 * @param {{cursorJdn: bigint, rows: Record<string, boolean>, era: string, todayJdn: bigint, describe: any}} state
 * @param {import('../timeline/zoom.js').Viewport} vp
 */
export function renderRows(svg, state, vp) {
  const rowSpecs = [{ id: 'sabbath', name: 'Sabbath', sub: '7-day cycle' }];
  for (const a of adapters) if (state.rows[a.id]) rowSpecs.push({ id: a.id, name: a.name, sub: a.variant.split(',')[0], adapter: a });
  if (state.rows.markers) rowSpecs.push({ id: 'markers', name: 'Markers', sub: 'reference points' });

  const width = vp.widthPx, height = TOP_PAD + rowSpecs.length * ROW_H + 4;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width); svg.setAttribute('height', height);
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const cursorX = vp.x(state.cursorJdn), dayW = Math.max(vp.pxPerDay, 1);
  const desc = state.describe;

  rowSpecs.forEach((row, i) => {
    const y0 = TOP_PAD + i * ROW_H, yLine = y0 + ROW_H * 0.55;
    const g = el('g', { class: `row row-${row.id}`, role: 'list', 'aria-label': `${row.name} row` });
    g.appendChild(el('rect', { class: `row-band ${row.id}`, x: 0, y: y0, width, height: ROW_H }));

    if (row.id === 'sabbath') {
      // shade the cursor's cycle when it is wide enough to see
      if (7 * vp.pxPerDay >= 10) {
        g.appendChild(el('rect', { class: 'cycle-shade', x: vp.x(desc.day.cycleFirst), y: y0 + 4, width: 7 * vp.pxPerDay, height: ROW_H - 8, rx: 4 }));
      }
      g.appendChild(el('line', { class: 'row-line', x1: 0, x2: width, y1: yLine, y2: yLine }));
      let lastEnd = -Infinity;
      for (const t of sabbathTicks(vp, { alwaysLabel: desc.day.cycle })) {
        const x = vp.x(t.jdn) + vp.pxPerDay / 2;
        if (t.weight === 'minor') { g.appendChild(el('line', { class: 'tick minor', x1: x, x2: x, y1: yLine - 5, y2: yLine + 5 })); continue; }
        const w = t.label.length * CHAR_PX + 10;
        const seal = el('g', { class: `seal ${t.kind} ${t.label.includes('−') || t.label === '#0' ? 'pre' : ''}`, role: 'listitem', 'data-jdn': t.jdn.toString(), tabindex: 0, 'aria-label': `${t.label.replace('#', 'Sabbath number ')}${t.title ? ', ' + t.title : ''}` });
        seal.appendChild(el('line', { class: 'tick', x1: x, x2: x, y1: yLine - 10, y2: yLine + 10 }));
        const fits = labelFits(lastEnd, x - w / 2, t.label);
        if (fits !== null) {
          lastEnd = fits;
          seal.appendChild(el('rect', { x: x - w / 2, y: yLine - 24, width: w, height: 16, rx: 4 }));
          seal.appendChild(el('text', { x, y: yLine - 12, 'text-anchor': 'middle' }, t.label));
          if (t.kind === 'anniversary' || t.kind === 'anchor') seal.appendChild(el('text', { x, y: yLine + 22, 'text-anchor': 'middle', class: 'tick-label', fill: '#8A651D' }, t.kind === 'anchor' ? '✦ #1' : '✦'));
        }
        if (t.title) seal.appendChild(el('title', {}, t.title));
        g.appendChild(seal);
      }
    } else if (row.id === 'markers') {
      g.appendChild(el('line', { class: 'row-line collapsed', x1: 0, x2: width, y1: yLine, y2: yLine }));
      const today = { id: 'today', jdn: state.todayJdn, label: 'Today', detail: 'from this device’s clock', certainty: 'EXACT', today: true };
      let lastEnd = -Infinity;
      for (const m of markerTicks(vp, [today])) {
        const x = vp.x(m.jdn) + vp.pxPerDay / 2;
        const mk = el('g', { class: `marker ${m.today ? 'today' : ''}`, role: 'listitem', 'data-jdn': m.jdn.toString(), tabindex: 0, 'aria-label': `${m.label}: ${m.detail}` });
        mk.appendChild(el('path', { d: `M${x} ${yLine - 8} L${x + 7} ${yLine} L${x} ${yLine + 8} L${x - 7} ${yLine} Z` }));
        const fits = labelFits(lastEnd, x + 9, m.label);
        if (fits !== null) { lastEnd = fits; mk.appendChild(el('text', { x: x + 9, y: yLine + 4 }, m.label)); }
        mk.appendChild(el('title', {}, `${m.label} — ${m.detail}`));
        g.appendChild(mk);
      }
    } else {
      const { ticks, collapsed } = calendarTicks(row.adapter, vp, { era: state.era });
      if (collapsed) {
        g.appendChild(el('line', { class: 'row-line collapsed', x1: 0, x2: width, y1: yLine, y2: yLine }));
        const reasonText = el('text', { class: 'collapsed-reason', x: LABEL_W + 8, y: yLine - 8 }, clip(`— unsupported here: ${collapsed.reason}`, Math.floor((width - LABEL_W - 110) / 5.6)));
        reasonText.appendChild(el('title', {}, collapsed.reason));
        g.appendChild(reasonText);
      } else {
        g.appendChild(el('line', { class: 'row-line', x1: 0, x2: width, y1: yLine, y2: yLine }));
        let lastEnd = -Infinity;
        for (const t of ticks) {
          const x = vp.x(t.jdn);
          const major = t.weight === 'major';
          g.appendChild(el('line', { class: `tick ${major ? '' : 'minor'}`, x1: x, x2: x, y1: yLine - (major ? 10 : 5), y2: yLine + (major ? 10 : 5) }));
          const fits = labelFits(lastEnd, x + 3, t.label);
          if (fits !== null && t.label) {
            lastEnd = fits;
            const tx = el('text', { class: `tick-label ${major ? '' : 'minor'}`, x: x + 3, y: yLine + (major ? 22 : 20), 'data-jdn': t.jdn.toString(), role: 'listitem', tabindex: 0, 'aria-label': t.title || t.label }, t.label);
            if (t.title) tx.appendChild(el('title', {}, t.title));
            if (t.certainty !== 'EXACT') tx.setAttribute('font-style', 'italic');
            g.appendChild(tx);
          }
        }
      }
      // certainty badge for the cursor day in this row
      const c = desc.calendars.find(x => x.id === row.id);
      const cert = c.support.certainty;
      const bw = cert.length * 6.2 + 12;
      const badge = el('g', { class: 'badge-g' });
      badge.appendChild(el('rect', { class: `cert-box ${cert}`, x: width - bw - 8, y: y0 + 6, width: bw, height: 16, rx: 4 }));
      badge.appendChild(el('text', { class: `cert ${cert}`, x: width - 8 - bw / 2, y: y0 + 18, 'text-anchor': 'middle' }, cert.toLowerCase()));
      badge.appendChild(el('title', {}, c.support.reason));
      g.appendChild(badge);
    }

    // row label (drawn last so it sits above ticks)
    const lab = el('g', { class: 'row-label-g' });
    lab.appendChild(el('rect', { x: 0, y: y0 + 4, width: LABEL_W, height: 30, fill: row.id === 'sabbath' ? '#F6EDD8' : '#FFFDF7', opacity: 0.92, rx: 4 }));
    lab.appendChild(el('text', { class: 'row-label', x: 8, y: y0 + 18 }, row.name));
    const subText = el('text', { class: 'row-sub', x: 8, y: y0 + 30 }, clip(row.sub, 16));
    subText.appendChild(el('title', {}, row.sub));
    lab.appendChild(subText);
    g.appendChild(lab);
    svg.appendChild(g);
  });

  // cursor: shaded day column and centre line across all rows
  svg.appendChild(el('rect', { class: 'cursor-day', x: cursorX, y: 0, width: dayW, height }));
  const cx = cursorX + vp.pxPerDay / 2;
  svg.appendChild(el('line', { class: 'cursor-line', x1: cx, x2: cx, y1: 0, y2: height }));
  svg.appendChild(el('title', {}, `Cursor: JDN ${fmtInt(state.cursorJdn)}`));
  return { height, rows: rowSpecs.map(r => r.id) };
}
