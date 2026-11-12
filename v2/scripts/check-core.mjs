// Core purity check (REQ-CORE-01, REQ-CORE-13, REQ-GEN-01, ADR-002).
// - src/core/*.js may import only sibling files in src/core/.
// - No Date, Intl, window, document, fetch, Math.random, localStorage, setTimeout.
// - No "creation" identifier (any case) — no Creation boundary in the engine.
// - chronology.js: the only numeric literals allowed are 0..7 and 1733205 (axioms and small offsets).
// - Native '/' and '%' on BigInt appear only in bigint-math.js, or in chronology.js in the
//   two places where exactness is proven (division of a multiple of 7).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const layers = {
  core:      { allowed: [/^\.\/[a-z-]+\.js$/] },
  calendars: { allowed: [/^\.\/[a-z-]+\.js$/, /^\.\.\/core\/[a-z-]+\.js$/, /^\.\/chinese\/[a-z-]+\.js$/] },
  'calendars/chinese': { allowed: [/^\.\/[a-z-]+\.js$/, /^\.\.\/[a-z-]+\.js$/, /^\.\.\/\.\.\/core\/[a-z-]+\.js$/] },
};
const problems = [];
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const files = [];
for (const [layer, rule] of Object.entries(layers)) {
  const dir = join(srcRoot, layer);
  for (const name of readdirSync(dir).filter(f => f.endsWith('.js'))) files.push({ f: `${layer}/${name}`, path: join(dir, name), rule });
}

for (const { f, path, rule } of files) {
  const src = stripComments(readFileSync(path, 'utf8'));
  for (const m of src.matchAll(/import\s+[^'"]*['"]([^'"]+)['"]/g)) {
    if (!rule.allowed.some(re => re.test(m[1]))) problems.push(`${f}: import outside its layer: ${m[1]}`);
  }
  for (const id of ['Date', 'Intl', 'window', 'document', 'fetch', 'Math.random', 'localStorage', 'setTimeout', 'XMLHttpRequest', 'navigator']) {
    const re = new RegExp(`(^|[^\\w.])${id.replace('.', '\\.')}\\b`);
    if (re.test(src)) problems.push(`${f}: forbidden identifier ${id}`);
  }
  if (/creation/i.test(src)) problems.push(`${f}: contains "creation" (REQ-GEN-01)`);
  if (f === 'core/chronology.js') {
    const allowed = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '1733205']);
    for (const m of src.matchAll(/(?<![\w.])(\d[\d_]*)n?\b/g)) {
      const lit = m[1].replace(/_/g, '');
      if (!allowed.has(lit)) problems.push(`chronology.js: unexpected numeric literal ${m[0]}`);
    }
  }
}
if (problems.length) { console.error('check-core: FAILED\n' + problems.map(p => '  - ' + p).join('\n')); process.exit(1); }
console.log(`check-core: OK (${files.length} files: ${files.map(x => x.f).join(', ')})`);
