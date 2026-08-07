import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Platform } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';

type Props = {
  stars: number;
  praise: string;
  char?: string;
  onShare?: () => void;
};

function Star({ active, index, sv }: { active: boolean; index: number; sv: any }) {  const style = useAnimatedStyle(() => ({ transform: [{ scale: sv.value }] }));
  return (
    <Animated.View style={style}>
      <Ionicons name="star" size={52} color={active ? Colors.gold : Colors.inkFaint} />
    </Animated.View>
  );
}

/** Celebration card shown when a character is completed. */
export function CharDoneCelebration({ stars, praise, char, onShare }: Props) {
  const cardScale = useSharedValue(0.7);
  const cardOpacity = useSharedValue(0);
  const sv0 = useSharedValue(0);
  const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0);
  const praiseOpacity = useSharedValue(0);
  const praiseY = useSharedValue(12);

  useEffect(() => {
    cardScale.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    cardOpacity.value = withTiming(1, { duration: 250 });
    [sv0, sv1, sv2].forEach((sv, i) => {
      sv.value = withDelay(
        150 + i * 120,
        withSequence(
          withTiming(1.35, { duration: 220, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 180 }),
        ),
      );
    });
    praiseOpacity.value = withDelay(450, withTiming(1, { duration: 400 }));
    praiseY.value = withDelay(450, withTiming(0, { duration: 400 }));
    return () => cancelAnimation(cardScale);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));
  const praiseStyle = useAnimatedStyle(() => ({
    opacity: praiseOpacity.value,
    transform: [{ translateY: praiseY.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.starsRow}>
          <Star active={stars >= 1} index={0} sv={sv0} />
          <Star active={stars >= 2} index={1} sv={sv1} />
          <Star active={stars >= 3} index={2} sv={sv2} />
        </View>
        <Animated.Text style={[styles.praise, praiseStyle]}>{praise}</Animated.Text>
        {char && <Text style={styles.charText}>{char}</Text>}
        {onShare && Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.shareBtn} onPress={onShare} hitSlop={8}>
            <Ionicons name="share-social" size={14} color="#FFFDF7" />
            <Text style={styles.shareBtnText}>分享成績</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}


const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  card: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: '#B98A2F',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  starsRow: { flexDirection: 'row', gap: 10 },
  praise: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.vermillion,
    marginTop: 10,
    letterSpacing: 2,
  },
  charText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 8,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    backgroundColor: Colors.jade,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  shareBtnText: { color: '#FFFDF7', fontSize: 13, fontWeight: '600' },
});
