import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';
import { speakError } from '@/lib/speech';
import { playSound } from '@/lib/sounds';
import { pointsToPath, traceSamples } from '@/lib/strokeGeometry';
import type { Point, StrokeInfo } from '@/lib/types';

import { MiGrid } from './MiGrid';
import { StrokeChar } from './StrokeChar';
import { WebPadSurface } from './WebPadSurface';

export type StrokeError =
  | 'wrong-start'
  | 'wrong-start-test'
  | 'sloppy'
  | 'not-standard'
  | 'wrong-direction'
  | 'incomplete';

type Props = {
  strokes: StrokeInfo[];
  size: number;
  strokeIndex: number;
  onStrokeDone: (score: number) => void;
  charToken: string;
  disabled?: boolean;
  hideGuides?: boolean;
  hintFlash?: number;
  errorHints?: Partial<Record<StrokeError, string>>;
};

const HINT_DEFAULT = '';
const HINT_TEST = '';
const DEFAULT_ERROR_HINT: Record<StrokeError, string> = {
  'wrong-start': '要由紅點嗰度起筆呀',
  'wrong-start-test': '起筆位置唔啱，再諗下先',
  sloppy: '寫歪咗，呢筆重新寫',
  'not-standard': '唔夠標準，再寫多次',
  'wrong-direction': '方向倒轉咗，跟返箭嘴寫',
  incomplete: '未寫完呢筆，繼續',
};

