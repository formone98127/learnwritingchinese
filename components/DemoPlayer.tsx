import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
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
import { speakStrokeName } from '@/lib/speech';
import { BOX, pointsToPath } from '@/lib/strokeGeometry';
import type { StrokeInfo } from '@/lib/types';

import { StrokeChar } from './StrokeChar';

const AnimatedPath = Animated.createAnimatedComponent(Path);

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
  // increments each time a loop cycle restarts
  const [cycle, setCycle] = useState(0);
  const offset = useSharedValue(1);
  const scale = size / BOX;

  const current = mode === 'loop' ? strokes[loopIndex] : strokes[idx];
  const strokeWidth = Math.max(18, size * 0.085);

  const medianPath = useMemo(() => {
    if (!current) return '';
    return pointsToPath(current.median.map((p) => ({ x: p.x * scale, y: p.y * scale })));
  }, [current, scale]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  useEffect(() => {
    setIdx(0);
    setCycle(0);
  }, [replayToken, strokes, mode, loopIndex]);

  const activeIndex = mode === 'loop' ? loopIndex : idx;

  useEffect(() => {
    if (mode === 'full' && idx >= strokes.length) {
      onFinished?.();
      return;
    }
    const stroke = strokes[activeIndex];
    if (!stroke) return;
    const len = stroke.length * scale;
    const duration = Math.min(1400, Math.max(480, (stroke.length / BOX) * 1100));
    if (speak && (mode === 'full' || cycle === 0)) speakStrokeName(stroke.name);
    onStrokeStart?.(activeIndex);
    offset.value = len;
    offset.value = withDelay(
      mode === 'loop' && cycle > 0 ? 450 : 0,
      withTiming(0, { duration, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (!finished) return;
        if (mode === 'loop') {
          runOnJS(setCycle)(cycle + 1);
        } else {
          runOnJS(setIdx)(idx + 1);
        }
      }),
    );
    return () => cancelAnimation(offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, cycle, strokes, mode]);

  const filledCount = mode === 'loop' ? loopIndex : Math.min(idx, strokes.length);
  const highlight = current ? activeIndex : -1;

  return (
    <View style={{ width: size, height: size }}>
      <StrokeChar strokes={strokes} size={size} filledCount={filledCount} highlightIndex={highlight} />
      {current && (
        <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
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
