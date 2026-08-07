import type { Level } from '@/data/curriculum';
import { APP_LOCALE, type AppLocale } from '@/constants/locale';
import { FOCUS_UR, LEVEL_UR, STAGE_UR } from '@/lib/i18n/levels-ur';
import type { StrokeError } from '@/components/TracePad';

type Params = Record<string, string | number>;

const MESSAGES = {
  'zh-HK': {
    siteTitle: '筆順學堂',
    siteDescription: '睇住寫，跟住寫，一筆一畫學繁體',
    appSubtitle: '睇住寫，跟住寫，一筆一畫學繁體',
    searchPlaceholder: '查字典：輸入中文字或粵拼',
    searchEmpty: '字典搵唔到「{query}」',
    todayReview: '今日複習',
    reviewDue: '{count} 個字要溫',
    reviewFresh: '溫故知新',
    learningReport: '學習報告',
    reportSub: '進度同弱項分析',
    basicStrokes: '基本筆畫',
    compoundStrokes: '複合筆畫',
    structure: '間架結構',
    morePractice: '更多練習',
    poemPractice: '詩詞練習',
    poemCount: '共 {count} 首古詩・勳章 {medals}',
    examMode: '考核模式',
    examSub: '冇示範，自己寫・攞滿星得勳章',
    resetProgress: '重設學習進度',
    resetConfirm: '確定要清走晒所有學習進度？',
    resetTitle: '重設進度',
    cancel: '取消',
    confirm: '確定',
    reset: '重設',
    switchProfile: '切換學習者',
    addProfile: '新增學習者',
    namePlaceholder: '輸入名稱',
    charProgress: '{done} / {total} 字・★ {stars} / {maxStars}',
    settings: '設定',
    voiceSection: '朗讀語音',
    voiceYue: '廣東話',
    voiceCmn: '普通話',
    speedSection: '朗讀速度',
    demoSpeedSection: '展示筆順速度',
    speedSlow: '慢',
    speedNormal: '正常',
    speedFast: '快',
    examTitle: '考核模式',
    examMedals: '勳章 {done} / {total}',
    examIntro:
      '考核模式冇示範，由你自己憑筆順寫出每個字。每筆都會計分，攞滿星就有勳章。',
    reviewTitle: '今日複習',
    reviewCount: '{count} 字',
    reviewIntro:
      '呢啲係你之前寫得唔夠準、或者好耐冇練嘅字。溫故知新，寫多次會記得牢啲。',
    reviewEmptyTitle: '全部記熟晒！',
    reviewEmptyText: '你已掌握 {count} 個滿星字。去學新關卡，或者聽日再返嚟複習。',
    reportTitle: '學習報告',
    reportGreeting: '{name} 嘅學習進度',
    statWritten: '已寫字',
    statThreeStar: '滿星字',
    statMedals: '勳章',
    statStreak: '連續日',
    last7Days: '最近 7 日',
    weakChars: '需要加強嘅字',
    poemsTitle: '詩詞練習',
    poemsHeader: '共 {count} 首・勳章 {medals}',
    poemsHint: '完成基本筆畫關卡後，就可以寫成一首詩',
    dictTitle: '查字典',
    dictMissing: '字典未收錄「{char}」',
    back: '返回',
    levelNotFound: '搵唔到呢一關',
    strokeTotal: '共 {count} 筆',
    radical: '　部首：{name}',
    replayStrokes: '重播筆順',
    tryWrite: '試寫',
    formulaLabel: '口訣',
    modeLearn: '學習',
    modeTest: '測試',
    strokeLabel: '第 {num} 筆{suffix}（共 {total} 筆）',
    strokeSuffix: '・{name}',
    nextChar: '下一個字',
    finishLevel: '完成關卡',
    undoStroke: '上一筆',
    hint: '提示',
    rewriteChar: '重寫此字',
    skipDemo: '跳過示範',
    watchFirst: '睇住上面先，跟住就到你寫',
    levelDone: '關卡完成！',
    levelDoneSub: '你已經寫晒「{title}」嘅 {count} 個字',
    fullStarMedal: '滿星勳章攞到！',
    nextLevel: '下一關：{title}',
    backHome: '返回首頁',
    shareScore: '分享成績',
    tapContinue: '點擊繼續',
    onboardingSkip: '跳過',
    onboardingNext: '下一步',
    onboardingStart: '開始學習',
    onboard1Title: '跟住紅點寫',
    onboard1Text: '由紅點開始，跟住虛線一筆一畫寫。寫得準就有星！',
    onboard2Title: '先睇示範',
    onboard2Text: '每個字會先示範筆順，睇完就自己寫。可以跳過示範直接寫。',
    onboard3Title: '測試同考核',
    onboard3Text: '學完一關，可以切換「測試」或者去「考核模式」，冇示範靠自己寫。',
    onboard4Title: '攞勳章',
    onboard4Text: '每個字寫滿 3 星，成關攞滿星就有勳章。仲有複習同報告幫你記得牢！',
    errorWrongStart: '要由紅點嗰度起筆呀',
    errorWrongStartTest: '起筆位置唔啱，再諗下先',
    errorSloppy: '寫歪咗，呢筆重新寫',
    errorNotStandard: '唔夠標準，再寫多次',
    errorWrongDirection: '方向倒轉咗，跟返箭嘴寫',
    errorIncomplete: '未寫完呢筆，繼續',
    praise1: '寫得好！',
    praise2: '好嘢！',
    praise3: '叻喎！',
    praise4: '做得好啊！',
  },
  ur: {
    siteTitle: 'لکھائی کی ترتیب',
    siteDescription: 'دیکھیں، لکھیں، ایک ایک لکیر سے روایتی چینی سیکھیں',
    appSubtitle: 'دیکھیں، لکھیں، ایک ایک لکیر سے روایتی چینی سیکھیں',
    searchPlaceholder: 'لغت: چینی حرف یا Jyutping درج کریں',
    searchEmpty: 'لغت میں "{query}" نہیں ملا',
    todayReview: 'آج کی دہرائی',
    reviewDue: '{count} حروف دہرانے ہیں',
    reviewFresh: 'دہرائی سے یاد مضبوط',
    learningReport: 'سیکھنے کی رپورٹ',
    reportSub: 'پیشرفت اور کمزور شعبے',
    basicStrokes: 'بنیادی لکیریں',
    compoundStrokes: 'مرکب لکیریں',
    structure: 'حروف کی ساخت',
    morePractice: 'مزید مشق',
    poemPractice: 'شاعری کی مشق',
    poemCount: '{count} نظمیں・تمغے {medals}',
    examMode: 'امتحان موڈ',
    examSub: 'بغیر مثال، خود لکھیں・3 ستارے = تمغہ',
    resetProgress: 'سیکھنے کی پیشرفت ری سیٹ',
    resetConfirm: 'تمام سیکھنے کی پیشرفت مٹا دیں؟',
    resetTitle: 'پیشرفت ری سیٹ',
    cancel: 'منسوخ',
    confirm: 'ٹھیک',
    reset: 'ری سیٹ',
    switchProfile: 'سیکھنے والا بدلیں',
    addProfile: 'نیا سیکھنے والا',
    namePlaceholder: 'نام درج کریں',
    charProgress: '{done} / {total} حرف・★ {stars} / {maxStars}',
    settings: 'ترتیبات',
    voiceSection: 'آواز کی زبان',
    voiceYue: 'کینٹونی (廣東話)',
    voiceCmn: 'مینڈارن (普通話)',
    speedSection: 'آواز کی رفتار',
    demoSpeedSection: 'لکیروں کی نمائش کی رفتار',
    speedSlow: 'آہستہ',
    speedNormal: 'عام',
    speedFast: 'تیز',
    examTitle: 'امتحان موڈ',
    examMedals: 'تمغے {done} / {total}',
    examIntro:
      'امتحان میں مثال نہیں۔ خود لکیروں کی ترتیب یاد کر کے لکھیں۔ ہر لکیر پر نمبر ملتا ہے، 3 ستارے = تمغہ۔',
    reviewTitle: 'آج کی دہرائی',
    reviewCount: '{count} حرف',
    reviewIntro:
      'یہ وہ حروف ہیں جو غلط لکھے یا کافی عرصے سے مشق نہیں کی۔ دہرائیں، یاد دیر تک رہے گی۔',
    reviewEmptyTitle: 'سب یاد ہو گیا!',
    reviewEmptyText:
      'آپ نے {count} حروف پر 3 ستارے حاصل کیے۔ نیا سبق شروع کریں یا کل دوبارہ آئیں۔',
    reportTitle: 'سیکھنے کی رپورٹ',
    reportGreeting: '{name} کی پیشرفت',
    statWritten: 'لکھے حروف',
    statThreeStar: '3 ستارے',
    statMedals: 'تمغے',
    statStreak: 'مسلسل دن',
    last7Days: 'آخری 7 دن',
    weakChars: 'مزید مشق والے حروف',
    poemsTitle: 'شاعری کی مشق',
    poemsHeader: '{count} نظمیں・تمغے {medals}',
    poemsHint: 'بنیادی لکیروں کے سبق مکمل کرنے کے بعد نظم لکھ سکتے ہیں',
    dictTitle: 'لغت',
    dictMissing: 'لغت میں "{char}" نہیں',
    back: 'واپس',
    levelNotFound: 'یہ سبق نہیں ملا',
    strokeTotal: 'کل {count} لکیریں',
    radical: '　部首: {name}',
    replayStrokes: 'لکیروں کی ترتیب دوبارہ',
    tryWrite: 'لکھ کر دیکھیں',
    formulaLabel: 'اصول',
    modeLearn: 'سیکھیں',
    modeTest: 'ٹیسٹ',
    strokeLabel: 'لکیر {num}{suffix} (کل {total})',
    strokeSuffix: '・{name}',
    nextChar: 'اگلا حرف',
    finishLevel: 'سبق مکمل',
    undoStroke: 'پچھلی لکیر',
    hint: 'اشارہ',
    rewriteChar: 'یہ حرف دوبارہ',
    skipDemo: 'مثال چھوڑیں',
    watchFirst: 'اوپر دیکھیں، پھر آپ کی باری',
    levelDone: 'سبق مکمل!',
    levelDoneSub: 'آپ نے "{title}" کے {count} حروف لکھ لیے',
    fullStarMedal: 'مکمل ستاروں کا تمغہ!',
    nextLevel: 'اگلا سبق: {title}',
    backHome: 'ہوم پر واپس',
    shareScore: 'نتیجہ شیئر',
    tapContinue: 'جاری رکھنے کے لیے ٹیپ',
    onboardingSkip: 'چھوڑیں',
    onboardingNext: 'اگلا',
    onboardingStart: 'سیکھنا شروع',
    onboard1Title: 'سرخ نقطے سے لکھیں',
    onboard1Text: 'سرخ نقطے سے شروع کریں، ٹوٹی لکیروں پر لکھیں۔ درست لکھنے پر ستارے ملیں گے!',
    onboard2Title: 'پہلے مثال دیکھیں',
    onboard2Text: 'ہر حرف کی لکیروں کی ترتیب پہلے دکھائی جاتی ہے، پھر آپ لکھیں۔ مثال چھوڑ سکتے ہیں۔',
    onboard3Title: 'ٹیسٹ اور امتحان',
    onboard3Text: 'سبق کے بعد «ٹیسٹ» یا «امتحان موڈ» میں بغیر مثال خود لکھیں۔',
    onboard4Title: 'تمغہ حاصل کریں',
    onboard4Text: 'ہر حرف پر 3 ستارے، پورے سبق پر تمغہ۔ دہرائی اور رپورٹ یادداشت میں مدد کرتے ہیں!',
    errorWrongStart: 'سرخ نقطے سے شروع کریں',
    errorWrongStartTest: 'شروع کی جگہ غلط، سوچ کر دوبارہ',
    errorSloppy: 'ٹیڑhi لکیر، دوبارہ لکھیں',
    errorNotStandard: 'معیار کم، دوبارہ لکھیں',
    errorWrongDirection: 'سمت الٹ، تیر کی طرف لکھیں',
    errorIncomplete: 'لکیر مکمل نہیں، جاری رکھیں',
    praise1: 'بہت اچھا!',
    praise2: 'شاباش!',
    praise3: 'وah!',
    praise4: 'بہترین!',
  },
} as const satisfies Record<AppLocale, Record<string, string>>;

