import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { LaunchSplash } from '@/components/LaunchSplash';
import { ThemeProvider, useTheme } from '@/constants/colors';
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
    <ThemeProvider>
      <ProgressProvider>
        <ThemedStack />
        {nativeHidden && !splashDone && <LaunchSplash onFinish={() => setSplashDone(true)} />}
      </ProgressProvider>
    </ThemeProvider>
  );
}
