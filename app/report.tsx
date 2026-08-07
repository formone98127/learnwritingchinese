import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { LEVELS, isLevelMastered } from '@/data/curriculum';
import { useProgress } from '@/lib/progress';
import { t } from '@/lib/i18n';

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completed, stars, charAccuracy, activity, profile } = useProgress();

  const stats = useMemo(() => {
    // dedupe by char — the same character appearing in multiple levels counts once
    const charBest = new Map<string, number>();
    for (const map of Object.values(stars)) {
      for (const [c, s] of Object.entries(map)) {
        charBest.set(c, Math.max(charBest.get(c) ?? 0, s));
      }
    }
    const totalChars = charBest.size;
    const threeStars = [...charBest.values()].filter((s) => s >= 3).length;
    const totalStars = [...charBest.values()].reduce((a, b) => a + b, 0);
    const masteredLevels = LEVELS.filter((l) => isLevelMastered(l, stars)).length;

    // streak: consecutive days up to today with activity
    // use LOCAL date (not UTC) so the boundary is midnight in the user's timezone
    const localDay = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const days = new Set(Object.keys(activity));
    let streak = 0;
    const d = new Date();
    // if today has no activity yet, streak counts up to yesterday
    if (!days.has(localDay(d))) d.setDate(d.getDate() - 1);
    while (days.has(localDay(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    // weakest chars
    const weakest = Object.entries(charAccuracy)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 8)
      .map(([c, acc]) => ({ char: c, acc }));

    // last 7 days activity (local dates to match recordActivity)
    const week: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dd = new Date();
      dd.setDate(dd.getDate() - i);
      const key = localDay(dd);
      week.push({ day: key.slice(5), count: activity[key] ?? 0 });
    }
    const maxWeek = Math.max(1, ...week.map((w) => w.count));

    return { totalChars, threeStars, totalStars, masteredLevels, streak, weakest, week, maxWeek };
  }, [completed, stars, charAccuracy, activity]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('reportTitle')}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>{t('reportGreeting', { name: profile.name })}</Text>

        <View style={styles.statRow}>
          <StatCard icon="create" label={t('statWritten')} value={String(stats.totalChars)} color={Colors.vermillion} />
          <StatCard icon="star" label={t('statThreeStar')} value={String(stats.threeStars)} color={Colors.gold} />
          <StatCard icon="medal" label={t('statMedals')} value={String(stats.masteredLevels)} color={Colors.jade} />
          <StatCard icon="flame" label={t('statStreak')} value={String(stats.streak)} color={Colors.vermillion} />
        </View>

        <Text style={styles.sectionTitle}>{t('last7Days')}</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            {stats.week.map((w) => (
              <View key={w.day} style={styles.chartCol}>
                <View style={styles.chartBarWrap}>
                  <View
                    style={[styles.chartBar, { height: `${(w.count / stats.maxWeek) * 100}%` }]}
                  />
                </View>
                <Text style={styles.chartLabel}>{w.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {stats.weakest.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('weakChars')}</Text>
            <View style={styles.weakCard}>
              {stats.weakest.map(({ char, acc }) => (
                <TouchableOpacity
                  key={char}
                  style={styles.weakChip}
                  onPress={() => router.push({ pathname: '/char/[char]', params: { char } })}
                >
                  <Text style={styles.weakChar}>{char}</Text>
                  <Text style={styles.weakAcc}>{Math.round(acc * 100)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as never} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: Colors.ink },
  greeting: { fontSize: 15, color: Colors.inkLight, marginBottom: 14 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.paperDark,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.ink },
  statLabel: { fontSize: 11, color: Colors.inkLight },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink, marginTop: 22, marginBottom: 12 },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.paperDark,
  },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  chartCol: { flex: 1, alignItems: 'center', gap: 6 },
  chartBarWrap: { flex: 1, justifyContent: 'flex-end', width: '60%' },
  chartBar: { width: '100%', backgroundColor: Colors.vermillion, borderRadius: 4, minHeight: 3 },
  chartLabel: { fontSize: 10, color: Colors.inkFaint },
  weakCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.paperDark,
  },
  weakChip: {
    alignItems: 'center',
    backgroundColor: Colors.paper,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.paperDark,
  },
  weakChar: { fontSize: 24, fontWeight: '700', color: Colors.ink },
  weakAcc: { fontSize: 10, color: Colors.vermillion, fontWeight: '600', marginTop: 2 },
});
