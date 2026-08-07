import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoPlayer } from '@/components/DemoPlayer';
import { StrokeFormula } from '@/components/StrokeFormula';
import { TracePad } from '@/components/TracePad';
import { Colors } from '@/constants/colors';
import { clampLayoutSize, MIN_DEMO_SIZE, MIN_TRACE_SIZE } from '@/constants/layout';
import { STROKE_DATA } from '@/data/characters';
import { JYUTPING } from '@/data/jyutping';
import { STROKE_NAME_OVERRIDES } from '@/data/strokeNames';
import { STROKE_RULES } from '@/data/strokeRules';
import { CHAR_RADICAL, RADICAL_NAME } from '@/data/radicals';
import { playSound } from '@/lib/sounds';
import { speakChar, stopSpeech } from '@/lib/speech';
import { buildStrokes } from '@/lib/strokeGeometry';

export default function CharScreen() {
  const params = useLocalSearchParams<{ char: string }>();
  const char = Array.isArray(params.char) ? params.char[0] : params.char;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const strokes = useMemo(
    () =>
      char && STROKE_DATA[char]
        ? buildStrokes(STROKE_DATA[char], STROKE_NAME_OVERRIDES[char])
        : [],
    [char],
  );

  const [replayToken, setReplayToken] = useState(0);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const landscape = width > height;
  // budget height so the whole page fits without scrolling
  const chromeV = insets.top + insets.bottom + 12 + 44; // padding + header
  let demoSize: number;
  let traceSize: number;
  if (landscape) {
    demoSize = clampLayoutSize(Math.min(height - chromeV - 150, width * 0.3), MIN_DEMO_SIZE);
    traceSize = clampLayoutSize(Math.min(height - chromeV - 50, width * 0.4), MIN_TRACE_SIZE);
  } else {
    const avail = height - chromeV - 210;
    demoSize = clampLayoutSize(Math.min(width * 0.42, avail * 0.38), MIN_DEMO_SIZE);
    traceSize = clampLayoutSize(Math.min(width * 0.86, avail * 0.62), MIN_TRACE_SIZE);
  }

  if (!char || strokes.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>字典未收錄「{char}」</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStrokeDone = () => {
    const next = practiceIdx + 1;
    if (next < strokes.length) {
      setPracticeIdx(next);
      return;
    }
    playSound('char-done');
    speakChar(char);
    timerRef.current = setTimeout(() => setPracticeIdx(0), 900);
  };

  const replay = () => {
    stopSpeech();
    setReplayToken((t) => t + 1);
  };

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>查字典</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.body}>
        <View style={[styles.bodyRow, landscape && styles.bodyRowLandscape]}>
          <View style={styles.leftCol}>
            <View style={styles.readingRow}>
              <Text style={styles.readingChar}>{char}</Text>
              {JYUTPING[char] && <Text style={styles.readingJp}>{JYUTPING[char]}</Text>}
              <TouchableOpacity onPress={() => speakChar(char)} hitSlop={10}>
                <Ionicons name="volume-high" size={24} color={Colors.vermillion} />
              </TouchableOpacity>
            </View>
            <Text style={styles.strokeCount}>
              共 {strokes.length} 筆
              {CHAR_RADICAL[char] && RADICAL_NAME[CHAR_RADICAL[char]]
                ? `　部首：${RADICAL_NAME[CHAR_RADICAL[char]]}`
                : ''}
            </Text>

            <View style={[styles.demoBox, { width: demoSize, height: demoSize }]}>
              <DemoPlayer
                strokes={strokes}
                size={demoSize}
                replayToken={replayToken}
                mode="full"
                onFinished={replay}
              />
            </View>

            <StrokeFormula rules={STROKE_RULES[char] ?? []} />

            <TouchableOpacity style={styles.secondaryBtn} onPress={replay}>
              <Ionicons name="refresh" size={15} color={Colors.inkLight} />
              <Text style={styles.secondaryBtnText}>重播筆順</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.practiceBox}>
            <Text style={styles.practiceLabel}>試寫</Text>
            <TracePad
              strokes={strokes}
              size={traceSize}
              strokeIndex={practiceIdx}
              onStrokeDone={handleStrokeDone}
              charToken={`dict-${char}`}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16, color: Colors.inkLight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 19, fontWeight: '700', color: Colors.ink },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bodyRow: { flexDirection: 'column', alignItems: 'center', width: '100%' },
  bodyRowLandscape: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 32,
  },
  leftCol: { alignItems: 'center' },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readingChar: { fontSize: 34, fontWeight: '700', color: Colors.ink },
  readingJp: { fontSize: 20, color: Colors.gold, fontWeight: '600', letterSpacing: 1 },
  strokeCount: { fontSize: 13, color: Colors.inkLight, marginTop: 2, marginBottom: 4 },
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
  practiceBox: { marginTop: 6, alignItems: 'center' },
  practiceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 3,
    marginBottom: 6,
  },
  primaryBtn: {
    backgroundColor: Colors.vermillion,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  primaryBtnText: { color: '#FFFDF7', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.inkFaint,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8,
  },
  secondaryBtnText: { color: Colors.inkLight, fontSize: 15, fontWeight: '600' },
});
