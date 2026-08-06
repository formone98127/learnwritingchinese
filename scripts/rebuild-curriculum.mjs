// Rebuilds basic levels to be stroke-type-focused, keeps poems.
// Ensures all chars have stroke data (fetches missing), regens registries.
// Usage: node scripts/rebuild-curriculum.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// ---- stroke-type progressive curriculum ------------------------------------
// Stage A 基本筆畫: 橫 豎 撇 捺 點 提 折 鉤
// Stage B 複合筆畫: 橫折 豎折 撇折 彎鉤 臥鉤 斜鉤 提折 撇點
// Stage C 間架結構: 左右 上下 包圍 穿插
const BASIC = [
  { id: 'b01', title: '第一關・橫畫', focus: ['橫'], chars: '一二三十干土王工' },
  { id: 'b02', title: '第二關・豎畫', focus: ['豎'], chars: '十上卜下不中川口' },
  { id: 'b03', title: '第三關・撇畫', focus: ['撇'], chars: '人八入大天夫木禾' },
  { id: 'b04', title: '第四關・捺畫', focus: ['捺'], chars: '人入大天木來火水' },
  { id: 'b05', title: '第五關・點畫', focus: ['點'], chars: '六主玉太文方立小' },
  { id: 'b06', title: '第六關・提畫', focus: ['提'], chars: '地場提把江河海流' },
  { id: 'b07', title: '第七關・橫折', focus: ['橫折'], chars: '口日目月田白百石' },
  { id: 'b08', title: '第八關・豎折', focus: ['豎折'], chars: '山區亡出凹凸匪匹' },
  { id: 'b09', title: '第九關・撇折', focus: ['撇折'], chars: '去雲公台允麼矣能' },
  { id: 'b10', title: '第十關・豎彎鉤', focus: ['豎彎鉤'], chars: '也已元无見光先兒' },
  { id: 'b11', title: '第十一關・斜鉤', focus: ['斜鉤'], chars: '我成或戰裁戴感武' },
  { id: 'b12', title: '第十二關・臥鉤', focus: ['臥鉤'], chars: '心必思怎急您忘念' },
  { id: 'b13', title: '第十三關・橫折鉤', focus: ['橫折鉤'], chars: '力刀乃勿方房門問' },
  { id: 'b14', title: '第十四關・複合筆畫', focus: ['複合'], chars: '書畫馬鳥魚龍龜鳳' },
  { id: 'b15', title: '第十五關・左右結構', focus: ['左右'], chars: '你他她們住江河海' },
  { id: 'b16', title: '第十六關・上下結構', focus: ['上下'], chars: '字學家室草花思想' },
  { id: 'b17', title: '第十七關・包圍結構', focus: ['包圍'], chars: '國圓圍困回同周風' },
  { id: 'b18', title: '第十八關・穿插結構', focus: ['穿插'], chars: '乘爽垂重無舞兼鼎' },
];

