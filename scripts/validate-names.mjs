// Validates data/strokeNames.ts override lengths against bundled stroke data.
// Usage: node scripts/validate-names.mjs
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const src = await readFile(path.resolve('data/strokeNames.ts'), 'utf8');
const overrides = new Map();
for (const m of src.matchAll(/^ {2}(.): \[([^\]]*)\]/gm)) {
  const names = m[2].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean);
  overrides.set(m[1], names.length);
}

let bad = 0;
for (const f of await readdir(path.resolve('assets/strokes'))) {
  const data = JSON.parse(await readFile(path.join('assets/strokes', f), 'utf8'));
  const char = String.fromCodePoint(parseInt(f, 16));
  const have = overrides.get(char);
  if (have !== undefined && have !== data.strokes.length) {
    console.log(`MISMATCH ${char}: override=${have} data=${data.strokes.length}`);
    bad++;
  }
}
console.log(bad === 0 ? `all ${overrides.size} overrides match stroke counts` : `${bad} mismatches`);
