#!/usr/bin/env python3 -I
"""Phase 4.3 — independent recomputation (doc 13, step 4.3).

Recomputes, without any v2 code, for each sampled Sabbath index n:
  * JDN by the axiom 1733205 + 7(n-1)                 (pure integer arithmetic)
  * day of week via Python's datetime (Monday = 0)    (independent of v2's floorMod)
  * proleptic Gregorian date via datetime.date.fromordinal (JDN = ordinal + 1721425)
  * Julian date via Meeus's algorithm (Astronomical Algorithms ch. 7, "JD to calendar date", Julian branch)
and compares with the values v2 exported. Usage:
  node scripts/export-sample.mjs > sample.json && python3 -I scripts/independent-recompute.py sample.json
"""
import sys, json, datetime

ANCHOR = 1733205
RD_OFFSET = 1721425   # JDN of R.D. 0; datetime ordinal 1 = 1 Jan AD 1 (proleptic Gregorian) = JDN 1721426

def julian_from_jdn(jdn):
    # Meeus ch. 7 (Julian calendar branch): Z = JDN, F = 0; A = Z
    A = jdn
    B = A + 1524
    C = int((B - 122.1) / 365.25)
    D = int(365.25 * C)
    E = int((B - D) / 30.6001)
    day = B - D - int(30.6001 * E)
    month = E - 1 if E < 14 else E - 13
    year = C - 4716 if month > 2 else C - 4715
    return year, month, day

def main(path):
    data = json.load(open(path))
    assert data['anchor'] == str(ANCHOR)
    lines = []; ok = 0; bad = 0
    for r in data['rows']:
        n = int(r['n']); jdn = ANCHOR + 7 * (n - 1)
        cycle = n
        checks = {'jdn': (jdn, int(r['jdn'])), 'cycle': (cycle, int(r['cycle']))}
        if 1721426 <= jdn <= 5373484:   # datetime range: ordinal 1 … 3652059
            d = datetime.date.fromordinal(jdn - RD_OFFSET)
            checks['dow'] = (d.weekday(), r['dow'])
            if r['gregorian']:
                checks['gregorian'] = ([str(d.year), d.month, d.day], r['gregorian'])
            if r['julian']:
                y, m, dd = julian_from_jdn(jdn)
                checks['julian'] = ([str(y), m, dd], r['julian'])
        else:
            checks['dow'] = (((jdn % 7) + 7) % 7, r['dow'])   # outside datetime's range: integer rule only
        failed = [k for k, (a, b) in checks.items() if a != b]
        if failed: bad += 1
        else: ok += 1
        lines.append(f"| {n:,} | {jdn:,} | {'✓' if not failed else 'FAIL ' + ', '.join(failed)} | {', '.join(checks.keys())} |")
    print(f"independent recomputation: {ok} agree, {bad} disagree, of {ok + bad} sampled Sabbath indices")
    print("\n| n | JDN | result | fields compared |\n|---|---|---|---|")
    print("\n".join(lines))
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main(sys.argv[1])
