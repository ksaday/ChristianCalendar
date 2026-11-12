/* ============================================================
   Sabbath Calendar v2 — ui/lookup.js
   The Go-to dialog (doc 11 §5): Sabbath number, JDN, or a civil
   date in any adapter, with a live preview that shows the
   certainty before the jump (REQ-UI-04, REQ-UI-05).
   ============================================================ */

import { sabbathJdn, describeDay } from '../core/chronology.js';
import { toBigInt, ChronologyInputError } from '../core/bigint-math.js';
import { adapters } from '../calendars/registry.js';
import { isUnsupported } from '../calendars/adapter.js';
import { astronomicalYear, MONTH_NAMES } from '../calendars/civil-common.js';
import { MONTH_NAMES as HEB_MONTHS, isLeapYear as hebLeap } from '../calendars/hebrew.js';
import { describeCursor } from '../timeline/cursor.js';
import { fmtInt, sabbathLabel } from './format.js';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const MODES = [
  { id: 'sabbath', label: 'Sabbath number' },
  { id: 'jdn', label: 'Julian Day Number' },
  ...adapters.map(a => ({ id: a.id, label: `${a.name} date` })),
];

function fieldsHtml(mode, era) {
  if (mode === 'sabbath') return `<label>Sabbath # <input class="wide" name="n" inputmode="numeric" placeholder="e.g. −210562 or 104017" maxlength="42" autofocus></label>`;
  if (mode === 'jdn') return `<label>JDN <input class="wide" name="jdn" inputmode="numeric" placeholder="e.g. 1733205" maxlength="42" autofocus></label>`;
  if (mode === 'gregorian' || mode === 'julian') {
    const eras = era === 'BCE/CE' ? ['BCE', 'CE'] : ['BC', 'AD'];
    return `<label>Year <input name="year" inputmode="numeric" maxlength="12" autofocus></label>
      <label>Era <select name="era"><option value="${eras[1]}">${eras[1]}</option><option value="${eras[0]}">${eras[0]}</option></select></label>
      <label>Month <select name="month">${MONTH_NAMES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></label>
      <label>Day <input name="day" inputmode="numeric" maxlength="2" value="1"></label>`;
  }
  if (mode === 'hebrew') {
    return `<label>Year (AM) <input name="year" inputmode="numeric" maxlength="6" value="5787" autofocus></label>
      <label>Month <select name="month">${HEB_MONTHS.slice(1).map((m, i) => `<option value="${i + 1}">${i + 1} · ${m}</option>`).join('')}</select></label>
      <label>Day <input name="day" inputmode="numeric" maxlength="2" value="1"></label>`;
  }
  if (mode === 'chinese') {
    return `<label>Year (Gregorian year of the Chinese New Year) <input name="year" inputmode="numeric" maxlength="4" value="2026" autofocus></label>
      <label>Month <select name="month">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}</select></label>
      <label><input type="checkbox" name="leap"> leap month (閏)</label>
      <label>Day <input name="day" inputmode="numeric" maxlength="2" value="1"></label>`;
  }
  return '';
}

/** Resolve the form to a JDN or throw an Error with a user-facing message. */
function resolve(mode, fd) {
  if (mode === 'sabbath') return sabbathJdn(toBigInt(fd.get('n') || '', 'Sabbath number'));
  if (mode === 'jdn') return toBigInt(fd.get('jdn') || '', 'JDN');
  const a = adapters.find(x => x.id === mode);
  let date;
  if (mode === 'gregorian' || mode === 'julian') {
    date = { year: astronomicalYear(fd.get('era'), toBigInt(fd.get('year') || '', 'year')), month: Number(fd.get('month')), day: Number(fd.get('day')) };
  } else if (mode === 'hebrew') {
    const year = toBigInt(fd.get('year') || '', 'year'); const month = Number(fd.get('month'));
    if (month === 13 && !hebLeap(year)) throw new Error(`AM ${year} is not a leap year: no Adar II`);
    date = { year, month, day: Number(fd.get('day')) };
  } else if (mode === 'chinese') {
    date = { year: toBigInt(fd.get('year') || '', 'year'), month: Number(fd.get('month')), leapMonth: fd.get('leap') === 'on', day: Number(fd.get('day')) };
  }
  const j = a.toJdn(date);
  if (isUnsupported(j)) throw new Error(`unsupported in the ${a.name} calendar: ${j.reason}`);
  return j;
}

function previewHtml(jdn, era) {
  const d = describeCursor(jdn, { era });
  const day = describeDay(jdn);
  const cal = d.calendars.map(c => `${esc(c.name)}: ${c.label === null ? '—' : esc(c.label)} <span class="badge ${c.support.certainty}">${c.support.certainty.toLowerCase()}</span>`).join(' · ');
  const sab = day.isSabbath ? sabbathLabel(day.sabbathIndex) : `${day.dayName}, cycle #${fmtInt(day.cycle)} (day ${day.positionInCycle} of 7)`;
  return `<strong>${esc(sab)}</strong> · JDN ${esc(fmtInt(jdn))}<br>${cal}`;
}

/**
 * Wire the dialog. `onGo(jdn)` is called with a BigInt.
 * @param {HTMLDialogElement} dialog
 * @param {{ getEra: () => string, onGo: (jdn: bigint) => void }} api
 */
export function setupLookup(dialog, api) {
  const modes = dialog.querySelector('#gotoModes'), fields = dialog.querySelector('#gotoFields'),
        preview = dialog.querySelector('#gotoPreview'), form = dialog.querySelector('#gotoForm'), goBtn = dialog.querySelector('#gotoGo');
  let mode = 'sabbath', resolved = null;

  modes.innerHTML = MODES.map((m, i) => `<label><input type="radio" name="mode" value="${m.id}" ${i === 0 ? 'checked' : ''}> ${esc(m.label)}</label>`).join('');
  const renderFields = () => { fields.innerHTML = fieldsHtml(mode, api.getEra()); update(); fields.querySelector('input,select')?.focus(); };
  const update = () => {
    try {
      resolved = resolve(mode, new FormData(form));
      preview.className = 'goto-preview'; preview.innerHTML = previewHtml(resolved, api.getEra()); goBtn.disabled = false;
    } catch (e) {
      resolved = null; preview.className = 'goto-preview err';
      preview.textContent = (e instanceof ChronologyInputError || e instanceof Error) ? e.message : String(e); goBtn.disabled = true;
    }
  };
  modes.addEventListener('change', (e) => { if (e.target.name === 'mode') { mode = e.target.value; renderFields(); } });
  fields.addEventListener('input', update); fields.addEventListener('change', update);
  form.addEventListener('submit', (e) => { e.preventDefault(); if (resolved !== null) { dialog.close(); api.onGo(resolved); } });
  dialog.querySelector('#gotoCancel').addEventListener('click', () => dialog.close());
  return {
    open(prefill) {
      if (prefill && prefill.mode) { mode = prefill.mode; modes.querySelector(`input[value="${mode}"]`).checked = true; }
      renderFields();
      if (prefill && prefill.value !== undefined) { const inp = fields.querySelector('input'); if (inp) { inp.value = prefill.value; update(); } }
      dialog.showModal();
    },
  };
}
