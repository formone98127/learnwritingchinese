import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { STROKE_DATA } from '@/data/characters';
import {
  LEVELS,
  isLevelMastered,
  isLevelUnlocked,
  levelProgress,
  levelStars,
  type Level,
} from '@/data/curriculum';
import { JYUTPING } from '@/data/jyutping';
import { useProgress } from '@/lib/progress';

// curriculum order first, then any extra chars in the dataset
const ALL_CHARS = [
  ...new Set(LEVELS.flatMap((l) => l.chars)),
  ...Object.keys(STROKE_DATA).filter((c) => !new Set(LEVELS.flatMap((l) => l.chars)).has(c)),
];

function searchChars(query: string): string[] {
  const q = query.trim();
  if (!q) return [];
  const latin = q.toLowerCase().replace(/[^a-z0-9]/g, '');
  const latinNoTone = latin.replace(/[0-9]/g, '');
  return ALL_CHARS.filter((c) => {
    if (q.includes(c)) return true;
    if (!latin) return false;
    const jp = JYUTPING[c];
    if (!jp) return false;
    return jp.startsWith(latin) || jp.replace(/[0-9]/g, '').startsWith(latinNoTone);
  }).slice(0, 30);
}

function LevelCard({
  level,
  index,
  completed,
  stars,
  wide,
}: {
  level: Level;
  index: number;
  completed: Record<string, string[]>;
  stars: Record<string, Record<string, number>>;
  wide?: boolean;
}) {
  const router = useRouter();
  const unlocked = isLevelUnlocked(index, completed);
  const progress = levelProgress(level, completed);
  const done = progress === 1;
  const mastered = isLevelMastered(level, stars);
  const starCount = levelStars(level, stars);

  return (
    <TouchableOpacity
      style={[styles.card, wide && styles.cardWide, !unlocked && styles.cardLocked]}
      activeOpacity={unlocked ? 0.75 : 1}
      onPress={() => unlocked && router.push(`/lesson/${level.id}`)}
    >
      <View style={[styles.badge, done && styles.badgeDone, !unlocked && styles.badgeLocked]}>
        {unlocked ? (
          <Ionicons
            name={mastered ? 'medal' : done ? 'checkmark' : level.kind === 'poem' ? 'book' : 'brush'}
            size={22}
            color="#FFFDF7"
          />
        ) : (
          <Ionicons name="lock-closed" size={20} color={Colors.inkLight} />
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, !unlocked && styles.textLocked]}>{level.title}</Text>
          {mastered && <Ionicons name="medal" size={16} color={Colors.gold} />}
        </View>
        <Text style={[styles.cardSubtitle, !unlocked && styles.textLocked]}>{level.subtitle}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              done && styles.progressDone,
            ]}
          />
        </View>
        <Text style={[styles.cardCount, !unlocked && styles.textLocked]}>
          {Math.round(progress * level.chars.length)} / {level.chars.length} 字・★ {starCount} /{' '}
          {level.chars.length * 3}
        </Text>
      </View>
      <View style={styles.chips}>
        {level.focus.map((f) => (
          <View key={f} style={styles.chip}>
            <Text style={styles.chipText}>{f}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { completed, stars, resetAll } = useProgress();
  const wide = width >= 700;
  const router = useRouter();

  const [query, setQuery] = useState('');
  const results = useMemo(() => searchChars(query), [query]);

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('確定要清走晒所有學習進度？')) resetAll();
      return;
    }
    Alert.alert('重設進度', '確定要清走晒所有學習進度？', [
      { text: '取消', style: 'cancel' },
      { text: '重設', style: 'destructive', onPress: resetAll },
    ]);
  };

  const basics = LEVELS.filter((l) => l.kind === 'basic');
  const poems = LEVELS.filter((l) => l.kind === 'poem');
  const overall =
    LEVELS.reduce((acc, l) => acc + levelProgress(l, completed), 0) / LEVELS.length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>筆順學堂</Text>
            <Text style={styles.appSubtitle}>睇住寫，跟住寫，一筆一畫學繁體</Text>
          </View>
        </View>
        <View style={styles.overallTrack}>
          <View style={[styles.overallFill, { width: `${overall * 100}%` }]} />
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={Colors.inkLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="查字典：輸入中文字或粵拼"
          placeholderTextColor={Colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={Colors.inkFaint} />
          </TouchableOpacity>
        )}
      </View>
      {query.trim().length > 0 && (
        <View style={styles.searchResults}>
          {results.length === 0 ? (
            <Text style={styles.searchEmpty}>字典搵唔到「{query.trim()}」</Text>
          ) : (
            results.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.resultChip}
                onPress={() => router.push({ pathname: '/char/[char]', params: { char: c } })}
              >
                <Text style={styles.resultChar}>{c}</Text>
                <Text style={styles.resultJp}>{JYUTPING[c] ?? ''}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>基本筆畫</Text>
      <View style={[styles.cardGrid, wide && styles.cardGridWide]}>
        {basics.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            index={LEVELS.indexOf(level)}
            completed={completed}
            stars={stars}
            wide={wide}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>詩詞練習</Text>
      <Text style={styles.sectionHint}>完成基本筆畫後，就可以寫成首詩</Text>
      <View style={[styles.cardGrid, wide && styles.cardGridWide]}>
        {poems.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            index={LEVELS.indexOf(level)}
            completed={completed}
            stars={stars}
            wide={wide}
          />
        ))}
      </View>

      <TouchableOpacity onPress={confirmReset} style={styles.resetBtn}>
        <Text style={styles.resetText}>重設學習進度</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper, paddingHorizontal: 20 },
  header: { marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  appTitle: { fontSize: 34, fontWeight: '700', color: Colors.ink, letterSpacing: 2 },
  appSubtitle: { marginTop: 6, fontSize: 14, color: Colors.inkLight },
  overallTrack: {
    marginTop: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.paperDark,
    overflow: 'hidden',
  },
  overallFill: { height: 6, borderRadius: 3, backgroundColor: Colors.vermillion },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.ink, padding: 0 },
  searchResults: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  searchEmpty: { fontSize: 14, color: Colors.inkLight, paddingVertical: 6 },
  resultChip: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.paperDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 56,
  },
  resultChar: { fontSize: 22, fontWeight: '700', color: Colors.ink },
  resultJp: { fontSize: 11, color: Colors.gold, fontWeight: '600', marginTop: 2 },
  sectionTitle: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
  },
  sectionHint: { marginTop: -6, marginBottom: 12, fontSize: 13, color: Colors.inkLight },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLocked: { opacity: 0.65 },
  cardGrid: { flexDirection: 'column' },
  cardGridWide: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardWide: { width: '48%', marginBottom: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.vermillion,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDone: { backgroundColor: Colors.jade },
  badgeLocked: { backgroundColor: Colors.paperDark },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink },
  cardSubtitle: { marginTop: 2, fontSize: 13, color: Colors.inkLight },
  textLocked: { color: Colors.inkFaint },
  progressTrack: {
    marginTop: 10,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.paperDark,
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: Colors.vermillion },
  progressDone: { backgroundColor: Colors.jade },
  cardCount: { marginTop: 5, fontSize: 11, color: Colors.inkFaint },
  resetBtn: { marginTop: 28, alignItems: 'center', paddingVertical: 10 },
  resetText: { fontSize: 13, color: Colors.inkFaint, textDecorationLine: 'underline' },
  chips: { gap: 6 },
  chip: {
    backgroundColor: Colors.paperDark,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: { fontSize: 12, color: Colors.inkLight, fontWeight: '600' },
});
