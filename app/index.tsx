import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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

import { Onboarding } from '@/components/Onboarding';
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

// curriculum order first, then any extra chars in the dataset (computed once)
const CURRICULUM_CHARS = new Set(LEVELS.flatMap((l) => l.chars));
const ALL_CHARS = [
  ...CURRICULUM_CHARS,
  ...Object.keys(STROKE_DATA).filter((c) => !CURRICULUM_CHARS.has(c)),
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
  const { completed, stars, resetAll, profile, profiles, switchProfile, addProfile, charAccuracy, review } =
    useProgress();
  const wide = width >= 700;
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [profilePicker, setProfilePicker] = useState(false);
  const [addProfileOpen, setAddProfileOpen] = useState(false);
  const [newName, setNewName] = useState('');
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
  const overall = LEVELS.reduce((acc, l) => acc + levelProgress(l, completed), 0) / LEVELS.length;

  // matches the review page's due predicate: attempted chars that are weak or stale
  const reviewCount = useMemo(() => {
    const now = Date.now();
    return Object.entries(charAccuracy).filter(([char, acc]) => {
      if (acc === undefined) return false;
      const lastReview = (review as Record<string, number>)[char] ?? 0;
      const daysSince = lastReview ? (now - lastReview) / 86400000 : 999;
      return acc < 0.55 || daysSince >= 3;
    }).length;
  }, [charAccuracy, review]);

  const promptAddProfile = () => {
    setNewName('');
    setAddProfileOpen(true);
  };

  const confirmAddProfile = () => {
    const name = newName.trim();
    if (name) addProfile(name);
    setAddProfileOpen(false);
    setProfilePicker(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
    >
      <Onboarding />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setProfilePicker(true)}
            hitSlop={8}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{profile.avatar}</Text>
            </View>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.inkLight} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            hitSlop={8}
          >
            <Ionicons name="settings" size={22} color={Colors.ink} />
          </TouchableOpacity>
        </View>
        <Text style={styles.appTitle}>筆順學堂</Text>
        <Text style={styles.appSubtitle}>睇住寫，跟住寫，一筆一畫學繁體</Text>
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

      {/* quick actions: review + report */}
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={[styles.quickCard, { flex: 1 }]}
          activeOpacity={0.75}
          onPress={() => router.push('/review')}
        >
          <Ionicons name="refresh-circle" size={22} color={Colors.jade} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>今日複習</Text>
            <Text style={styles.quickSub}>
              {reviewCount > 0 ? `${reviewCount} 個字要溫` : '溫故知新'}
            </Text>
          </View>
          {reviewCount > 0 && (
            <View style={styles.reviewBadge}>
              <Text style={styles.badgeText}>{reviewCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickCard, { flex: 1 }]}
          activeOpacity={0.75}
          onPress={() => router.push('/report')}
        >
          <Ionicons name="stats-chart" size={22} color={Colors.vermillion} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>學習報告</Text>
            <Text style={styles.quickSub}>進度同弱項分析</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>基本筆畫</Text>
      {/* basics are stroke-type progressive; show with stage subtitles */}
      {(() => {
        const stageA = basics.slice(0, 6); // 橫豎撇捺點提
        const stageB = basics.slice(6, 14); // 折鉤複合
        const stageC = basics.slice(14); // 結構
        return (
          <>
            {[
              { title: '基本筆畫', levels: stageA },
              { title: '複合筆畫', levels: stageB },
              { title: '間架結構', levels: stageC },
            ].map(
              (group) =>
                group.levels.length > 0 && (
                  <View key={group.title} style={styles.stageGroup}>
                    <Text style={styles.stageTitle}>{group.title}</Text>
                    <View style={[styles.cardGrid, wide && styles.cardGridWide]}>
                      {group.levels.map((level) => (
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
                  </View>
                ),
            )}
          </>
        );
      })()}

      <Text style={styles.sectionTitle}>更多練習</Text>
      <View style={[styles.cardGrid, wide && styles.cardGridWide]}>
        <TouchableOpacity
          style={[styles.entryCard, wide && styles.entryCardWide]}
          activeOpacity={0.75}
          onPress={() => router.push('/poems')}
        >
          <View style={[styles.entryBadge, { backgroundColor: Colors.vermillion }]}>
            <Ionicons name="book" size={22} color="#FFFDF7" />
          </View>
          <View style={styles.entryBody}>
            <Text style={styles.entryTitle}>詩詞練習</Text>
            <Text style={styles.entrySubtitle}>
              共 {poems.length} 首古詩・勳章 {poems.filter((l) => isLevelMastered(l, stars)).length}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.inkFaint} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.entryCard, wide && styles.entryCardWide]}
          activeOpacity={0.75}
          onPress={() => router.push('/exam')}
        >
          <View style={[styles.entryBadge, { backgroundColor: Colors.ink }]}>
            <Ionicons name="school" size={22} color="#FFFDF7" />
          </View>
          <View style={styles.entryBody}>
            <Text style={styles.entryTitle}>考核模式</Text>
            <Text style={styles.entrySubtitle}>冇示範，自己寫・攞滿星得勳章</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.inkFaint} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={confirmReset} style={styles.resetBtn}>
        <Text style={styles.resetText}>重設學習進度</Text>
      </TouchableOpacity>

      {/* profile picker modal */}
      <Modal
        transparent
        visible={profilePicker}
        animationType="fade"
        onRequestClose={() => setProfilePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setProfilePicker(false)}
        >
          {/* swallow taps on the card so they don't reach the backdrop */}
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>切換學習者</Text>
            {profiles.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.pickerRow}
                onPress={() => {
                  switchProfile(p.id);
                  setProfilePicker(false);
                }}
              >
                <View style={styles.pickerAvatar}>
                  <Text style={styles.pickerAvatarText}>{p.avatar}</Text>
                </View>
                <Text style={styles.pickerName}>{p.name}</Text>
                {p.id === profile.id && (
                  <Ionicons name="checkmark" size={18} color={Colors.jade} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.pickerAdd} onPress={promptAddProfile}>
              <Ionicons name="add" size={18} color={Colors.vermillion} />
              <Text style={styles.pickerAddText}>新增學習者</Text>
            </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* add-profile modal (works on Android too, unlike Alert.prompt) */}
      <Modal
        transparent
        visible={addProfileOpen}
        animationType="fade"
        onRequestClose={() => setAddProfileOpen(false)}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>新增學習者</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="輸入名稱"
              placeholderTextColor={Colors.inkFaint}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              maxLength={12}
            />
            <View style={styles.nameBtnRow}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={() => setAddProfileOpen(false)}
              >
                <Text style={styles.secondaryBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                onPress={confirmAddProfile}
              >
                <Text style={styles.primaryBtnText}>確定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper, paddingHorizontal: 20 },
  header: { marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  settingsBtn: { marginTop: 2, padding: 4 },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.paperDark,
  },
  profileAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.vermillion,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: '#FFFDF7', fontSize: 14, fontWeight: '700' },
  profileName: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.paperDark,
  },
  quickTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  quickSub: { fontSize: 11, color: Colors.inkLight, marginTop: 1 },
  reviewBadge: {
    backgroundColor: Colors.vermillion,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#FFFDF7', fontSize: 11, fontWeight: '700' },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(38,34,28,0.45)',
    justifyContent: 'flex-start',
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  pickerCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
  },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink, marginBottom: 10 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.paperDark,
  },
  pickerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.vermillion,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerAvatarText: { color: '#FFFDF7', fontSize: 16, fontWeight: '700' },
  pickerName: { flex: 1, fontSize: 16, color: Colors.ink, fontWeight: '600' },
  pickerAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
    justifyContent: 'center',
  },
  pickerAddText: { fontSize: 15, color: Colors.vermillion, fontWeight: '600' },
  nameInput: {
    borderWidth: 1.5,
    borderColor: Colors.inkFaint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.ink,
    marginBottom: 14,
  },
  nameBtnRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    backgroundColor: Colors.vermillion,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 6,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFDF7', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Colors.inkFaint,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 9,
    alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.inkLight, fontSize: 15, fontWeight: '600' },
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
  stageGroup: { marginBottom: 4 },
  stageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 10,
    marginLeft: 2,
    letterSpacing: 1,
  },
  sectionHint: { marginTop: -6, marginBottom: 12, fontSize: 13, color: Colors.inkLight },
  entryCard: {
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
  entryCardWide: { width: '48%', marginBottom: 0 },
  entryBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryBody: { flex: 1 },
  entryTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink },
  entrySubtitle: { marginTop: 2, fontSize: 13, color: Colors.inkLight },
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