export type MessageKey = keyof (typeof MESSAGES)['ur'];

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function t(key: MessageKey, params?: Params): string {
  const locale = APP_LOCALE;
  const msg = MESSAGES[locale][key] ?? MESSAGES['zh-HK'][key];
  return interpolate(msg, params);
}

export function localizeLevel(level: Level): Pick<Level, 'title' | 'subtitle'> {
  if (APP_LOCALE !== 'ur') return { title: level.title, subtitle: level.subtitle };
  const ur = LEVEL_UR[level.id];
  return ur ?? { title: level.title, subtitle: level.subtitle };
}

export function localizeStage(stage: string): string {
  if (APP_LOCALE !== 'ur') return stage;
  return STAGE_UR[stage] ?? stage;
}

export function localizeFocus(focus: string): string {
  if (APP_LOCALE !== 'ur') return focus;
  return FOCUS_UR[focus] ?? focus;
}

export function getErrorHints(): Record<StrokeError, string> {
  return {
    'wrong-start': t('errorWrongStart'),
    'wrong-start-test': t('errorWrongStartTest'),
    sloppy: t('errorSloppy'),
    'not-standard': t('errorNotStandard'),
    'wrong-direction': t('errorWrongDirection'),
    incomplete: t('errorIncomplete'),
  };
}

const PRAISE_KEYS: MessageKey[] = ['praise1', 'praise2', 'praise3', 'praise4'];

export function randomPraiseUi(): string {
  return t(PRAISE_KEYS[Math.floor(Math.random() * PRAISE_KEYS.length)]);
}

export function onboardingSteps() {
  return [
    { icon: 'hand-left', title: t('onboard1Title'), text: t('onboard1Text') },
    { icon: 'eye', title: t('onboard2Title'), text: t('onboard2Text') },
    { icon: 'school', title: t('onboard3Title'), text: t('onboard3Text') },
    { icon: 'medal', title: t('onboard4Title'), text: t('onboard4Text') },
  ] as const;
}
