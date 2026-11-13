/* ============================================================
   Sabbath Calendar v2 — ui/render-rows.js
   Paints the synchronized rows as SVG from one viewport. Every
   row is a pure function of (cursorJdn, level, width, options).
   Phase 5 (doc 17): Bible-event, calculated-eclipse and
   recorded-eclipse rows.
   ============================================================ */

import { ANCHOR_JDN, cycleOf, describeDay } from '../core/chronology.js';
import { adapters } from '../calendars/registry.js';
import { sabbathTicks, calendarTicks, markerTicks } from '../timeline/ticks.js';
import { eventsBetween, EPOCHS, getSystem, civilDayLabel, eclipsesBetween, countBetween, describeEclipse, CANON_FIRST_YEAR, CANON_LAST_YEAR } from '../markers/index.js';
import { fmtInt } from './format.js';

export const ROW_H = 58, TOP_PAD = 8, LABEL_W = 96;
export const ECLIPSE_TICK_BUDGET = 400;
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

function collapsedRow(g, width, yLine, reason) {
  g.appendChild(el('line', { class: 'row-line collapsed', x1: 0, x2: width, y1: yLine, y2: yLine }));
  const reasonText = el('text', { class: 'collapsed-reason', x: LABEL_W + 8, y: yLine - 8 }, clip(`— ${reason}`, Math.floor((width - LABEL_W - 110) / 5.6)));
  reasonText.appendChild(el('title', {}, reason));
  g.appendChild(reasonText);
}

function badge(g, width, y0, cert, text, title) {
  const bw = text.length * 6.2 + 12;
  const b = el('g', { class: 'badge-g' });
  b.appendChild(el('rect', { class: `cert-box ${cert}`, x: width - bw - 8, y: y0 + 6, width: bw, height: 16, rx: 4 }));
  b.appendChild(el('text', { class: `cert ${cert}`, x: width - 8 - bw / 2, y: y0 + 18, 'text-anchor': 'middle' }, text));
  b.appendChild(el('title', {}, title));
  g.appendChild(b);
}

const diamond = (x, y, r, cls) => el('path', { class: cls, d: `M${x} ${y - r} L${x + r * 0.85} ${y} L${x} ${y + r} L${x - r * 0.85} ${y} Z` });

/**
 * @param {SVGSVGElement} svg
 * @param {{cursorJdn: bigint, rows: Record<string, boolean>, era: string, todayJdn: bigint, describe: any, eventSystem: string, canon: {status: string, solar: any, lunar: any, error?: string}, recorded: any[]}} state
 * @param {import('../timeline/zoom.js').Viewport} vp
 */
