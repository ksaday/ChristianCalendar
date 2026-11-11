/* ============================================================
   TEST FIXTURE — verbatim copy of the chronology functions from
   the original application, js/calendar.js, at commit 6229702
   (lines 11–47 and 67–80), wrapped in ES exports. Used only as a
   regression oracle (REQ-COMPAT-01/03, T-REG-*). Do not edit the
   function bodies; if the original changes, re-copy and note it.
   Number-based; exact only for |values| < 2^53.
   ============================================================ */

export var ANCHOR_JDN = 1733205;

export function jdnFromGregorian(year, month, day) {
  var a = Math.floor((14 - month) / 12);
  var y = year + 4800 - a;
  var m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
         Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

export function gregFromJdn(j) {
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

export function dow(j) { return ((j % 7) + 7) % 7; }        // 0=Mon … 5=Sat, 6=Sun
export function isSabbath(j) { return dow(j) === 5; }
export function sabbathNumber(j) { return (j - ANCHOR_JDN) / 7 + 1; }

export function daysInMonth(y, m) {
  if (m === 2) {
    var leap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
    return leap ? 29 : 28;
  }
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/* Anniversary Sabbath: first Saturday on/after April 4 of a year */
export function annivJdnOfYear(y) {
  if (y === 33) return ANCHOR_JDN;          // Julian 4 Apr AD 33 = proleptic-Gregorian 2 Apr
  var j = jdnFromGregorian(y, 4, 4);
  while (!isSabbath(j)) j++;
  return j;
}
export function annivInfo(y, m, d, j) {
  if (j === ANCHOR_JDN) return 0;           // the Passover Sabbath itself
  if (m !== 4 || d < 2 || d > 10) return null;
  if (j !== annivJdnOfYear(y)) return null;
  var years = y - 33;
  return years > 0 ? years : null;
}