const POEMS = [
  { title: '靜夜思', author: '李白', lines: ['床前明月光，', '疑是地上霜。', '舉頭望明月，', '低頭思故鄉。'] },
  { title: '春曉', author: '孟浩然', lines: ['春眠不覺曉，', '處處聞啼鳥。', '夜來風雨聲，', '花落知多少。'] },
  { title: '登鸛雀樓', author: '王之渙', lines: ['白日依山盡，', '黃河入海流。', '欲窮千里目，', '更上一層樓。'] },
  { title: '憫農', author: '李紳', lines: ['鋤禾日當午，', '汗滴禾下土。', '誰知盤中餐，', '粒粒皆辛苦。'] },
  { title: '畫', author: '王維', lines: ['遠看山有色，', '近聽水無聲。', '春去花還在，', '人來鳥不驚。'] },
  { title: '江雪', author: '柳宗元', lines: ['千山鳥飛絕，', '萬徑人蹤滅。', '孤舟蓑笠翁，', '獨釣寒江雪。'] },
  { title: '一去二三里', author: '邵雍', lines: ['一去二三里，', '煙村四五家。', '亭台六七座，', '八九十枝花。'] },
  { title: '詠鵝', author: '駱賓王', lines: ['鵝鵝鵝，', '曲項向天歌。', '白毛浮綠水，', '紅掌撥清波。'] },
  { title: '望廬山瀑布', author: '李白', lines: ['日照香爐生紫煙，', '遙看瀑布掛前川。', '飛流直下三千尺，', '疑是銀河落九天。'] },
  { title: '回鄉偶書', author: '賀知章', lines: ['少小離家老大回，', '鄉音無改鬢毛衰。', '兒童相見不相識，', '笑問客從何處來。'] },
  { title: '楓橋夜泊', author: '張繼', lines: ['月落烏啼霜滿天，', '江楓漁火對愁眠。', '姑蘇城外寒山寺，', '夜半鐘聲到客船。'] },
  { title: '尋隱者不遇', author: '賈島', lines: ['松下問童子，', '言師採藥去。', '只在此山中，', '雲深不知處。'] },
  { title: '相思', author: '王維', lines: ['紅豆生南國，', '春來發幾枝。', '願君多採擷，', '此物最相思。'] },
  { title: '七步詩', author: '曹植', lines: ['煮豆燃豆萁，', '豆在釜中泣。', '本是同根生，', '相煎何太急。'] },
  { title: '草', author: '白居易', lines: ['離離原上草，', '一歲一枯榮。', '野火燒不盡，', '春風吹又生。'] },
  { title: '憫農（其二）', author: '李紳', lines: ['春種一粒粟，', '秋收萬顆子。', '四海無閒田，', '農夫猶餓死。'] },
  { title: '畫雞', author: '唐寅', lines: ['頭上紅冠不用裁，', '滿身雪白走將來。', '平生不敢輕言語，', '一叫千門萬戶開。'] },
  { title: '風', author: '李嶠', lines: ['解落三秋葉，', '能開二月花。', '過江千尺浪，', '入竹萬竿斜。'] },
  { title: '鹿柴', author: '王維', lines: ['空山不見人，', '但聞人語響。', '返景入深林，', '復照青苔上。'] },
  { title: '竹里館', author: '王維', lines: ['獨坐幽篁裏，', '彈琴復長嘯。', '深林人不知，', '明月來相照。'] },
  { title: '宿建德江', author: '孟浩然', lines: ['移舟泊煙渚，', '日暮客愁新。', '野曠天低樹，', '江清月近人。'] },
  { title: '獨坐敬亭山', author: '李白', lines: ['眾鳥高飛盡，', '孤雲獨去閒。', '相看兩不厭，', '只有敬亭山。'] },
  { title: '靜坐·其一', author: '朱熹', lines: ['半畝方塘一鑑開，', '天光雲影共徘徊。', '問渠那得清如許，', '為有源頭活水來。'] },
];

// collect chars
const need = new Set();
for (const l of BASIC) for (const c of l.chars) need.add(c);
for (const p of POEMS) for (const line of p.lines) for (const c of line) if (/[\u4e00-\u9fff]/.test(c)) need.add(c);

const existing = new Set(
  (await readdir('assets/strokes')).filter((f) => f.endsWith('.json')).map((f) => String.fromCodePoint(parseInt(f.replace('.json', ''), 16))),
);
const missing = [...need].filter((c) => !existing.has(c));
console.log(`need ${need.size} chars, missing ${missing.length}`);
if (missing.length) console.log('missing:', missing.join(''));