export function renderRows(svg, state, vp) {
  const rowSpecs = [{ id: 'sabbath', name: 'Sabbath', sub: '7-day cycle' }];
  for (const a of adapters) {
    if (state.rows[a.id]) rowSpecs.push({ id: a.id, name: a.name, sub: a.variant.split(',')[0], adapter: a });
    if (a.id === 'gregorian' && state.rows.civil && state.civil) rowSpecs.push({ id: 'civil', name: 'Civil date', sub: state.civil.region.short, adapter: state.civil });
  }
  const system = getSystem(state.eventSystem);
  if (state.rows.events) rowSpecs.push({ id: 'events', name: 'Bible events', sub: `${system.short} (tradition)` });
  if (state.rows.eclipses) rowSpecs.push({ id: 'eclipses', name: 'Eclipses', sub: 'calculated (NASA canon)' });
  if (state.rows.recorded) rowSpecs.push({ id: 'recorded', name: 'Eclipses', sub: 'recorded in history' });
  if (state.rows.markers) rowSpecs.push({ id: 'markers', name: 'Markers', sub: 'reference points' });

  const width = vp.widthPx, height = TOP_PAD + rowSpecs.length * ROW_H + 4;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width); svg.setAttribute('height', height);
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const cursorX = vp.x(state.cursorJdn), dayW = Math.max(vp.pxPerDay, 1);
  const desc = state.describe;
  const dayLabel = (jdn) => civilDayLabel(jdn, state.era);

  rowSpecs.forEach((row, i) => {
    const y0 = TOP_PAD + i * ROW_H, yLine = y0 + ROW_H * 0.55;
    const g = el('g', { class: `row row-${row.id}`, role: 'list', 'aria-label': `${row.name} row${row.id === 'eclipses' || row.id === 'recorded' ? ' (' + row.sub + ')' : ''}` });
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
      const extra = [today];
      if (state.civil && state.civil.region.id !== 'rome') {
        const r = state.civil.region, j = r.switchJdn;
        const before = state.civil.fromJdn(j - 1n);
        extra.push({ id: 'region-switch', jdn: j, label: `${r.short}: Gregorian`, certainty: 'EXACT',
          detail: `${before.unsupported ? `${r.name} used ${r.prev}` : `${describeDay(j - 1n).dayName} ${state.civil.format(before)}`} → ${describeDay(j).dayName} ${state.civil.format(state.civil.fromJdn(j))}` });
      }
      for (const m of markerTicks(vp, extra)) {
        const x = vp.x(m.jdn) + vp.pxPerDay / 2;
        const mk = el('g', { class: `marker ${m.today ? 'today' : ''}`, role: 'listitem', 'data-jdn': m.jdn.toString(), tabindex: 0, 'aria-label': `${m.label}: ${m.detail}` });
        mk.appendChild(el('path', { d: `M${x} ${yLine - 8} L${x + 7} ${yLine} L${x} ${yLine + 8} L${x - 7} ${yLine} Z` }));
        const fits = labelFits(lastEnd, x + 9, m.label);
        if (fits !== null) { lastEnd = fits; mk.appendChild(el('text', { x: x + 9, y: yLine + 4 }, m.label)); }
        mk.appendChild(el('title', {}, `${m.label} — ${m.detail}`));
        g.appendChild(mk);
      }
    } else if (row.id === 'events') {
      g.appendChild(el('line', { class: 'row-line', x1: 0, x2: width, y1: yLine, y2: yLine }));
      // shapes first, labels after (so no diamond covers a label); labels go in two lanes, above then below the line
      const lanes = [{ y: yLine - 12, lastEnd: -Infinity }, { y: yLine + 20, lastEnd: -Infinity }];
      const labels = [];
      const placeLabel = (mk, x, text, cls = 'evt-label') => {
        if (x >= width - 20) return;
        for (const lane of lanes) {
          const fits = labelFits(lane.lastEnd, x, text);
          if (fits !== null) { lane.lastEnd = fits; labels.push({ mk, node: el('text', { class: cls, x, y: lane.y }, text) }); return; }
        }
      };
      for (const r of eventsBetween(system.id, vp.start, vp.end, state.era)) {
        const p = r.position;
        const x0 = vp.x(p.start), x1 = vp.x(p.end + 1n), xc = (x0 + x1) / 2;
        const mk = el('g', { class: `evt evt-${p.kind} ${r.event.group} ${p.certainty}`, role: 'listitem', 'data-jdn': p.jump.toString(), tabindex: 0,
          'aria-label': `${r.event.label}: ${p.figure} (${system.short}; ${p.certainty === 'INTERPRETATION' ? 'tradition or estimate' : p.certainty.toLowerCase() + ' historical date'})` });
        let pts;
        if (p.kind === 'band') {
          mk.appendChild(el('rect', { class: 'evt-band', x: x0, y: yLine - 9, width: Math.max(x1 - x0, 1.5), height: 18, rx: 2 }));
          pts = [xc];
        } else {
          pts = p.points.map(q => vp.x(q.jdn) + vp.pxPerDay / 2);
          if (pts.length === 2) mk.appendChild(el('line', { class: 'evt-alt-link', x1: pts[0], x2: pts[1], y1: yLine, y2: yLine }));
        }
        for (const px of pts) mk.appendChild(diamond(px, yLine, 7, `evt-diamond ${p.certainty}`));
        const covers = p.kind === 'band' && x0 < LABEL_W && x1 > width;
        if (covers) placeLabel(mk, LABEL_W + 8, `${r.event.label} — ${p.figure}`);
        else placeLabel(mk, Math.max(pts[0] - 4, LABEL_W + 4), r.event.label);
        const span = p.start === p.end
          ? `cycle #${fmtInt(cycleOf(p.start))}, ${describeDay(p.start).dayName}`
          : `cycles #${fmtInt(cycleOf(p.start))} – #${fmtInt(cycleOf(p.end))}`;
        mk.appendChild(el('title', {}, `${r.event.label} (${r.event.ref}) — ${p.figure} [${system.short}]\n${p.certainty === 'INTERPRETATION' ? 'Tradition or estimate, not evidence: the position is a projection of the unbroken cycle onto this system\'s date.' : 'Historical date from external records; shown for orientation only.'}\nBasis: ${p.basis}\nSource: ${p.sourceText}\nOn the unbroken cycle: ${span}`));
        g.appendChild(mk);
      }
      for (const ep of EPOCHS) {
        if (ep.jdn < vp.start || ep.jdn > vp.end) continue;
        const x = vp.x(ep.jdn) + vp.pxPerDay / 2;
        const mk = el('g', { class: 'evt epoch', role: 'listitem', 'data-jdn': ep.jdn.toString(), tabindex: 0, 'aria-label': `${ep.label}: ${ep.detail}` });
        mk.appendChild(diamond(x, yLine, 5, 'evt-diamond epoch'));
        placeLabel(mk, Math.max(x - 4, LABEL_W + 4), ep.label, 'evt-label epoch');
        mk.appendChild(el('title', {}, `${ep.label} — ${ep.detail}`));
        g.appendChild(mk);
      }
      const labelLayer = el('g', { class: 'evt-labels', 'aria-hidden': 'true' });
      for (const { mk, node } of labels) { node.setAttribute('data-jdn', mk.getAttribute('data-jdn')); labelLayer.appendChild(node); }
      g.appendChild(labelLayer);
      badge(g, width, y0, 'INTERPRETATION', 'tradition', `${system.name}. ${system.description} Positions are projections onto the unbroken cycle, never inputs to it.`);
    } else if (row.id === 'eclipses') {
      const c = state.canon;
      if (c.status !== 'ready') {
        collapsedRow(g, width, yLine, c.status === 'error' ? `canon not loaded: ${c.error}` : 'loading the NASA Five Millennium Canon…');
      } else {
        const first = BigInt(c.solar.jdns[0]), last = BigInt(c.lunar.jdns[c.lunar.jdns.length - 1]);
        if (vp.end < first || vp.start > last) {
          collapsedRow(g, width, yLine, `outside the canon (${-CANON_FIRST_YEAR + 1} BC – AD ${CANON_LAST_YEAR}); no eclipse is computed here`);
        } else {
          const ns = countBetween(c.solar, vp.start, vp.end), nl = countBetween(c.lunar, vp.start, vp.end);
          if (ns + nl > ECLIPSE_TICK_BUDGET) {
            collapsedRow(g, width, yLine, `${ns.toLocaleString('en-US')} solar and ${nl.toLocaleString('en-US')} lunar eclipses in view — zoom in to show them individually`);
          } else {
            g.appendChild(el('line', { class: 'row-line', x1: 0, x2: width, y1: yLine, y2: yLine }));
            const lastEnds = { solar: -Infinity, lunar: -Infinity };
            const all = [...eclipsesBetween(c.solar, vp.start, vp.end), ...eclipsesBetween(c.lunar, vp.start, vp.end)].sort((a, b) => a.jdnNum - b.jdnNum);
            for (const e of all) {
              const d = describeEclipse(e);
              const x = vp.x(e.jdn) + vp.pxPerDay / 2, y = e.kind === 'solar' ? yLine - 8 : yLine + 8;
              const shape = e.kind === 'solar' ? 'solar' : 'lunar';
              const fill = e.central ? 'central' : (e.type.startsWith('N') ? 'penumbral' : 'partial');
              const mk = el('g', { class: `ecl ${shape} ${fill}${d.uncertain ? ' uncertain' : ''}`, role: 'listitem', 'data-jdn': e.jdn.toString(), tabindex: 0, 'aria-label': `${d.title}, ${dayLabel(e.jdn)}` });
              mk.appendChild(el('circle', { cx: x, cy: y, r: 4.5 }));
              const text = `${d.glyph} ${e.typeName.split(' ')[0]}`;
              const fits = labelFits(lastEnds[shape], x + 7, text);
              if (fits !== null) { lastEnds[shape] = fits; mk.appendChild(el('text', { class: 'ecl-label', x: x + 7, y: y + 4 }, text)); }
              mk.appendChild(el('title', {}, `${dayLabel(e.jdn)}\n${d.detail}\n${c.solar.credit}`));
              g.appendChild(mk);
            }
          }
        }
      }
      badge(g, width, y0, 'CONVENTIONAL', 'calculated', `${state.canon.status === 'ready' ? state.canon.solar.credit : 'NASA Five Millennium Canon'}. Days are UT civil days (TD − ΔT); the tooltip gives ΔT and its uncertainty.`);
    } else if (row.id === 'recorded') {
      g.appendChild(el('line', { class: 'row-line', x1: 0, x2: width, y1: yLine, y2: yLine }));
      const lastEnds = { solar: -Infinity, lunar: -Infinity };
      const inView = state.recorded.map(e => ({ e, jdn: e.canon ? e.canon.jdn : e.jdn })).filter(({ jdn }) => jdn >= vp.start && jdn <= vp.end).sort((a, b) => (a.jdn < b.jdn ? -1 : 1));
      for (const { e, jdn } of inView) {
        const x = vp.x(jdn) + vp.pxPerDay / 2, y = e.kind === 'solar' ? yLine - 8 : yLine + 8;
        const mk = el('g', { class: `ecl rec ${e.kind} ${e.status}`, role: 'listitem', 'data-jdn': jdn.toString(), tabindex: 0, 'aria-label': `${e.label}: ${e.kind} eclipse, ${dayLabel(jdn)} (${e.status})` });
        mk.appendChild(el('circle', { cx: x, cy: y, r: 5 }));
        if (e.status !== 'attested') mk.appendChild(el('text', { class: 'ecl-q', x, y: y + 3.5, 'text-anchor': 'middle' }, '?'));
        const fits = labelFits(lastEnds[e.kind], x + 8, e.label);
        if (fits !== null) { lastEnds[e.kind] = fits; mk.appendChild(el('text', { class: 'ecl-label rec', x: x + 8, y: y + 4 }, e.label)); }
        const canonLine = e.canon ? describeEclipse(e.canon).detail + (e.offsetDays ? ` (canon UT day is ${e.offsetDays > 0 ? 'the day after' : 'the day before'} the recorded local date)` : '') : 'canon not loaded';
        mk.appendChild(el('title', {}, `${e.label} — ${dayLabel(jdn)}\n${e.record}\nStatus: ${e.status}\nSource: ${e.source}\n${canonLine}`));
        g.appendChild(mk);
      }
      badge(g, width, y0, 'EXACT', 'recorded', 'Eclipses with a historical record, each verified against the NASA canon. "?" marks a disputed identification or a modern interpretation.');
    } else {
      const { ticks, collapsed } = calendarTicks(row.adapter, vp, { era: state.era });
      if (collapsed) {
        collapsedRow(g, width, yLine, `unsupported here: ${collapsed.reason}`);
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
      badge(g, width, y0, c.support.certainty, c.support.certainty.toLowerCase(), c.support.reason);
    }

    // an ARIA list must have items: say so when nothing of this row falls in the viewport
    if (!g.querySelector('[role=listitem]')) {
      const empty = el('text', { class: 'sr-only-svg', x: LABEL_W + 8, y: yLine + 4, role: 'listitem', 'aria-label': `No ${row.id === 'events' ? 'dated Bible events' : row.id === 'recorded' ? 'recorded eclipses' : row.id === 'eclipses' ? 'individual eclipses' : 'items'} in view` }, '');
      g.appendChild(empty);
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
