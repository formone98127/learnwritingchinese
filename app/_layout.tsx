import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/colors';
import { ProgressProvider } from '@/lib/progress';

export default function RootLayout() {
  return (
    <ProgressProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.paper },
        }}
      />
      <StatusBar style="dark" />
    </ProgressProvider>
  );
}
