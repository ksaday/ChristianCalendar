/* ============================================================
   Sabbath Calendar v2 — ui/cursor-card.js
   The detail panel for the cursor day (REQ-UI-02), baseline
   popover fields included (COMPAT-10, COMPAT-11).
   ============================================================ */

import { fmtInt, ordinal, sabbathLabel, approxYears } from './format.js';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import('../timeline/cursor.js').describeCursor>} d
 */
export function renderCursorCard(root, d) {
  const day = d.day;
  const head = day.isSabbath
    ? `<h2>${esc(sabbathLabel(day.sabbathIndex))}</h2><p class="sub">Saturday · the 7th day of cycle #${esc(fmtInt(day.cycle))}</p>`
    : `<h2 class="weekday">${esc(day.dayName)}</h2><p class="sub">day ${day.positionInCycle} of 7 in cycle #${esc(fmtInt(day.cycle))} · next: ${esc(sabbathLabel(day.cycle))}</p>`;
  const cals = d.calendars.map(c => {
    const label = c.label === null ? `<span class="unsup">— unsupported</span>` : esc(c.label);
    return `<dt>${esc(c.name)}</dt><dd class="cal-row"><span>${label}</span><span class="badge ${c.support.certainty}" title="${esc(c.support.reason)}">${c.support.certainty.toLowerCase()}</span></dd>`;
  }).join('');
  let notes = '';
  if (d.anniversary !== null && d.anniversary > 0n) notes += `<p class="note anniv">✦ Anniversary Sabbath — the ${esc(ordinal(d.anniversary))} year since the Resurrection week.</p>`;
  if (d.anniversary === 0n) notes += `<p class="note anniv">✦ The Passover Sabbath itself — Sabbath #1.</p>`;
  if (d.milestone) notes += `<p class="note mile">Milestone: the ${esc(fmtInt(day.sabbathIndex))}th Sabbath.</p>`;
  if (day.cycle <= 0n) notes += `<p class="note">Cycle numbers before #1 are a mathematical projection of the unbroken seven-day cycle. They are exact within the model and make no claim about observance.</p>`;
  notes += `<p class="note">Civil days run midnight to midnight. The Sabbath begins at sunset on Friday; Hebrew dates begin at the previous sunset (not computed by location).</p>`;
  root.innerHTML = `${head}<dl class="cal-list">${cals}</dl>
    <dl>
      <dt>Julian Day Number</dt><dd>${esc(fmtInt(day.jdn))}</dd>
      <dt>Days since anchor</dt><dd>${esc(fmtInt(day.daysSinceAnchor))}</dd>
      <dt>Cycles since #1</dt><dd>${esc(fmtInt(day.cycle - 1n))} <span class="sub">(${esc(approxYears(day.daysSinceAnchor))})</span></dd>
      <dt>Previous Sabbath</dt><dd><button class="btn jump" data-jdn="${day.isSabbath ? day.jdn - 7n : day.previousSabbath}">${esc(sabbathLabel(day.cycle - 1n))}</button></dd>
      <dt>Next Sabbath</dt><dd><button class="btn jump" data-jdn="${day.isSabbath ? day.jdn + 7n : day.nextSabbath}">${esc(sabbathLabel(day.isSabbath ? day.sabbathIndex + 1n : day.cycle))}</button></dd>
    </dl>${notes}
    <div class="card-actions"><button class="btn" id="copyLink">Copy link</button></div>`;
}
