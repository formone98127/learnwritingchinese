import { readFile, readdir } from 'node:fs/promises';

const cur = await readFile('data/curriculum.ts', 'utf8');
const chars = [...new Set([...cur.matchAll(/chars:\s*'([^']+)'\.split/g)].flatMap((m) => [...m[1]]))];
const jp = await readFile('data/jyutping.ts', 'utf8');
const missing = chars.filter((c) => !jp.includes(`'${c}':`));
console.log('curriculum chars:', chars.length, 'missing jyutping:', missing.length);
console.log(missing.join(''));
