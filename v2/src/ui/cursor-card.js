/* ============================================================
   Sabbath Calendar v2 — ui/cursor-card.js
   The detail panel for the cursor day (REQ-UI-02), baseline
   popover fields included (COMPAT-10, COMPAT-11). Phase 5 adds
   the eclipses of the day and the Bible events around the cursor.
   ============================================================ */

import { fmtInt, ordinal, sabbathLabel, approxYears } from './format.js';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function eventsHtml(x) {
  if (!x || !x.events) return '';
  const { containing, previous, next } = x.events;
  const fig = (r) => `${esc(r.event.label)} <span class="sub">(${esc(r.position.figure)})</span>`;
  let html = `<h3>Bible events <span class="sub">· ${esc(x.systemShort)}</span></h3>`;
  if (containing.length) {
    html += containing.map(r => `<div class="evt-item">
      <p><strong>${esc(r.event.label)}</strong> <span class="sub">${esc(r.event.ref)}</span> <span class="badge ${r.position.certainty}" title="${esc(r.position.sourceText)}">${r.position.certainty === 'INTERPRETATION' ? 'tradition' : r.position.certainty.toLowerCase()}</span></p>
      <p class="sub">${esc(r.position.figure)} — ${esc(r.position.basis)}</p>
      <ul class="evt-systems">${x.allSystems(r.event).map(s => `<li><span class="sys">${esc(s.short)}</span> ${s.position ? esc(s.position.figure) : `<span class="unsup">no date (${esc(s.reason)})</span>`}</li>`).join('')}</ul>
    </div>`).join('');
  } else {
    html += `<p class="sub">No dated event contains this day in the ${esc(x.systemShort)} reckoning.</p>`;
  }
  html += `<p class="evt-nav">${previous ? `<button class="btn jump" data-jdn="${previous.position.jump}">← ${fig(previous)}</button>` : ''} ${next ? `<button class="btn jump" data-jdn="${next.position.jump}">${fig(next)} →</button>` : ''}</p>`;
  html += `<p class="note">Event positions are traditions or estimates with their sources, projected onto the unbroken cycle. They do not affect the Sabbath count.</p>`;
  return html;
}

function eclipsesHtml(x) {
  if (!x || !x.eclipses) return '';
  if (x.canonStatus !== 'ready') return x.canonStatus === 'error' ? `<p class="note">Eclipse canon not loaded: ${esc(x.canonError)}</p>` : '';
  if (!x.eclipses.length) return '';
  return `<h3>Eclipses on this day</h3>${x.eclipses.map(({ e, d, recorded }) => `<p class="ecl-item"><strong>${esc(d.title)}</strong> · greatest ${esc(d.time)} · ${esc(d.magLabel)} ${e.magnitude.toFixed(3)} · Saros ${e.saros}<br><span class="sub">${esc(d.place)} · ${esc(d.deltaTText)}${d.uncertain ? ' · civil day ±1 (ΔT)' : ''}</span>${recorded ? `<br><span class="rec-note">Recorded: ${esc(recorded.label)} — ${esc(recorded.record)} <em>(${recorded.status})</em></span>` : ''}</p>`).join('')}<p class="sub">${esc(x.credit)}</p>`;
}

/**
 * @param {HTMLElement} root
 * @param {ReturnType<import('../timeline/cursor.js').describeCursor>} d
 * @param {object} [extra] Phase 5 data: {systemShort, events, allSystems, eclipses, canonStatus, canonError, credit}
 */
export function renderCursorCard(root, d, extra) {
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
    </dl>${eclipsesHtml(extra)}${eventsHtml(extra)}${notes}
    <div class="card-actions"><button class="btn" id="copyLink">Copy link</button></div>`;
}
