import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { STROKE_DATA } from '@/data/characters';
import { JYUTPING } from '@/data/jyutping';
import { useProgress } from '@/lib/progress';
import { t } from '@/lib/i18n';

const WEAK_THRESHOLD = 0.55;

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  const router = useRouter();
  const { charAccuracy, review, stars } = useProgress();

  // weak chars = low accuracy, or mastered long ago (due for re-review)
  const weakChars = useMemo(() => {
    const now = Date.now();
    const entries = Object.entries(STROKE_DATA)
      .filter(([char]) => charAccuracy[char] !== undefined) // only chars the user has actually attempted
      .map(([char]) => {
        const acc = charAccuracy[char];
        const lastReview = review[char] ?? 0;
        const daysSince = lastReview ? (now - lastReview) / 86400000 : 999;
        // due if weak, or not reviewed in 3+ days
        const due = (acc !== undefined && acc < WEAK_THRESHOLD) || daysSince >= 3;
        return { char, acc: acc ?? 0, due, daysSince };
      });
    return entries
      .filter((e) => e.due)
      .sort((a, b) => a.acc - b.acc || b.daysSince - a.daysSince)
      .slice(0, 30);
  }, [charAccuracy, review]);

  const masteredCount = useMemo(
    () => Object.values(stars).reduce((n, map) => n + Object.values(map).filter((s) => s >= 3).length, 0),
    [stars],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('reviewTitle')}</Text>
        <Text style={styles.headerCount}>{t('reviewCount', { count: weakChars.length })}</Text>
      </View>

      <View style={styles.introBox}>
        <Ionicons name="refresh-circle" size={22} color={Colors.jade} />
        <Text style={styles.introText}>{t('reviewIntro')}</Text>
      </View>

      {weakChars.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="checkmark-circle" size={56} color={Colors.jade} />
          <Text style={styles.emptyTitle}>{t('reviewEmptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('reviewEmptyText', { count: masteredCount })}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.grid, wide && styles.gridWide]} showsVerticalScrollIndicator={false}>
          {weakChars.map(({ char, acc }) => (
            <TouchableOpacity
              key={char}
              style={[styles.chip, wide && styles.chipWide]}
              activeOpacity={0.75}
              onPress={() => router.push({ pathname: '/char/[char]', params: { char } })}
            >
              <Text style={styles.chipChar}>{char}</Text>
              <Text style={styles.chipJp}>{JYUTPING[char] ?? ''}</Text>
              <View style={styles.accTrack}>
                <View
                  style={[
                    styles.accFill,
                    { width: `${Math.round(acc * 100)}%` },
                    acc < WEAK_THRESHOLD ? styles.accWeak : styles.accOk,
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: Colors.ink },
  headerCount: { fontSize: 13, color: Colors.inkLight, fontWeight: '600' },
  introBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.paperDark,
  },
  introText: { flex: 1, fontSize: 13, color: Colors.inkLight, lineHeight: 19 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.ink },
  emptyText: { fontSize: 14, color: Colors.inkLight, textAlign: 'center', lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridWide: {},
  chip: {
    width: '22%',
    minWidth: 72,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.paperDark,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  chipWide: { width: '15%' },
  chipChar: { fontSize: 28, fontWeight: '700', color: Colors.ink },
  chipJp: { fontSize: 11, color: Colors.gold, fontWeight: '600', marginTop: 2 },
  accTrack: {
    marginTop: 8,
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.paperDark,
    overflow: 'hidden',
  },
  accFill: { height: 4, borderRadius: 2 },
  accWeak: { backgroundColor: Colors.vermillion },
  accOk: { backgroundColor: Colors.jade },
});
