import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import {
  LEVELS,
  isLevelMastered,
  isLevelUnlocked,
  levelProgress,
  levelStars,
  type Level,
} from '@/data/curriculum';
import { useProgress } from '@/lib/progress';

function PoemCard({
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
            name={mastered ? 'medal' : done ? 'checkmark' : 'book'}
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
        <Text style={[styles.cardSubtitle, !unlocked && styles.textLocked]}>
          {level.subtitle}
        </Text>
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
      <Ionicons name="chevron-forward" size={20} color={Colors.inkFaint} />
    </TouchableOpacity>
  );
}

export default function PoemsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  const router = useRouter();
  const { completed, stars } = useProgress();

  const poems = LEVELS.filter((l) => l.kind === 'poem');
  const masteredCount = poems.filter((l) => isLevelMastered(l, stars)).length;

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>詩詞練習</Text>
        <Text style={styles.headerCount}>共 {poems.length} 首・勳章 {masteredCount}</Text>
      </View>

      <Text style={styles.hint}>完成基本筆畫關卡後，就可以寫成一首詩</Text>

      <ScrollView
        contentContainerStyle={[styles.list, wide && styles.listWide]}
        showsVerticalScrollIndicator={false}
      >
        {poems.map((level) => (
          <PoemCard
            key={level.id}
            level={level}
            index={LEVELS.indexOf(level)}
            completed={completed}
            stars={stars}
            wide={wide}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: Colors.ink },
  headerCount: { fontSize: 13, color: Colors.inkLight, fontWeight: '600' },
  hint: { fontSize: 13, color: Colors.inkLight, marginBottom: 14, marginLeft: 4 },
  list: { paddingHorizontal: 0 },
  listWide: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
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
});
