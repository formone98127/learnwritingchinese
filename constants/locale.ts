/** UI locale for this branch. Voice/audio stays Chinese (yue/cmn) in lib/speech.ts */
export type AppLocale = 'zh-HK' | 'ur';

export const APP_LOCALE: AppLocale = 'ur';

export const IS_RTL = APP_LOCALE === 'ur';
