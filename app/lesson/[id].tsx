import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoPlayer } from '@/components/DemoPlayer';
import { CharDoneCelebration } from '@/components/CharDoneCelebration';
import { StrokeChar } from '@/components/StrokeChar';
import { StrokeFormula } from '@/components/StrokeFormula';
import { TracePad, type StrokeError } from '@/components/TracePad';
import { Colors } from '@/constants/colors';
import { clampLayoutSize, MIN_DEMO_SIZE, MIN_TRACE_SIZE } from '@/constants/layout';
import { STROKE_DATA } from '@/data/characters';
import { LEVELS, levelStars, isLevelMastered } from '@/data/curriculum';
import { JYUTPING } from '@/data/jyutping';
import { STROKE_NAME_OVERRIDES } from '@/data/strokeNames';
import { STROKE_RULES } from '@/data/strokeRules';
import { useProgress } from '@/lib/progress';
import { playSound } from '@/lib/sounds';
import { speakChar, speakPraise, randomPraise, stopSpeech } from '@/lib/speech';
import { buildStrokes } from '@/lib/strokeGeometry';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

type Phase = 'intro' | 'follow' | 'test' | 'charDone' | 'levelDone';

const ERROR_HINT: Record<StrokeError, string> = {
  'wrong-start': '要由紅點嗰度起筆呀',
  'wrong-start-test': '起筆位置唔啱，再諗下先',
  sloppy: '寫歪咗，呢筆重新寫',
  'not-standard': '唔夠標準，再寫多次',
  'wrong-direction': '方向倒轉咗，跟返箭嘴寫',
  incomplete: '未寫完呢筆，繼續',
};

