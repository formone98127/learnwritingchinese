import { useCallback, useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { t } from '@/lib/i18n';

type Props = {
  onFinish: () => void;
};

/** Branded app launch overlay — fades in, holds, then fades out. */
export function LaunchSplash({ onFinish }: Props) {
  const finishedRef = useRef(false);
  const safeFinish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  const overlay = useSharedValue(1);
  const title = useSharedValue(0);
  const rule = useSharedValue(0);
  const credit = useSharedValue(0);

  useEffect(() => {
    title.value = withTiming(1, { duration: 700 });
    rule.value = withDelay(350, withTiming(1, { duration: 500 }));
    credit.value = withDelay(700, withTiming(1, { duration: 500 }));
    overlay.value = withDelay(
      2400,
      withTiming(0, { duration: 550 }, (done) => {
        if (done) runOnJS(safeFinish)();
      }),
    );
    // web: reanimated runOnJS callback may not fire — always unmount via timeout
    const fallback = setTimeout(safeFinish, Platform.OS === 'web' ? 2800 : 3500);
    return () => clearTimeout(fallback);
  }, [credit, overlay, rule, safeFinish, title]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value,
    transform: [{ translateY: (1 - title.value) * 12 }],
  }));
  const ruleStyle = useAnimatedStyle(() => ({
    opacity: rule.value,
    transform: [{ scaleX: rule.value }],
  }));
  const creditStyle = useAnimatedStyle(() => ({
    opacity: credit.value,
    transform: [{ translateY: (1 - credit.value) * 8 }],
  }));

  return (
    <Pressable style={styles.overlay} onPress={safeFinish} accessibilityRole="button">
      <Animated.View style={[StyleSheet.absoluteFillObject, overlayStyle]} pointerEvents="none">
        <View style={styles.center}>
          <Animated.Text style={[styles.title, titleStyle]}>{t('siteTitle')}</Animated.Text>
          <Animated.View style={[styles.rule, ruleStyle]} />
          <Animated.Text style={[styles.credit, creditStyle]}>by Hagan Creactive</Animated.Text>
          {Platform.OS === 'web' && (
            <Animated.Text style={[styles.tapHint, creditStyle]}>{t('tapContinue')}</Animated.Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  center: { alignItems: 'center' },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: 8,
  },
  rule: {
    width: 96,
    height: 2,
    backgroundColor: Colors.vermillion,
    marginTop: 18,
    marginBottom: 16,
    borderRadius: 1,
  },
  credit: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 2,
  },
  tapHint: {
    marginTop: 28,
    fontSize: 13,
    color: Colors.inkLight,
  },
});
