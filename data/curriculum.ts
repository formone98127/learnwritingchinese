export type Level = {
  id: string;
  title: string;
  subtitle: string;
  focus: string[];
  chars: string[];
  kind: 'basic' | 'poem';
  poem?: { title: string; author: string; lines: string[] };
};

export const LEVELS: Level[] = [
  {
    id: 'l1',
    title: '第一關・橫與豎',
    subtitle: '由一畫開始，學識橫、豎',
    focus: ['橫', '豎'],
    chars: ['一', '二', '三', '十', '土', '王', '上', '工'],
    kind: 'basic',
  },
  {
    id: 'l2',
    title: '第二關・撇與捺',
    subtitle: '向左撇、向右捺，寫出人字',
    focus: ['撇', '捺'],
    chars: ['人', '八', '入', '大', '天', '木', '禾', '火'],
    kind: 'basic',
  },
  {
    id: 'l3',
    title: '第三關・點與提',
    subtitle: '輕輕一點、向上一提',
    focus: ['點', '提'],
    chars: ['六', '小', '少', '太', '玉', '主', '江', '河'],
    kind: 'basic',
  },
  {
    id: 'l4',
    title: '第四關・轉折',
    subtitle: '橫折、豎折，轉彎不停筆',
    focus: ['折'],
    chars: ['口', '日', '目', '月', '田', '山', '白', '石'],
    kind: 'basic',
  },
  {
    id: 'l5',
    title: '第五關・鉤與綜合',
    subtitle: '豎鉤、彎鉤、臥鉤、斜鉤',
    focus: ['鉤'],
    chars: ['了', '子', '手', '力', '水', '心', '也', '我'],
    kind: 'basic',
  },
  {
    id: 'l6',
    title: '靜夜思',
    subtitle: '李白・床前明月光',
    focus: ['詩詞'],
    chars: '床前明月光疑是地上霜舉頭望低思故鄉'.split(''),
    kind: 'poem',
    poem: {
      title: '靜夜思',
      author: '李白',
      lines: ['床前明月光，', '疑是地上霜。', '舉頭望明月，', '低頭思故鄉。'],
    },
  },
  {
    id: 'l7',
    title: '春曉',
    subtitle: '孟浩然・春眠不覺曉',
    focus: ['詩詞'],
    chars: '春眠不覺曉處聞啼鳥夜來風雨聲花落知多少'.split(''),
    kind: 'poem',
    poem: {
      title: '春曉',
      author: '孟浩然',
      lines: ['春眠不覺曉，', '處處聞啼鳥。', '夜來風雨聲，', '花落知多少。'],
    },
  },
  {
    id: 'l8',
    title: '登鸛雀樓',
    subtitle: '王之渙・欲窮千里目',
    focus: ['詩詞'],
    chars: '白日依山盡黃河入海流欲窮千里目更上一層樓'.split(''),
    kind: 'poem',
    poem: {
      title: '登鸛雀樓',
      author: '王之渙',
      lines: ['白日依山盡，', '黃河入海流。', '欲窮千里目，', '更上一層樓。'],
    },
  },
];

export function isLevelUnlocked(
  index: number,
  completed: Record<string, string[]>,
): boolean {
  if (index === 0) return true;
  const prev = LEVELS[index - 1];
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
