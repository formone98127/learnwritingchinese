import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { APP_LOCALE } from '@/constants/locale';
import { WEB_BASE } from '@/constants/webBase';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang={APP_LOCALE === 'ur' ? 'ur' : 'zh-HK'}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <link rel="icon" type="image/png" sizes="48x48" href={`${WEB_BASE}/favicon.png`} />
        <link rel="apple-touch-icon" href={`${WEB_BASE}/apple-touch-icon.png`} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
