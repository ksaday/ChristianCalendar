/* ============================================================
   The Christian Calendar — logic
   Anchor: Sabbath #1 = Saturday, 4 April AD 33 (Julian)
           Julian Day Number 1,733,205
   All date math uses integer JDN arithmetic (timezone-proof).
   ============================================================ */

(function () {
  'use strict';

  var ANCHOR_JDN = 1733205;

  /* ---------- Core math ---------- */

  function jdnFromGregorian(year, month, day) {
    var a = Math.floor((14 - month) / 12);
    var y = year + 4800 - a;
    var m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y +
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  function gregFromJdn(j) {
    var a = j + 32044,
        b = Math.floor((4 * a + 3) / 146097),
        c = a - Math.floor(146097 * b / 4),
        d = Math.floor((4 * c + 3) / 1461),
        e = c - Math.floor(1461 * d / 4),
        m = Math.floor((5 * e + 2) / 153);
    return {
      day: e - Math.floor((153 * m + 2) / 5) + 1,
      month: m + 3 - 12 * Math.floor(m / 10),
      year: 100 * b + d - 4800 + Math.floor(m / 10)
    };
  }

  function dow(j) { return ((j % 7) + 7) % 7; }        // 0=Mon … 5=Sat, 6=Sun
  function isSabbath(j) { return dow(j) === 5; }
  function sabbathNumber(j) { return (j - ANCHOR_JDN) / 7 + 1; }

  function daysInMonth(y, m) {
    if (m === 2) {
      var leap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
      return leap ? 29 : 28;
    }
    return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  }

  function fmt(n) {
    var neg = n < 0; n = Math.abs(n);
    var s = String(n), out = '';
    while (s.length > 3) { out = ',' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (neg ? '\u2212' : '') + s + out;
  }

  function ord(n) {
    var v = n % 100;
    if (v >= 11 && v <= 13) return n + 'th';
    switch (n % 10) {
      case 1: return n + 'st';
      case 2: return n + 'nd';
      case 3: return n + 'rd';
      default: return n + 'th';
    }
  }

  /* Anniversary Sabbath: first Saturday on/after April 4 of a year */
  function annivJdnOfYear(y) {
    if (y === 33) return ANCHOR_JDN;          // Julian 4 Apr AD 33 = proleptic-Gregorian 2 Apr
    var j = jdnFromGregorian(y, 4, 4);
    while (!isSabbath(j)) j++;
    return j;
  }
  function annivInfo(y, m, d, j) {
    if (j === ANCHOR_JDN) return 0;           // the Passover Sabbath itself
    if (m !== 4 || d < 2 || d > 10) return null;
    if (j !== annivJdnOfYear(y)) return null;
    var years = y - 33;
    return years > 0 ? years : null;
  }

  var MN = ['January','February','March','April','May','June',
            'July','August','September','October','November','December'];
  var DN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* ---------- State ---------- */

  var now = new Date();
  var view = { y: now.getFullYear(), m: now.getMonth() + 1 };
  var tY = now.getFullYear(), tM = now.getMonth() + 1, tD = now.getDate();
  var tJ = jdnFromGregorian(tY, tM, tD);

  /* ---------- DOM ---------- */

  var body = document.getElementById('calBody'),
      cap = document.getElementById('calCaption'),
      headRow = document.getElementById('calHead'),
      summary = document.getElementById('monthSummary'),
      mSel = document.getElementById('monthSel'),
      yInp = document.getElementById('yearInp'),
      cdown = document.getElementById('countdown');

  ['Sun','Mon','Tue','Wed','Thu','Fri','Sabbath'].forEach(function (n, i) {
    var th = document.createElement('th');
    th.scope = 'col';
    th.textContent = n;
    if (i === 6) th.className = 'sab-col';
    headRow.appendChild(th);
  });

  MN.forEach(function (n, i) {
    var o = document.createElement('option');
    o.value = i + 1; o.textContent = n;
    mSel.appendChild(o);
  });

  /* ---------- Countdown banner ---------- */

  (function renderCountdown() {
    var nextJ = tJ;
    while (!isSabbath(nextJ)) nextJ++;
    var sn = sabbathNumber(nextJ),
        g = gregFromJdn(nextJ),
        gf = gregFromJdn(nextJ - 1),
        away = nextJ - tJ,
        html;
    if (away === 0) {
      html = 'Today is <strong>Sabbath #' + fmt(sn) + '</strong> \u2014 Saturday, ' +
             MN[g.month - 1] + ' ' + g.day + ', ' + g.year + '.';
    } else {
      var when = away === 1 ? 'tomorrow' : 'in ' + away + ' days';
      html = 'Next: <strong>Sabbath #' + fmt(sn) + '</strong> \u2014 Saturday, ' +
             MN[g.month - 1] + ' ' + g.day + ', ' + g.year +
             ' \u00b7 begins at sunset on Friday, ' + MN[gf.month - 1] + ' ' + gf.day +
             ' \u00b7 ' + when + '.';
    }
    var an = annivInfo(g.year, g.month, g.day, nextJ);
    if (an !== null && an > 0) {
      html += '<br><span class="anniv-line">\u2726 Also the Anniversary Sabbath \u2014 the ' +
              ord(an) + ' year since the Resurrection week.</span>';
    }
    cdown.innerHTML = html;
  })();

  /* ---------- Popover ---------- */

  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }

  function showPop(cell, y, m, d, j) {
    closePop();
    var sn = sabbathNumber(j),
        ds = j - ANCHOR_JDN,
        an = annivInfo(y, m, d, j),
        extra = '';
    if (an !== null && an > 0) {
      extra = '<p class="annivline">\u2726 Anniversary Sabbath \u2014 ' + ord(an) +
              ' year since the Resurrection week</p>';
    } else if (an === 0) {
      extra = '<p class="annivline">\u2726 The Passover Sabbath itself \u2014 Sabbath #1</p>';
    }
    if (sn >= 1 && sn % 1000 === 0) {
      extra += '<p class="annivline mile">Milestone: the ' + fmt(sn) + 'th Sabbath</p>';
    }
    pop = document.createElement('div');
    pop.className = 'popover';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Sabbath details');
    pop.innerHTML =
      '<h3>Saturday, ' + MN[m - 1] + ' ' + d + ', ' + y + '</h3><dl>' +
      '<dt>Sabbath number</dt><dd><strong>#' + fmt(sn) + '</strong></dd>' +
      '<dt>Julian Day Number</dt><dd>' + fmt(j) + '</dd>' +
      '<dt>Days since anchor</dt><dd>' + fmt(ds) + '</dd>' +
      '<dt>Weeks since anchor</dt><dd>' + fmt(ds / 7) + '</dd>' +
      '</dl>' + extra +
      '<button class="btn close-btn">Close</button>';
    document.body.appendChild(pop);
    var r = cell.getBoundingClientRect(),
        pw = pop.offsetWidth, ph = pop.offsetHeight,
        left = Math.min(Math.max(8, r.left), window.innerWidth - pw - 8),
        top = r.bottom + 6;
    if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 6);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    pop.querySelector('.close-btn').addEventListener('click', closePop);
    pop.querySelector('.close-btn').focus();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePop();
  });
  document.addEventListener('click', function (e) {
    if (pop && !pop.contains(e.target) &&
        !(e.target.closest && e.target.closest('td.sab'))) closePop();
  });

  /* ---------- Render ---------- */

  function sunCol(j) { return (dow(j) + 1) % 7; }   // Sun-first column index

  function render() {
    closePop();
    var y = view.y, m = view.m;
    cap.textContent = MN[m - 1] + ' ' + y + (y <= 100 ? ' AD' : '');
    mSel.value = m;
    yInp.value = y;

    var f = jdnFromGregorian(y, m, 1),
        n = daysInMonth(y, m),
        html = '<tr>', c;

    for (c = 0; c < sunCol(f); c++) html += '<td class="empty" aria-hidden="true"></td>';

    var firstSab = null;

    for (var d = 1; d <= n; d++) {
      var j = f + d - 1,
          col = sunCol(j);
      if (col === 0 && d !== 1) html += '</tr><tr>';

      var sab = isSabbath(j),
          today = (j === tJ),
          an = sab ? annivInfo(y, m, d, j) : null,
          cls = [];
      if (sab) cls.push('sab');
      if (an !== null) cls.push('anniv');
      if (today) cls.push('today-cell');

      var aria = DN[col] + ' ' + MN[m - 1] + ' ' + d + ' ' + y;
      var inner = '<span class="dnum">' + d + '</span>';

      if (sab) {
        var sn = sabbathNumber(j);
        if (firstSab === null) firstSab = sn;
        aria += ', Sabbath number ' + fmt(sn);
        var mile = (sn >= 1 && sn % 1000 === 0);
        var sealCls = sn < 1 ? ' pre' : (mile ? ' mile' : '');
        inner += '<span class="sab-seal' + sealCls + '">Sabbath<span class="num">#' +
                 fmt(sn) + '</span></span>';
        if (an !== null && an > 0) {
          inner += '<span class="anniv-star">\u2726 ' + ord(an) + ' yr</span>';
          aria += ', Anniversary Sabbath, ' + ord(an) + ' year';
        } else if (an === 0) {
          inner += '<span class="anniv-star">\u2726 #1</span>';
          aria += ', the Passover Sabbath itself';
        }
        if (mile) aria += ', milestone Sabbath';
      }
      if (today) aria += ', today';

      html += '<td class="' + cls.join(' ') + '"' +
              (sab ? ' tabindex="0" data-j="' + j + '" data-d="' + d + '"' : '') +
              ' aria-label="' + aria + '">' + inner + '</td>';
    }

    for (c = sunCol(f + n - 1) + 1; c <= 6; c++) {
      html += '<td class="empty" aria-hidden="true"></td>';
    }
    html += '</tr>';
    body.innerHTML = html;

    summary.innerHTML = firstSab !== null
      ? 'First Sabbath shown: <strong>#' + fmt(firstSab) +
        '</strong> \u00b7 each following Saturday adds one.'
      : '';

    Array.prototype.forEach.call(body.querySelectorAll('td.sab'), function (cell) {
      function open() {
        showPop(cell, y, m,
                parseInt(cell.getAttribute('data-d'), 10),
                parseInt(cell.getAttribute('data-j'), 10));
      }
      cell.addEventListener('click', function (e) { e.stopPropagation(); open(); });
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  /* ---------- Navigation ---------- */

  function clampY(y) { return Math.min(3000, Math.max(33, y)); }

  document.getElementById('prevBtn').addEventListener('click', function () {
    view.m--; if (view.m < 1) { view.m = 12; view.y = clampY(view.y - 1); }
    render();
  });
  document.getElementById('nextBtn').addEventListener('click', function () {
    view.m++; if (view.m > 12) { view.m = 1; view.y = clampY(view.y + 1); }
    render();
  });
  document.getElementById('todayBtn').addEventListener('click', function () {
    view.y = tY; view.m = tM;
    render();
  });
  document.getElementById('goBtn').addEventListener('click', function () {
    view.y = clampY(parseInt(yInp.value, 10) || tY);
    view.m = parseInt(mSel.value, 10);
    render();
  });
  yInp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('goBtn').click();
  });

  /* ---------- Self-check ---------- */

  (function selfCheck() {
    var el = document.getElementById('selfCheck');
    var j = jdnFromGregorian(2026, 4, 11);
    var ok1 = (j === 2461142) && isSabbath(j) && (sabbathNumber(j) === 103992);
    var ok2 = isSabbath(ANCHOR_JDN) && sabbathNumber(ANCHOR_JDN) === 1 &&
              annivJdnOfYear(33) === ANCHOR_JDN;
    var ok = ok1 && ok2;
    console.assert(ok, 'Self-check failed: JDN(2026-04-11)=' + j +
                       ', sab#=' + sabbathNumber(j));
    if (ok) {
      el.textContent = 'Self-check passed: 11 Apr 2026 \u2192 JDN 2,461,142 \u2192 ' +
                       'Sabbath #103,992 \u2713 \u00b7 anchor JDN 1,733,205 \u2192 Sabbath #1 \u2713';
    } else {
      el.textContent = 'SELF-CHECK FAILED \u2014 do not trust displayed numbers.';
      el.className = 'selfcheck fail';
    }
  })();

  render();
})();
