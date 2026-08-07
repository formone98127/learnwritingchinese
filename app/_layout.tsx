import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LaunchSplash } from '@/components/LaunchSplash';
import { ThemeProvider, useTheme } from '@/constants/colors';
import { SITE_DESCRIPTION, SITE_OG_IMAGE, SITE_TITLE, SITE_URL } from '@/constants/site';
import { ProgressProvider } from '@/lib/progress';

SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStack() {
  const { colors, resolved } = useTheme();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  const [nativeHidden, setNativeHidden] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setNativeHidden(true));
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content={SITE_TITLE} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:image" content={SITE_OG_IMAGE} />
        <meta property="og:locale" content="zh_HK" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={SITE_OG_IMAGE} />
      </Head>
      <ThemeProvider>
        <ProgressProvider>
          <ThemedStack />
          {nativeHidden && !splashDone && <LaunchSplash onFinish={() => setSplashDone(true)} />}
        </ProgressProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
