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
    id: 'b01',
    title: '第一關・橫畫',
    subtitle: '由一畫開始，寫平直橫畫',
    focus: ['橫'],
    chars: '一二三十干土王工'.split(''),
    kind: 'basic',
  },
  {
    id: 'b02',
    title: '第二關・豎畫',
    subtitle: '由上到下，寫正直豎畫',
    focus: ['豎'],
    chars: '十上卜下不中川口'.split(''),
    kind: 'basic',
  },
  {
    id: 'b03',
    title: '第三關・撇畫',
    subtitle: '向左下撇出，如人字第一筆',
    focus: ['撇'],
    chars: '人八入大天夫木禾'.split(''),
    kind: 'basic',
  },
  {
    id: 'b04',
    title: '第四關・捺畫',
    subtitle: '向右下捺出，如人字第二筆',
    focus: ['捺'],
    chars: '人入大天木來火水'.split(''),
    kind: 'basic',
  },
  {
    id: 'b05',
    title: '第五關・點畫',
    subtitle: '輕輕一點，由左上向右下',
    focus: ['點'],
    chars: '六主玉太文方立小'.split(''),
    kind: 'basic',
  },
  {
    id: 'b06',
    title: '第六關・提畫',
    subtitle: '向上一提，由下向上挑',
    focus: ['提'],
    chars: '地場提把江河海流'.split(''),
    kind: 'basic',
  },
  {
    id: 'b07',
    title: '第七關・橫折',
    subtitle: '橫後向下折，轉彎不停筆',
    focus: ['橫折'],
    chars: '口日目月田白百石'.split(''),
    kind: 'basic',
  },
  {
    id: 'b08',
    title: '第八關・豎折',
    subtitle: '豎後向右折，如山字中間',
    focus: ['豎折'],
    chars: '山區亡出凹凸匪匹'.split(''),
    kind: 'basic',
  },
  {
    id: 'b09',
    title: '第九關・撇折',
    subtitle: '撇後轉彎，如去字上半',
    focus: ['撇折'],
    chars: '去雲公台允麼矣能'.split(''),
    kind: 'basic',
  },
  {
    id: 'b10',
    title: '第十關・豎彎鉤',
    subtitle: '豎彎後向上鉤，如也字最後',
    focus: ['豎彎鉤'],
    chars: '也已元无見光先兒'.split(''),
    kind: 'basic',
  },
  {
    id: 'b11',
    title: '第十一關・斜鉤',
    subtitle: '斜斜落筆後向上鉤，如我字',
    focus: ['斜鉤'],
    chars: '我成或戰裁戴感武'.split(''),
    kind: 'basic',
  },
  {
    id: 'b12',
    title: '第十二關・臥鉤',
    subtitle: '彎彎臥倒鉤，如心字中間',
    focus: ['臥鉤'],
    chars: '心必思怎急您忘念'.split(''),
    kind: 'basic',
  },
  {
    id: 'b13',
    title: '第十三關・橫折鉤',
    subtitle: '橫折後向下鉤，如力字',
    focus: ['橫折鉤'],
    chars: '力刀乃勿方房門問'.split(''),
    kind: 'basic',
  },
  {
    id: 'b14',
    title: '第十四關・複合筆畫',
    subtitle: '多個轉折組合，一氣呵成',
    focus: ['複合'],
    chars: '書畫馬鳥魚龍龜鳳'.split(''),
    kind: 'basic',
  },
  {
    id: 'b15',
    title: '第十五關・左右結構',
    subtitle: '左窄右寬，左邊讓右邊',
    focus: ['左右'],
    chars: '你他她們住江河海'.split(''),
    kind: 'basic',
  },
  {
    id: 'b16',
    title: '第十六關・上下結構',
    subtitle: '上緊下鬆，上面蓋下面',
    focus: ['上下'],
    chars: '字學家室草花思想'.split(''),
    kind: 'basic',
  },
  {
    id: 'b17',
    title: '第十七關・包圍結構',
    subtitle: '外框包內裏，先外後內',
    focus: ['包圍'],
    chars: '國圓圍困回同周風'.split(''),
    kind: 'basic',
  },
  {
    id: 'b18',
    title: '第十八關・穿插結構',
    subtitle: '筆畫互相穿插，避讓得宜',
    focus: ['穿插'],
    chars: '乘爽垂重無舞兼鼎'.split(''),
    kind: 'basic',
  },
  {
    id: 'p01',
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
    id: 'p02',
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
    id: 'p03',
    title: '登鸛雀樓',
    subtitle: '王之渙・白日依山盡',
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
    id: 'p04',
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
    id: 'p05',
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
    id: 'p06',
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
    id: 'p07',
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
    id: 'p08',
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
    id: 'p09',
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
    id: 'p10',
    title: '回鄉偶書',
    subtitle: '賀知章・少小離家老大回',
    focus: ['詩詞'],
    chars: '少小離家老大回鄉音無改鬢毛衰兒童相見不識笑問客從何處來'.split(''),
    kind: 'poem',
    poem: {
      title: '回鄉偶書',
      author: '賀知章',
      lines: ['少小離家老大回，', '鄉音無改鬢毛衰。', '兒童相見不相識，', '笑問客從何處來。'],
    },
  },
  {
    id: 'p11',
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
    id: 'p12',
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
    id: 'p13',
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
  {
    id: 'p14',
    title: '七步詩',
    subtitle: '曹植・煮豆燃豆萁',
    focus: ['詩詞'],
    chars: '煮豆燃萁在釜中泣本是同根生相煎何太急'.split(''),
    kind: 'poem',
    poem: {
      title: '七步詩',
      author: '曹植',
      lines: ['煮豆燃豆萁，', '豆在釜中泣。', '本是同根生，', '相煎何太急。'],
    },
  },
  {
    id: 'p15',
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
    id: 'p16',
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
    id: 'p17',
    title: '畫雞',
    subtitle: '唐寅・頭上紅冠不用裁',
    focus: ['詩詞'],
    chars: '頭上紅冠不用裁滿身雪白走將來平生敢輕言語一叫千門萬戶開'.split(''),
    kind: 'poem',
    poem: {
      title: '畫雞',
      author: '唐寅',
      lines: ['頭上紅冠不用裁，', '滿身雪白走將來。', '平生不敢輕言語，', '一叫千門萬戶開。'],
    },
  },
  {
    id: 'p18',
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
    id: 'p19',
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
    id: 'p20',
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
    id: 'p21',
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
    id: 'p22',
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
  {
    id: 'p23',
    title: '靜坐·其一',
    subtitle: '朱熹・半畝方塘一鑑開',
    focus: ['詩詞'],
    chars: '半畝方塘一鑑開天光雲影共徘徊問渠那得清如許為有源頭活水來'.split(''),
    kind: 'poem',
    poem: {
      title: '靜坐·其一',
      author: '朱熹',
      lines: ['半畝方塘一鑑開，', '天光雲影共徘徊。', '問渠那得清如許，', '為有源頭活水來。'],
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