export default function LessonScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const {
    loaded,
    completed,
    stars: allStars,
    lessonState,
    markCharComplete,
    setLessonState,
    recordAccuracy,
    recordActivity,
    markReviewed,
  } = useProgress();

  const levelIndex = LEVELS.findIndex((l) => l.id === id);
  const level = LEVELS[levelIndex];

  const examMode = mode === 'exam';
  const [charIdx, setCharIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>(examMode ? 'test' : 'intro');
  const [testMode, setTestMode] = useState(examMode);
  const [demoStroke, setDemoStroke] = useState(0);
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [charStars, setCharStars] = useState(0);
  const [praise, setPraise] = useState('寫得好！');
  const [hintFlash, setHintFlash] = useState(0); // bump to flash next-stroke ghost
  const [hintUsed, setHintUsed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoresRef = useRef<number[]>([]);
  const resumedRef = useRef(false);
  const canPersistRef = useRef(false);
  const celebrationRef = useRef<View>(null);
  const stripRef = useRef<ScrollView>(null);

  const scrollStrip = (animated = true) => {
    // each chip is 38 wide + 8 gap + 16 paddingHorizontal on the container
    stripRef.current?.scrollTo({ x: Math.max(0, charIdx * 46 - 60), animated });
  };

  const shareAchievement = async () => {
    try {
      const uri = await captureRef(celebrationRef, { format: 'png', quality: 0.9 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
    } catch {
      // sharing unavailable — ignore
    }
  };

  const char = level?.chars[charIdx];
  const strokes = useMemo(
    () =>
      char && STROKE_DATA[char]
        ? buildStrokes(STROKE_DATA[char], STROKE_NAME_OVERRIDES[char])
        : [],
    [char],
  );

  const landscape = width > height;
  const chromeV = insets.top + insets.bottom + 12 + 44 + 46;
  let demoSize = 0;
  let traceSize: number;
  if (landscape && testMode) {
    traceSize = clampLayoutSize(Math.min(height - chromeV - 40, width * 0.6), MIN_TRACE_SIZE);
  } else if (landscape) {
    demoSize = clampLayoutSize(Math.min((height - chromeV - 60) * 0.58, width * 0.3), MIN_DEMO_SIZE);
    traceSize = clampLayoutSize(Math.min(height - chromeV - 40, width * 0.44), MIN_TRACE_SIZE);
  } else if (testMode) {
    traceSize = clampLayoutSize(Math.min(width * 0.92, height - chromeV - 140), MIN_TRACE_SIZE);
  } else {
    const avail = height - chromeV - 168;
    demoSize = clampLayoutSize(Math.min(width * 0.44, avail * 0.38), MIN_DEMO_SIZE);
    traceSize = clampLayoutSize(Math.min(width * 0.86, avail * 0.62), MIN_TRACE_SIZE);
  }

  useEffect(() => {
    return () => {
      stopSpeech();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // resume mid-lesson once, when data + level are ready
  useEffect(() => {
    if (!loaded || !level || resumedRef.current) return;
    resumedRef.current = true;
    const saved = lessonState[level.id];
    if (saved && saved.charIdx > 0 && saved.charIdx < level.chars.length) {
      setCharIdx(saved.charIdx);
      // never resume into a transient overlay phase (charDone/levelDone)
      // or mid-demo (intro) — always land on a playable phase
      const isTest = saved.phase === 'test' || examMode;
      setPhase(isTest ? 'test' : 'intro');
      setTestMode(isTest);
    }
    // allow the persist effect to write only AFTER resume has run
    canPersistRef.current = true;
  }, [loaded, level, lessonState, examMode]);

  // persist position whenever it changes (skip the completion overlay states)
  // IMPORTANT: skip until resume has had a chance to run, otherwise we
  // overwrite the saved lessonState with charIdx=0 before resume reads it
  useEffect(() => {
    if (!loaded || !level) return;
    if (!canPersistRef.current) return;
    if (phase === 'levelDone') {
      setLessonState(level.id, null);
      return;
    }
    setLessonState(level.id, { charIdx, phase: testMode ? 'test' : phase });
  }, [loaded, level, charIdx, phase, testMode, setLessonState]);

  // auto-scroll the char strip when the current char changes
  useEffect(() => {
    scrollStrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charIdx]);

  // auto-advance shortly after a char is completed
  const advanceRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (phase !== 'charDone') return;
    const t = setTimeout(() => advanceRef.current(), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  if (!level || !char || strokes.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>搵唔到呢一關</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const doneChars = completed[level.id] ?? [];

  const goToChar = (next: number) => {
    stopSpeech();
    if (timerRef.current) clearTimeout(timerRef.current);
    setCharIdx(next);
    setStrokeIdx(0);
    setDemoStroke(0);
    setCharStars(0);
    setHintUsed(false);
    scoresRef.current = [];
    setPhase(testMode ? 'test' : 'intro');
  };

  const toggleMode = () => {
    if (examMode) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const next = !testMode;
    setTestMode(next);
    stopSpeech();
    setStrokeIdx(0);
    setDemoStroke(0);
    setCharStars(0);
    setHintUsed(false);
    scoresRef.current = [];
    setPhase(next ? 'test' : 'intro');
  };

  const startFollow = () => {
    stopSpeech();
    setStrokeIdx(0);
    setPhase('follow');
  };

  const undoStroke = () => {
    if (strokeIdx === 0 || phase === 'charDone' || phase === 'levelDone') return;
    scoresRef.current = scoresRef.current.slice(0, -1);
    setStrokeIdx(strokeIdx - 1);
  };

  const useHint = () => {
    setHintUsed(true);
    setHintFlash((n) => n + 1);
  };

  const finishChar = () => {
    const scores = scoresRef.current;
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    let stars = avg >= 0.75 ? 3 : avg >= 0.5 ? 2 : 1;
    if (hintUsed) stars = Math.min(stars, 2); // hint caps the star
    setCharStars(stars);
    const p = randomPraise();
    setPraise(p);
    setPhase('charDone');
    playSound('char-done');
    speakPraise(p);
    markCharComplete(level.id, char, stars);
    recordAccuracy(char, avg);
    recordActivity(char);
    markReviewed(char);
  };

  const handleStrokeDone = (score: number) => {
    scoresRef.current = [...scoresRef.current, score];
    const next = strokeIdx + 1;
    if (next < strokes.length) {
      setStrokeIdx(next);
      return;
    }
    finishChar();
  };

  const advance = () => {
    if (charIdx + 1 < level.chars.length) {
      goToChar(charIdx + 1);
    } else {
      setPhase('levelDone');
      playSound('level-done');
      speakPraise();
    }
  };
  advanceRef.current = advance;

  const activeStroke =
    phase === 'intro'
      ? strokes[Math.min(demoStroke, strokes.length - 1)]
      : phase === 'follow'
        ? strokes[strokeIdx]
        : null;
  const activeStrokeNum =
    phase === 'intro' ? Math.min(demoStroke + 1, strokes.length) : strokeIdx + 1;

  const poemLine =
    level.kind === 'poem' && level.poem
      ? level.poem.lines.find((l) => l.includes(char))
      : undefined;

  const jyutping = JYUTPING[char];

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{level.title}</Text>
        <View style={styles.headerRight}>
          {!examMode && (
            <TouchableOpacity
              style={[styles.modeToggle, testMode && styles.modeToggleActive]}
              onPress={toggleMode}
              hitSlop={8}
            >
              <Ionicons
                name={testMode ? 'school' : 'create'}
                size={14}
                color={testMode ? '#FFFDF7' : Colors.inkLight}
              />
              <Text style={[styles.modeToggleText, testMode && styles.modeToggleTextActive]}>
                {testMode ? '測試' : '學習'}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerCount}>
            {Math.min(charIdx + 1, level.chars.length)} / {level.chars.length}
          </Text>
        </View>
      </View>

      <View style={styles.charStripWrap}>
        <ScrollView
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => scrollStrip(false)}
        >
          <View style={styles.charStrip}>
            {level.chars.map((c, i) => {
              const state = i === charIdx ? 'current' : doneChars.includes(c) ? 'done' : 'todo';
              return (
                <TouchableOpacity
                  key={`${c}-${i}`}
                  onPress={() => goToChar(i)}
                  style={[
                    styles.charChip,
                    state === 'current' && styles.charChipCurrent,
                    state === 'done' && styles.charChipDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.charChipText,
                      state === 'current' && styles.charChipTextCurrent,
                      state === 'done' && styles.charChipTextDone,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.body}>
        {poemLine && (
          <Text style={styles.poemLine}>
            {poemLine.split('').map((c, ci) => (
              <Text key={ci} style={c === char ? styles.poemCharActive : undefined}>
                {c}
              </Text>
            ))}
          </Text>
        )}

        <View style={[styles.bodyRow, landscape && styles.bodyRowLandscape]}>
          <View style={styles.leftCol}>
            {/* reading row: char + jyutping, tap to hear it */}
            <TouchableOpacity
              style={styles.readingRow}
              onPress={() => speakChar(char)}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <Text style={styles.readingChar}>{char}</Text>
              {jyutping && <Text style={styles.readingJp}>{jyutping}</Text>}
              <Ionicons name="volume-high" size={14} color={Colors.inkFaint} />
            </TouchableOpacity>

            <View style={styles.stageLabelRow}>
              {activeStroke && (
                <Text style={styles.strokeLabel}>
                  第 {activeStrokeNum} 筆{phase === 'test' ? '' : `・${activeStroke.name}`}（共{' '}
                  {strokes.length} 筆）
                </Text>
              )}
            </View>

            {!testMode && (
              <View style={[styles.demoBox, { width: demoSize, height: demoSize }]}>
                {phase === 'intro' && (
                  <DemoPlayer
                    strokes={strokes}
                    size={demoSize}
                    replayToken={charIdx}
                    mode="full"
                    onStrokeStart={setDemoStroke}
                    onFinished={() => {
                      if (timerRef.current) clearTimeout(timerRef.current);
                      timerRef.current = setTimeout(startFollow, 500);
                    }}
                  />
                )}
                {phase === 'follow' && (
                  <DemoPlayer
                    strokes={strokes}
                    size={demoSize}
                    replayToken={charIdx}
                    mode="loop"
                    loopIndex={strokeIdx}
                  />
                )}
                {(phase === 'charDone' || phase === 'levelDone') && (
                  <StrokeChar strokes={strokes} size={demoSize} filledCount={strokes.length} />
                )}
              </View>
            )}

            {!testMode && <StrokeFormula rules={STROKE_RULES[char] ?? []} />}

            {phase === 'charDone' ? (
              <>
                <View ref={celebrationRef} collapsable={false}>
                  <CharDoneCelebration
                    stars={charStars}
                    praise={praise}
                    char={char}
                    onShare={shareAchievement}
                  />
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={advance}>
                  <Text style={styles.primaryBtnText}>
                    {charIdx + 1 < level.chars.length ? '下一個字' : '完成關卡'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.btnRow}>
                {(phase === 'follow' || phase === 'test') && strokeIdx > 0 && (
                  <TouchableOpacity style={styles.iconBtn} onPress={undoStroke} hitSlop={8}>
                    <Ionicons name="arrow-undo" size={18} color={Colors.inkLight} />
                    <Text style={styles.iconBtnText}>上一筆</Text>
                  </TouchableOpacity>
                )}
                {(phase === 'follow' || phase === 'test') && (
                  <TouchableOpacity style={styles.iconBtn} onPress={useHint} hitSlop={8}>
                    <Ionicons name="bulb" size={18} color={Colors.gold} />
                    <Text style={styles.iconBtnText}>提示</Text>
                  </TouchableOpacity>
                )}
                {phase === 'test' && (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => goToChar(charIdx)}>
                    <Text style={styles.secondaryBtnText}>重寫此字</Text>
                  </TouchableOpacity>
                )}
                {phase === 'intro' && (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={startFollow}>
                    <Text style={styles.secondaryBtnText}>跳過示範</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {(phase === 'follow' || phase === 'intro' || phase === 'test') && (
            <View style={styles.practiceBox}>
              <View>
                <TracePad
                  strokes={strokes}
                  size={traceSize}
                  strokeIndex={strokeIdx}
                  onStrokeDone={handleStrokeDone}
                  charToken={`${level.id}-${charIdx}`}
                  disabled={phase !== 'follow' && phase !== 'test'}
                  hideGuides={phase === 'test'}
                  hintFlash={hintFlash}
                  errorHints={ERROR_HINT}
                />
                {phase === 'intro' && (
                  <View style={styles.veil} pointerEvents="none">
                    <Text style={styles.veilText}>睇住上面先，跟住就到你寫</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {phase === 'levelDone' && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Ionicons
              name={isLevelMastered(level, allStars) ? 'medal' : 'ribbon'}
              size={56}
              color={Colors.gold}
            />
            <Text style={styles.overlayTitle}>關卡完成！</Text>
            <Text style={styles.overlaySubtitle}>
              你已經寫晒「{level.title}」嘅 {level.chars.length} 個字
            </Text>
            <Text style={styles.overlayStars}>
              ★ {levelStars(level, allStars)} / {level.chars.length * 3}
            </Text>
            {isLevelMastered(level, allStars) && (
              <Text style={styles.overlayMedal}>滿星勳章攞到！</Text>
            )}
            {levelIndex + 1 < LEVELS.length && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  router.replace(
                    examMode
                      ? `/lesson/${LEVELS[levelIndex + 1].id}?mode=exam`
                      : `/lesson/${LEVELS[levelIndex + 1].id}`,
                  )
                }
              >
                <Text style={styles.primaryBtnText}>下一關：{LEVELS[levelIndex + 1].title}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.secondaryBtn, { marginTop: 12 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryBtnText}>返回首頁</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16, color: Colors.inkLight },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 19, fontWeight: '700', color: Colors.ink },
  headerCount: { fontSize: 15, color: Colors.inkLight, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.inkFaint,
  },
  modeToggleActive: { backgroundColor: Colors.vermillion, borderColor: Colors.vermillion },
  modeToggleText: { fontSize: 12, color: Colors.inkLight, fontWeight: '600' },
  modeToggleTextActive: { color: '#FFFDF7' },
  charStripWrap: { marginTop: 6 },
  charStrip: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  charChip: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.paperDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charChipCurrent: { backgroundColor: Colors.vermillion },
  charChipDone: { backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.jade },
  charChipText: { fontSize: 19, color: Colors.inkLight },
  charChipTextCurrent: { color: '#FFFDF7', fontWeight: '700' },
  charChipTextDone: { color: Colors.jade, fontWeight: '700' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  bodyRow: { flexDirection: 'column', alignItems: 'center', width: '100%' },
  bodyRowLandscape: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 28 },
  leftCol: { alignItems: 'center' },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    marginBottom: 2,
  },
  readingChar: { fontSize: 20, fontWeight: '700', color: Colors.ink },
  readingJp: { fontSize: 13, color: Colors.gold, fontWeight: '600' },
  poemLine: { fontSize: 16, color: Colors.inkLight, letterSpacing: 3, marginBottom: 2 },
  poemCharActive: { color: Colors.vermillion, fontWeight: '700' },
  stageLabelRow: { alignItems: 'center', marginBottom: 2, gap: 1 },
  strokeLabel: { fontSize: 14, color: Colors.inkLight },
  demoBox: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 2,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.inkFaint,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtnText: { fontSize: 13, color: Colors.inkLight, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: Colors.vermillion,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 2,
  },
  primaryBtnText: { color: '#FFFDF7', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Colors.inkFaint,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 9,
  },
  secondaryBtnText: { color: Colors.inkLight, fontSize: 15, fontWeight: '600' },
  practiceBox: { marginTop: 4, alignItems: 'center' },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(246,240,228,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  veilText: { color: Colors.inkLight, fontSize: 15, fontWeight: '600' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(38,34,28,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  overlayCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  overlayTitle: { fontSize: 26, fontWeight: '700', color: Colors.ink, marginTop: 12 },
  overlayStars: { fontSize: 17, color: Colors.gold, fontWeight: '700', marginTop: 6 },
  overlayMedal: { fontSize: 15, color: Colors.vermillion, fontWeight: '700', marginTop: 4 },
  overlaySubtitle: {
    fontSize: 14,
    color: Colors.inkLight,
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
});
