import { APP_LOCALE } from '@/constants/locale';
import { t } from '@/lib/i18n';

export const SITE_URL = 'https://formone98127.github.io/learnwritingchinese/ur';
export const SITE_TITLE = t('siteTitle');
export const SITE_DESCRIPTION = t('siteDescription');
export const SITE_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const SITE_LOCALE = APP_LOCALE === 'ur' ? 'ur_PK' : 'zh_HK';