const outDir = path.resolve('assets/strokes');
for (const ch of missing) {
  const code = ch.codePointAt(0).toString(16).padStart(4, '0');
  const url = `https://unpkg.com/hanzi-writer-data@2.0.1/${encodeURIComponent(ch)}.json`;
  let res;
  for (let i = 0; i < 3; i++) {
    res = await fetch(url);
    if (res.ok) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (!res || !res.ok) {
    console.error(`FAIL ${ch} U+${code}`);
    continue;
  }
  const data = await res.json();
  await writeFile(path.join(outDir, `${code}.json`), JSON.stringify({ strokes: data.strokes, medians: data.medians }));
  console.log(`ok ${ch} U+${code}`);
}

const allFiles = (await readdir(outDir)).filter((f) => f.endsWith('.json'));
const entries = allFiles
  .map((f) => {
    const ch = String.fromCodePoint(parseInt(f.replace('.json', ''), 16));
    return `  '${ch}': require('@/assets/strokes/${f}'),`;
  })
  .sort()
  .join('\n');
await writeFile(
  path.resolve('data/characters.ts'),
  `// GENERATED by scripts/rebuild-curriculum.mjs — do not edit by hand.
// Stroke data: Make-Me-A-Hanzi (Arphic Public License).
import type { CharStrokeData } from '@/lib/types';

export const STROKE_DATA: Record<string, CharStrokeData> = {
${entries}
};
`,
);
console.log(`registry: ${allFiles.length} chars`);

// emit curriculum levels
const levelEntries = [];
const basicSubtitles = {
  b01: '由一畫開始，寫平直橫畫', b02: '由上到下，寫正直豎畫',
  b03: '向左下撇出，如人字第一筆', b04: '向右下捺出，如人字第二筆',
  b05: '輕輕一點，由左上向右下', b06: '向上一提，由下向上挑',
  b07: '橫後向下折，轉彎不停筆', b08: '豎後向右折，如山字中間',
  b09: '撇後轉彎，如去字上半', b10: '豎彎後向上鉤，如也字最後',
  b11: '斜斜落筆後向上鉤，如我字', b12: '彎彎臥倒鉤，如心字中間',
  b13: '橫折後向下鉤，如力字', b14: '多個轉折組合，一氣呵成',
  b15: '左窄右寬，左邊讓右邊', b16: '上緊下鬆，上面蓋下面',
  b17: '外框包內裏，先外後內', b18: '筆畫互相穿插，避讓得宜',
};
let poemIdx = 0;
for (let i = 0; i < BASIC.length; i++) {
  const l = BASIC[i];
  levelEntries.push(`  {
    id: '${l.id}',
    title: '${l.title}',
    subtitle: '${basicSubtitles[l.id]}',
    focus: ['${l.focus[0]}'],
    chars: '${l.chars}'.split(''),
    kind: 'basic',
  },`);
}
for (const p of POEMS) {
  poemIdx++;
  const chars = [...new Set(p.lines.join('').replace(/[^\u4e00-\u9fff]/g, '').split(''))].join('');
  const id = `p${String(poemIdx).padStart(2, '0')}`;
  const firstLine = p.lines[0].replace(/[，。]/g, '');
  levelEntries.push(`  {
    id: '${id}',
    title: '${p.title}',
    subtitle: '${p.author}・${firstLine}',
    focus: ['詩詞'],
    chars: '${chars}'.split(''),
    kind: 'poem',
    poem: {
      title: '${p.title}',
      author: '${p.author}',
      lines: [${p.lines.map((l) => `'${l}'`).join(', ')}],
    },
  },`);
}

const cur = `export type Level = {
  id: string;
  title: string;
  subtitle: string;
  focus: string[];
  chars: string[];
  kind: 'basic' | 'poem';
  poem?: { title: string; author: string; lines: string[] };
};

export const LEVELS: Level[] = [
${levelEntries.join('\n')}
];

export function isLevelUnlocked(
  index: number,
  completed: Record<string, string[]>,
): boolean {
  const level = LEVELS[index];
  if (!level) return false;
  // basic levels unlock sequentially among basics; poems unlock among poems
  const sameKind = LEVELS.filter((l) => l.kind === level.kind);
  const pos = sameKind.indexOf(level);
  if (pos === 0) return true;
  const prev = sameKind[pos - 1];
  const done = completed[prev.id] ?? [];
  return prev.chars.every((c) => done.includes(c));
}

export function levelProgress(level: Level, completed: Record<string, string[]>): number {
  const done = completed[level.id] ?? [];
  return level.chars.filter((c) => done.includes(c)).length / level.chars.length;
}

export function levelStars(level: Level, stars: Record<string, Record<string, number>>): number {
  const map = stars[level.id] ?? {};
  return level.chars.reduce((acc, c) => acc + (map[c] ?? 0), 0);
}

/** 勳章: every char in the level earned 3 stars */
export function isLevelMastered(level: Level, stars: Record<string, Record<string, number>>): boolean {
  const map = stars[level.id] ?? {};
  return level.chars.every((c) => (map[c] ?? 0) >= 3);
}
`;
await writeFile(path.resolve('data/curriculum.ts'), cur);
console.log(`curriculum: ${BASIC.length} basic + ${POEMS.length} poem = ${levelEntries.length} levels`);
