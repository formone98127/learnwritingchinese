import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';
import { playSound } from '@/lib/sounds';
import { SAMPLE_COUNT, pointsToPath, traceSamples } from '@/lib/strokeGeometry';
import type { Point, StrokeInfo } from '@/lib/types';

import { MiGrid } from './MiGrid';
import { StrokeChar } from './StrokeChar';

type Props = {
  strokes: StrokeInfo[];
  size: number;
  /** which stroke the user must trace now */
  strokeIndex: number;
  /** called with an accuracy score 0..1 for the completed stroke */
  onStrokeDone: (score: number) => void;
  /** bump when the target char changes so internal state resets */
  charToken: string;
  /** ignore all touches (e.g. while the intro demo is still playing) */
  disabled?: boolean;
  /** test mode: hide start dot and dashed median guide */
  hideGuides?: boolean;
};

const HINT_DEFAULT = '';
const HINT_TEST = '';
const HINT_WRONG_START = '要由紅點嗰度起筆呀';
const HINT_WRONG_START_TEST = '起筆位置唔啱，再諗下先';
const HINT_SLOPPY = '寫歪咗，呢筆重新寫';
const HINT_NOT_STANDARD = '唔夠標準，再寫多次';

export function TracePad({
  strokes,
  size,
  strokeIndex,
  onStrokeDone,
  charToken,
  disabled = false,
  hideGuides = false,
}: Props) {
  const hintDefault = hideGuides ? HINT_TEST : HINT_DEFAULT;
  const hintWrongStart = hideGuides ? HINT_WRONG_START_TEST : HINT_WRONG_START;
  const [trace, setTrace] = useState<Point[]>([]);
  const [hint, setHint] = useState(hintDefault);

  const samples = useMemo(
    () => traceSamples(strokes[strokeIndex].median, size),
    [strokes, strokeIndex, size],
  );

  const samplesRef = useRef(samples);
  const radiusRef = useRef(size * 0.12);
  const onStrokeDoneRef = useRef(onStrokeDone);
  const disabledRef = useRef(disabled);
  const dotLikeRef = useRef(false);
  samplesRef.current = samples;
  radiusRef.current = size * 0.12;
  onStrokeDoneRef.current = onStrokeDone;
  disabledRef.current = disabled;
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
  }, [strokeIndex, charToken, hintDefault]);

  /** raw distance to the closest sample (uncapped) */
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
    // dot-like strokes: a tap must cover the whole span, so collect wider
    const r = dotLikeRef.current ? radiusRef.current * 1.6 : radiusRef.current;
    // dot-like strokes: every sample is one tap away, no forward gate
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
      // accuracy metric = how close the finger got to the center line
      distSumRef.current += minD;
      distCountRef.current += 1;
    }
  }

  function tryComplete() {
    const covered = coveredRef.current.size;
    if (
      doneRef.current ||
      covered < Math.ceil(SAMPLE_COUNT * 0.8) ||
      furthestRef.current < SAMPLE_COUNT - 3
    ) {
      return;
    }
    const avgDist = distCountRef.current > 0 ? distSumRef.current / distCountRef.current : 0;
    // dot-like strokes: a tap is a perfect dot — the span would poison the metric
    const accuracy = dotLikeRef.current
      ? 1
      : 1 - Math.min(1, avgDist / (radiusRef.current * 0.55));
    // coverage reached but the stroke is too sloppy overall → reject it
    if (accuracy < 0.1) {
      wipeAttempt(HINT_NOT_STANDARD);
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

  /** wipe a sloppy attempt immediately: no trail kept, stroke must restart */
  function wipeAttempt(hintText: string) {
    startedRef.current = false;
    restartsRef.current += 1;
    coveredRef.current = new Set();
    furthestRef.current = -1;
    traceRef.current = [];
    setTrace([]);
    setHint(hintText);
    playSound('wrong');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        if (doneRef.current || disabledRef.current) return;
        const s = samplesRef.current;
        const r = radiusRef.current;
        const p = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        const d0 = Math.hypot(s[0].x - p.x, s[0].y - p.y);
        const dEnd = Math.hypot(s[s.length - 1].x - p.x, s[s.length - 1].y - p.y);
        // dot-like strokes (點): start and end are nearly the same point,
        // so the anti-reverse dEnd check would always reject them
        if (d0 < r * 2.2 && (dotLikeRef.current || dEnd > r * 1.5)) {
          startedRef.current = true;
          traceRef.current = [p];
          setTrace([p]);
          collectPoint(p);
          tryComplete();
        } else {
          startedRef.current = false;
          wrongStartsRef.current += 1;
          setHint(hintWrongStart);
          playSound('wrong');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (e) => {
        if (doneRef.current || !startedRef.current) return;
        const p = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        // clearly off the stroke → wipe the trail right away, no trace kept
        if (rawDistToStroke(p) > radiusRef.current * 2.0) {
          wipeAttempt(HINT_SLOPPY);
          return;
        }
        traceRef.current = [...traceRef.current, p];
        setTrace(traceRef.current);
        collectPoint(p);
        tryComplete();
      },
      onPanResponderRelease: () => {
        if (doneRef.current) return;
        // a pure tap on a dot covers the samples without any move event
        if (startedRef.current) tryComplete();
        if (doneRef.current) {
          startedRef.current = false;
          return;
        }
        if (startedRef.current && furthestRef.current < SAMPLE_COUNT - 3) {
          restartsRef.current += 1;
          coveredRef.current = new Set();
          furthestRef.current = -1;
          traceRef.current = [];
          setTrace([]);
        }
        startedRef.current = false;
      },
    }),
  ).current;

  const guidePath = useMemo(() => pointsToPath(samples), [samples]);
  const tracePath = trace.length > 1 ? pointsToPath(trace) : '';

  return (
    <View>
      <View style={{ width: size, height: size }} {...pan.panHandlers}>
        <MiGrid size={size} />
        <StrokeChar
          strokes={strokes}
          size={size}
          filledCount={strokeIndex}
          highlightIndex={hideGuides ? -1 : strokeIndex}
        />
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          {!hideGuides && (
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
      </View>
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