export function TracePad({
  strokes,
  size,
  strokeIndex,
  onStrokeDone,
  charToken,
  disabled = false,
  hideGuides = false,
  hintFlash = 0,
  errorHints,
}: Props) {
  const hints = { ...DEFAULT_ERROR_HINT, ...errorHints };
  const hintDefault = hideGuides ? HINT_TEST : HINT_DEFAULT;
  const [trace, setTrace] = useState<Point[]>([]);
  const [hint, setHint] = useState(hintDefault);
  const [flashGhost, setFlashGhost] = useState(false);

  const samples = useMemo(
    () => traceSamples(strokes[strokeIndex].median, size),
    [strokes, strokeIndex, size],
  );
  const degenerate = samples.length < 2;

  const samplesRef = useRef(samples);
  const radiusRef = useRef(size * 0.12);
  const onStrokeDoneRef = useRef(onStrokeDone);
  const disabledRef = useRef(disabled);
  const hideGuidesRef = useRef(hideGuides);
  const hintsRef = useRef(hints);
  const dotLikeRef = useRef(false);
  samplesRef.current = samples;
  radiusRef.current = size * 0.12;
  onStrokeDoneRef.current = onStrokeDone;
  disabledRef.current = disabled;
  hideGuidesRef.current = hideGuides;
  hintsRef.current = hints;
  {
    const span =
      samples.length > 1
        ? Math.hypot(
            samples[samples.length - 1].x - samples[0].x,
            samples[samples.length - 1].y - samples[0].y,
          )
        : 0;
    dotLikeRef.current = span < radiusRef.current * 3;
  }

  const coveredRef = useRef<Set<number>>(new Set());
  const furthestRef = useRef(-1);
  const startedRef = useRef(false);
  const doneRef = useRef(false);
  const traceRef = useRef<Point[]>([]);
  const distSumRef = useRef(0);
  const distCountRef = useRef(0);
  const wrongStartsRef = useRef(0);
  const restartsRef = useRef(0);
  const padDomId = `trace-pad-${charToken}-${strokeIndex}`;

  useEffect(() => {
    coveredRef.current = new Set();
    furthestRef.current = -1;
    startedRef.current = false;
    doneRef.current = false;
    traceRef.current = [];
    distSumRef.current = 0;
    distCountRef.current = 0;
    wrongStartsRef.current = 0;
    restartsRef.current = 0;
    setTrace([]);
    setHint(hintDefault);
    if (degenerate && !doneRef.current) {
      doneRef.current = true;
      onStrokeDoneRef.current(0.5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeIndex, charToken, hintDefault, degenerate]);

  useEffect(() => {
    if (hintFlash === 0) return;
    setFlashGhost(true);
    const t = setTimeout(() => setFlashGhost(false), 1500);
    return () => clearTimeout(t);
  }, [hintFlash]);

  function rawDistToStroke(p: Point): number {
    const s = samplesRef.current;
    let min = Infinity;
    for (let i = 0; i < s.length; i++) {
      const d = Math.hypot(s[i].x - p.x, s[i].y - p.y);
      if (d < min) min = d;
    }
    return min;
  }

  function collectPoint(p: Point) {
    const s = samplesRef.current;
    const r = dotLikeRef.current ? radiusRef.current * 1.6 : radiusRef.current;
    const gate = dotLikeRef.current ? s.length : furthestRef.current + 4;
    let maxNew = -1;
    let minD = Infinity;
    for (let i = 0; i < s.length; i++) {
      if (i > gate) break;
      const d = Math.hypot(s[i].x - p.x, s[i].y - p.y);
      if (d < r) {
        coveredRef.current.add(i);
        if (i > maxNew) maxNew = i;
        if (d < minD) minD = d;
      }
    }
    if (maxNew > furthestRef.current) {
      furthestRef.current = maxNew;
      distSumRef.current += minD;
      distCountRef.current += 1;
    }
  }

  function tryComplete() {
    const total = samplesRef.current.length;
    const covered = coveredRef.current.size;
    if (
      doneRef.current ||
      total < 2 ||
      covered < Math.ceil(total * 0.8) ||
      furthestRef.current < total - 3
    ) {
      return;
    }
    const avgDist = distCountRef.current > 0 ? distSumRef.current / distCountRef.current : 0;
    const accuracy = dotLikeRef.current
      ? 1
      : 1 - Math.min(1, avgDist / (radiusRef.current * 0.55));
    if (accuracy < 0.1) {
      wipeAttempt(hintsRef.current['not-standard'], 'not-standard');
      return;
    }
    doneRef.current = true;
    playSound('stroke-done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const score = Math.max(
      0.05,
      Math.min(1, accuracy - wrongStartsRef.current * 0.08 - restartsRef.current * 0.1),
    );
    onStrokeDoneRef.current(score);
  }

  function wipeAttempt(hintText: string, errorKey?: StrokeError) {
    startedRef.current = false;
    restartsRef.current += 1;
    coveredRef.current = new Set();
    furthestRef.current = -1;
    traceRef.current = [];
    setTrace([]);
    setHint(hintText);
    playSound('wrong');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (errorKey) speakError(errorKey);
  }

  const onGrantPoint = useCallback((p: Point) => {
    if (doneRef.current || disabledRef.current) return;
    const s = samplesRef.current;
    if (s.length < 2) return;
    const r = radiusRef.current;
    const d0 = Math.hypot(s[0].x - p.x, s[0].y - p.y);
    const dEnd = Math.hypot(s[s.length - 1].x - p.x, s[s.length - 1].y - p.y);
    if (d0 < r * 2.2 && (dotLikeRef.current || dEnd > r * 1.5)) {
      startedRef.current = true;
      traceRef.current = [p];
      setTrace([p]);
      collectPoint(p);
      tryComplete();
    } else {
      startedRef.current = false;
      wrongStartsRef.current += 1;
      const hintKey: StrokeError =
        !dotLikeRef.current && dEnd < r * 1.5
          ? 'wrong-direction'
          : hideGuidesRef.current
            ? 'wrong-start-test'
            : 'wrong-start';
      setHint(hintsRef.current[hintKey]);
      playSound('wrong');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      speakError(hintKey);
    }
  }, []);

  const onMovePoint = useCallback((p: Point) => {
    if (doneRef.current || !startedRef.current) return;
    if (rawDistToStroke(p) > radiusRef.current * 2.0) {
      wipeAttempt(hintsRef.current.sloppy, 'sloppy');
      return;
    }
    traceRef.current = [...traceRef.current, p];
    setTrace(traceRef.current);
    collectPoint(p);
    tryComplete();
  }, []);

  const onReleasePoint = useCallback(() => {
    if (doneRef.current) return;
    if (startedRef.current) tryComplete();
    if (doneRef.current) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current && furthestRef.current < samplesRef.current.length - 3) {
      restartsRef.current += 1;
      coveredRef.current = new Set();
      furthestRef.current = -1;
      traceRef.current = [];
      setTrace([]);
      setHint(hintsRef.current.incomplete);
      speakError('incomplete');
    }
    startedRef.current = false;
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onBegin((e) => {
          runOnJS(onGrantPoint)({ x: e.x, y: e.y });
        })
        .onUpdate((e) => {
          runOnJS(onMovePoint)({ x: e.x, y: e.y });
        })
        .onFinalize(() => {
          runOnJS(onReleasePoint)();
        }),
    [onGrantPoint, onMovePoint, onReleasePoint],
  );

  const guidePath = useMemo(() => pointsToPath(samples), [samples]);
  const tracePath = trace.length > 1 ? pointsToPath(trace) : '';
  const showGhost = !hideGuides || flashGhost;

  const padView = (
    <View
      collapsable={false}
      style={[{ width: size, height: size, position: 'relative' }, Platform.OS === 'web' && webPad]}
    >
      <MiGrid size={size} />
      <StrokeChar
        strokes={strokes}
        size={size}
        filledCount={strokeIndex}
        highlightIndex={hideGuides ? -1 : strokeIndex}
      />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        {showGhost && samples.length > 0 && (
          <>
            <Path
              d={guidePath}
              stroke={Colors.gold}
              strokeWidth={3}
              strokeDasharray="2 14"
              strokeLinecap="round"
              fill="none"
            />
            <Circle
              cx={samples[0].x}
              cy={samples[0].y}
              r={size * 0.035}
              fill={Colors.vermillion}
            />
          </>
        )}
        {tracePath !== '' && (
          <Path
            d={tracePath}
            stroke={Colors.ink}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.9}
          />
        )}
      </Svg>
      {Platform.OS === 'web' && (
        <WebPadSurface
          id={padDomId}
          size={size}
          onGrant={onGrantPoint}
          onMove={onMovePoint}
          onRelease={onReleasePoint}
        />
      )}
    </View>
  );

  return (
    <View>
      {Platform.OS === 'web' ? padView : <GestureDetector gesture={panGesture}>{padView}</GestureDetector>}
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginTop: 6,
    minHeight: 18,
    textAlign: 'center',
    color: Colors.inkLight,
    fontSize: 14,
  },
});

const webPad = Platform.OS === 'web'
  ? ({
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    } as const)
  : null;
