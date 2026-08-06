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
  {
    id: 'l9',
    title: '憫農',
    subtitle: '李紳・鋤禾日當午',
    focus: ['詩詞'],
    chars: '鋤禾日當午汗滴下土誰知盤中餐粒皆辛苦'.split(''),
    kind: 'poem',
    poem: {
      title: '憫農',
      author: '李紳',
      lines: ['鋤禾日當午，', '汗滴禾下土。', '誰知盤中餐，', '粒粒皆辛苦。'],
    },
  },
  {
    id: 'l10',
    title: '畫',
    subtitle: '王維・遠看山有色',
    focus: ['詩詞'],
    chars: '遠看山有色近聽水無聲春去花還在人來鳥不驚'.split(''),
    kind: 'poem',
    poem: {
      title: '畫',
      author: '王維',
      lines: ['遠看山有色，', '近聽水無聲。', '春去花還在，', '人來鳥不驚。'],
    },
  },
  {
    id: 'l11',
    title: '江雪',
    subtitle: '柳宗元・千山鳥飛絕',
    focus: ['詩詞'],
    chars: '千山鳥飛絕萬徑人蹤滅孤舟蓑笠翁獨釣寒江雪'.split(''),
    kind: 'poem',
    poem: {
      title: '江雪',
      author: '柳宗元',
      lines: ['千山鳥飛絕，', '萬徑人蹤滅。', '孤舟蓑笠翁，', '獨釣寒江雪。'],
    },
  },
  {
    id: 'l12',
    title: '一去二三里',
    subtitle: '邵雍・一去二三里',
    focus: ['詩詞'],
    chars: '一去二三里煙村四五家亭台六七座八九十枝花'.split(''),
    kind: 'poem',
    poem: {
      title: '一去二三里',
      author: '邵雍',
      lines: ['一去二三里，', '煙村四五家。', '亭台六七座，', '八九十枝花。'],
    },
  },
  {
    id: 'l13',
    title: '詠鵝',
    subtitle: '駱賓王・鵝鵝鵝',
    focus: ['詩詞'],
    chars: '鵝曲項向天歌白毛浮綠水紅掌撥清波'.split(''),
    kind: 'poem',
    poem: {
      title: '詠鵝',
      author: '駱賓王',
      lines: ['鵝鵝鵝，', '曲項向天歌。', '白毛浮綠水，', '紅掌撥清波。'],
    },
  },
  {
    id: 'l14',
    title: '望廬山瀑布',
    subtitle: '李白・日照香爐生紫煙',
    focus: ['詩詞'],
    chars: '日照香爐生紫煙遙看瀑布掛前川飛流直下三千尺疑是銀河落九天'.split(''),
    kind: 'poem',
    poem: {
      title: '望廬山瀑布',
      author: '李白',
      lines: ['日照香爐生紫煙，', '遙看瀑布掛前川。', '飛流直下三千尺，', '疑是銀河落九天。'],
    },
  },
  {
    id: 'l15',
    title: '回鄉偶書',
    subtitle: '賀知章・少小離家老大回',
    focus: ['詩詞'],
    chars: '少小離家老大回鄉音無改鬢毛衰兒童相見不相識笑問客從何處來'.split(''),
    kind: 'poem',
    poem: {
      title: '回鄉偶書',
      author: '賀知章',
      lines: ['少小離家老大回，', '鄉音無改鬢毛衰。', '兒童相見不相識，', '笑問客從何處來。'],
    },
  },
  {
    id: 'l16',
    title: '楓橋夜泊',
    subtitle: '張繼・月落烏啼霜滿天',
    focus: ['詩詞'],
    chars: '月落烏啼霜滿天江楓漁火對愁眠姑蘇城外寒山寺夜半鐘聲到客船'.split(''),
    kind: 'poem',
    poem: {
      title: '楓橋夜泊',
      author: '張繼',
      lines: ['月落烏啼霜滿天，', '江楓漁火對愁眠。', '姑蘇城外寒山寺，', '夜半鐘聲到客船。'],
    },
  },
  {
    id: 'l17',
    title: '尋隱者不遇',
    subtitle: '賈島・松下問童子',
    focus: ['詩詞'],
    chars: '松下問童子言師採藥去只在此山中雲深不知處'.split(''),
    kind: 'poem',
    poem: {
      title: '尋隱者不遇',
      author: '賈島',
      lines: ['松下問童子，', '言師採藥去。', '只在此山中，', '雲深不知處。'],
    },
  },
  {
    id: 'l18',
    title: '相思',
    subtitle: '王維・紅豆生南國',
    focus: ['詩詞'],
    chars: '紅豆生南國春來發幾枝願君多採擷此物最相思'.split(''),
    kind: 'poem',
    poem: {
      title: '相思',
      author: '王維',
      lines: ['紅豆生南國，', '春來發幾枝。', '願君多採擷，', '此物最相思。'],
    },
  },
  // --- additional basic stages (thematic, progressive difficulty) ---
  {
    id: 'b6',
    title: '第六關・人體部位',
    subtitle: '耳目口舌，認識身體',
    focus: ['象形'],
    chars: '耳目口舌牙心手足肉骨'.split(''),
    kind: 'basic',
  },
  {
    id: 'b7',
    title: '第七關・自然天地',
    subtitle: '日月星辰，風雨雷電',
    focus: ['自然'],
    chars: '日月星雲風雨雷電山川'.split(''),
    kind: 'basic',
  },
  {
    id: 'b8',
    title: '第八關・動物世界',
    subtitle: '牛馬羊豕，鳥魚虫龍',
    focus: ['動物'],
    chars: '牛馬羊豕犬鳥魚虫龍'.split(''),
    kind: 'basic',
  },
  {
    id: 'b9',
    title: '第九關・植物花草',
    subtitle: '花草樹木，五穀果蔬',
    focus: ['植物'],
    chars: '花草木禾竹葉果米豆'.split(''),
    kind: 'basic',
  },
  {
    id: 'b10',
    title: '第十關・屋企生活',
    subtitle: '家室門戶，傢俬日常',
    focus: ['生活'],
    chars: '家室門戶窗床桌椅燈'.split(''),
    kind: 'basic',
  },
  {
    id: 'b11',
    title: '第十一關・數量時間',
    subtitle: '一二三四，百千萬億',
    focus: ['數量'],
    chars: '一二三四五六七八九十百千萬'.split(''),
    kind: 'basic',
  },
  {
    id: 'b12',
    title: '第十二關・顏色形狀',
    subtitle: '紅黃藍綠，色彩繽紛',
    focus: ['顏色'],
    chars: '紅黃藍綠白黑紫灰金'.split(''),
    kind: 'basic',
  },
  {
    id: 'b13',
    title: '第十三關・動作行為',
    subtitle: '走跑跳坐，寫出動作',
    focus: ['動作'],
    chars: '走跑跳坐立企拿放開'.split(''),
    kind: 'basic',
  },
  {
    id: 'b14',
    title: '第十四關・情感心理',
    subtitle: '喜怒哀樂，表達情感',
    focus: ['情感'],
    chars: '愛恨喜怒哀樂悲恐驚'.split(''),
    kind: 'basic',
  },
  {
    id: 'b15',
    title: '第十五關・學校學習',
    subtitle: '書筆紙字，學習用具',
    focus: ['學習'],
    chars: '書筆紙字畫讀寫算學'.split(''),
    kind: 'basic',
  },
  // --- additional poems ---
  {
    id: 'p7',
    title: '七步詩',
    subtitle: '曹植・煮豆燃豆萁',
    focus: ['詩詞'],
    chars: '煮豆燃萁釜中泣本同根生相煎何太急'.split(''),
    kind: 'poem',
    poem: {
      title: '七步詩',
      author: '曹植',
      lines: ['煮豆燃豆萁，', '豆在釜中泣。', '本是同根生，', '相煎何太急。'],
    },
  },
  {
    id: 'p8',
    title: '草',
    subtitle: '白居易・離離原上草',
    focus: ['詩詞'],
    chars: '離原上草一歲枯榮野火燒不盡春風吹又生'.split(''),
    kind: 'poem',
    poem: {
      title: '草',
      author: '白居易',
      lines: ['離離原上草，', '一歲一枯榮。', '野火燒不盡，', '春風吹又生。'],
    },
  },
  {
    id: 'p9',
    title: '憫農（其二）',
    subtitle: '李紳・春種一粒粟',
    focus: ['詩詞'],
    chars: '春種一粒粟秋收萬顆子四海無閒田農夫猶餓死'.split(''),
    kind: 'poem',
    poem: {
      title: '憫農（其二）',
      author: '李紳',
      lines: ['春種一粒粟，', '秋收萬顆子。', '四海無閒田，', '農夫猶餓死。'],
    },
  },
  {
    id: 'p10',
    title: '畫雞',
    subtitle: '唐寅・頭上紅冠不用裁',
    focus: ['詩詞'],
    chars: '頭上紅冠不用裁滿身雪白走將來平生不敢輕言語一叫千門萬戶開'.split(''),
    kind: 'poem',
    poem: {
      title: '畫雞',
      author: '唐寅',
      lines: ['頭上紅冠不用裁，', '滿身雪白走將來。', '平生不敢輕言語，', '一叫千門萬戶開。'],
    },
  },
  {
    id: 'p11',
    title: '風',
    subtitle: '李嶠・解落三秋葉',
    focus: ['詩詞'],
    chars: '解落三秋葉能開二月花過江千尺浪入竹萬竿斜'.split(''),
    kind: 'poem',
    poem: {
      title: '風',
      author: '李嶠',
      lines: ['解落三秋葉，', '能開二月花。', '過江千尺浪，', '入竹萬竿斜。'],
    },
  },
  {
    id: 'p12',
    title: '鹿柴',
    subtitle: '王維・空山不見人',
    focus: ['詩詞'],
    chars: '空山不見人但聞語響返景入深林復照青苔上'.split(''),
    kind: 'poem',
    poem: {
      title: '鹿柴',
      author: '王維',
      lines: ['空山不見人，', '但聞人語響。', '返景入深林，', '復照青苔上。'],
    },
  },
  {
    id: 'p13',
    title: '竹里館',
    subtitle: '王維・獨坐幽篁裏',
    focus: ['詩詞'],
    chars: '獨坐幽篁裏彈琴復長嘯深林人不知明月來相照'.split(''),
    kind: 'poem',
    poem: {
      title: '竹里館',
      author: '王維',
      lines: ['獨坐幽篁裏，', '彈琴復長嘯。', '深林人不知，', '明月來相照。'],
    },
  },
  {
    id: 'p14',
    title: '宿建德江',
    subtitle: '孟浩然・移舟泊煙渚',
    focus: ['詩詞'],
    chars: '移舟泊煙渚日暮客愁新野曠天低樹江清月近人'.split(''),
    kind: 'poem',
    poem: {
      title: '宿建德江',
      author: '孟浩然',
      lines: ['移舟泊煙渚，', '日暮客愁新。', '野曠天低樹，', '江清月近人。'],
    },
  },
  {
    id: 'p15',
    title: '獨坐敬亭山',
    subtitle: '李白・眾鳥高飛盡',
    focus: ['詩詞'],
    chars: '眾鳥高飛盡孤雲獨去閒相看兩不厭只有敬亭山'.split(''),
    kind: 'poem',
    poem: {
      title: '獨坐敬亭山',
      author: '李白',
      lines: ['眾鳥高飛盡，', '孤雲獨去閒。', '相看兩不厭，', '只有敬亭山。'],
    },
  },
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
