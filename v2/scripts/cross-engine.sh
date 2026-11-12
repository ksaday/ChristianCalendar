#!/bin/sh
# Phase 4.2 — run the core invariant self-test in every JavaScript engine available on this machine
# and print one digest line per engine. All lines must be identical (T-VER-01).
# macOS: Node, JavaScriptCore (Safari's engine, via the jsc shell), Google Chrome (headless), Firefox (headless) when installed.
set -e
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
echo "node       $(node scripts/invariants-digest.mjs)"
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
if [ -x "$JSC" ]; then
  python3 -I - src/core "$TMP/bundle.js" <<'PY'
import sys, re, pathlib
src = pathlib.Path(sys.argv[1]); out = []
for name in ['bigint-math.js', 'chronology.js', 'invariants.js']:
    s = (src / name).read_text(encoding='utf-8')
    s = re.sub(r'^import[\s\S]*?from\s+[\'"][^\'"]+[\'"];\s*$', '', s, flags=re.M)
    s = re.sub(r'^export\s+\{[^}]*\};?\s*$', '', s, flags=re.M)
    s = re.sub(r'^export\s+(class|function|const)\s', r'\1 ', s, flags=re.M)
    out.append(s)
out.append('const r = verifyInvariants({ seed: 1, samples: 1000 }); print((r.allPassed ? "PASS " : "FAIL ") + r.digest);')
pathlib.Path(sys.argv[2]).write_text('\n'.join(out), encoding='utf-8')
PY
  echo "jsc        $("$JSC" "$TMP/bundle.js")"
fi
PORT=8799
python3 -m http.server $PORT --bind 127.0.0.1 --directory .. >/dev/null 2>&1 &
SRV=$!; sleep 1
URL="http://127.0.0.1:$PORT/v2/test/browser/invariants.html"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -x "$CHROME" ]; then
  echo "chrome     $("$CHROME" --headless=new --disable-gpu --no-first-run --virtual-time-budget=5000 --dump-dom "$URL" 2>/dev/null | grep -oE '<p id="status" class="(pass|fail)">[^<]*|<code id="digest">[^<]*' | sed -E 's/<[^>]*>//g; s/ in [0-9.]+ ms.*//' | tr '\n' ' ')"
fi
FIREFOX="/Applications/Firefox.app/Contents/MacOS/firefox"
if [ -x "$FIREFOX" ]; then
  echo "firefox    (headless screenshot only; read the digest from the page) $("$FIREFOX" --headless --screenshot "$TMP/ff.png" "$URL" 2>&1 | tail -1)"
else
  echo "firefox    not installed"
fi
kill $SRV 2>/dev/null; rm -rf "$TMP"
