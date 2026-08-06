import { readdir, readFile } from 'node:fs/promises';

const cur = await readFile('data/curriculum.ts', 'utf8');
const chars = [...new Set([...cur.matchAll(/chars:\s*'([^']+)'\.split/g)].flatMap((m) => [...m[1]]))];

const strokeFiles = new Set((await readdir('assets/strokes')).filter((f) => f.endsWith('.json')));
const strokeChars = new Set([...strokeFiles].map((f) => String.fromCodePoint(parseInt(f.replace('.json', ''), 16))));

const rules = await readFile('data/strokeRules.ts', 'utf8');
const ruleChars = new Set([...rules.matchAll(/"(.?)":\s*\[/g)].map((m) => m[1]));

const voice = await readFile('data/voice.ts', 'utf8');
const voiceYue = new Set([...voice.matchAll(/"yue":\s*\{([\s\S]*?)\}\s*,\s*"cmn"/g)][0][1].matchAll(/"(.?)":\s*require/g).map((m) => m[1]));
const voiceCmn = new Set([...voice.matchAll(/"cmn":\s*\{([\s\S]*?)\}\s*,?\s*\}/g)][0][1].matchAll(/"(.?)":\s*require/g).map((m) => m[1]));

const noStroke = chars.filter((c) => !strokeChars.has(c));
const noRules = chars.filter((c) => !ruleChars.has(c));
const noVoice = chars.filter((c) => !voiceYue.has(c) || !voiceCmn.has(c));
console.log(`chars: ${chars.length}, strokes ok: ${chars.length - noStroke.length}, rules ok: ${chars.length - noRules.length}, voice ok: ${chars.length - noVoice.length}`);
if (noStroke.length) console.log('missing strokes:', noStroke.join(''));
if (noRules.length) console.log('missing rules:', noRules.join(''));
if (noVoice.length) console.log('missing voice:', noVoice.join(''));
