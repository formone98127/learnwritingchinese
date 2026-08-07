import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';
import { getDemoDurationMultiplier, speakStrokeName, subscribeDemoSpeed } from '@/lib/speech';
import { BOX, pointsToPath } from '@/lib/strokeGeometry';
import type { StrokeInfo } from '@/lib/types';

import { StrokeChar } from './StrokeChar';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function demoStrokeDuration(strokeLen: number, mode: 'full' | 'loop'): number {
  const mult = getDemoDurationMultiplier();
  const normalized = strokeLen / BOX;
  const baseMs = 700 + normalized * 2400;
  const minMs = (mode === 'full' ? 750 : 450) * mult;
  const maxMs = (mode === 'full' ? 4200 : 2200) * mult;
  return Math.round(Math.max(minMs, Math.min(maxMs, baseMs * mult)));
}

function demoStrokePause(mode: 'full' | 'loop', strokeIndex: number, loopCycle: number): number {
  const mult = getDemoDurationMultiplier();
  if (mode === 'loop') return loopCycle > 0 ? Math.round(450 * mult) : 0;
  return strokeIndex > 0 ? Math.round(320 * mult) : 0;
}

type Props = {
  strokes: StrokeInfo[];
  size: number;
  /** bump to restart a 'full' playthrough from stroke 1 */
  replayToken: number;
  /** full: play every stroke once; loop: replay strokes[loopIndex] forever */
  mode: 'full' | 'loop';
  /** target stroke when mode === 'loop' */
  loopIndex?: number;
  /** speak each stroke name as it plays */
  speak?: boolean;
  onStrokeStart?: (index: number) => void;
  onFinished?: () => void;
};

export function DemoPlayer({
  strokes,
  size,
  replayToken,
  mode,
  loopIndex = 0,
  speak = true,
  onStrokeStart,
  onFinished,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [playNonce, setPlayNonce] = useState(0);
  const [demoSpeedTick, setDemoSpeedTick] = useState(0);
  const offset = useSharedValue(1);
  const finishedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  const onStrokeStartRef = useRef(onStrokeStart);
  onFinishedRef.current = onFinished;
  onStrokeStartRef.current = onStrokeStart;

  const scale = size / BOX;
  const safeSize = Math.max(size, 1);

  const current = mode === 'loop' ? strokes[loopIndex] : strokes[idx];
  const strokeWidth = Math.max(18, safeSize * 0.085);

  const medianPath = useMemo(() => {
    if (!current) return '';
    return pointsToPath(current.median.map((p) => ({ x: p.x * scale, y: p.y * scale })));
  }, [current, scale]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  const bumpIdx = useCallback(() => setIdx((i) => i + 1), []);
  const bumpCycle = useCallback(() => setCycle((c) => c + 1), []);

  useEffect(() => subscribeDemoSpeed(() => setDemoSpeedTick((t) => t + 1)), []);

  useEffect(() => {
    setIdx(0);
    setCycle(0);
    finishedRef.current = false;
  }, [replayToken, strokes, mode, loopIndex]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') setPlayNonce((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  const activeIndex = mode === 'loop' ? loopIndex : idx;

  useEffect(() => {
    if (mode === 'full' && idx >= strokes.length) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinishedRef.current?.();
      }
      return;
    }
    const stroke = strokes[activeIndex];
    if (!stroke) return;

    const len = stroke.length * scale;
    const duration = demoStrokeDuration(stroke.length, mode);
    const pause = demoStrokePause(mode, activeIndex, cycle);
    if (speak && (mode === 'full' || cycle === 0)) speakStrokeName(stroke.name);
    onStrokeStartRef.current?.(activeIndex);

    cancelAnimation(offset);
    offset.value = len;
    offset.value = withDelay(
      pause,
      withTiming(0, { duration, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (!finished) return;
        if (mode === 'loop') {
          runOnJS(bumpCycle)();
        } else {
          runOnJS(bumpIdx)();
        }
      }),
    );
    return () => cancelAnimation(offset);
  }, [activeIndex, bumpCycle, bumpIdx, cycle, demoSpeedTick, idx, mode, playNonce, scale, size, speak, strokes]);

  const filledCount = mode === 'loop' ? loopIndex : Math.min(idx, strokes.length);
  const highlight = current ? activeIndex : -1;

  return (
    <View style={{ width: safeSize, height: safeSize }}>
      <StrokeChar strokes={strokes} size={safeSize} filledCount={filledCount} highlightIndex={highlight} />
      {current && (
        <Svg width={safeSize} height={safeSize} style={{ position: 'absolute', top: 0, left: 0 }}>
          <AnimatedPath
            d={medianPath}
            stroke={Colors.vermillion}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={[current.length * scale, current.length * scale]}
            animatedProps={animatedProps}
          />
        </Svg>
      )}
    </View>
  );
}
