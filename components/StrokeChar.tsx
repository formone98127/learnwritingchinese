import Svg, { G, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';
import { BASELINE, BOX } from '@/lib/strokeGeometry';
import type { StrokeInfo } from '@/lib/types';

type Props = {
  strokes: StrokeInfo[];
  size: number;
  /** strokes with index < filledCount render in ink */
  filledCount: number;
  /** index of the stroke to highlight as the current target */
  highlightIndex?: number;
};

export function StrokeChar({ strokes, size, filledCount, highlightIndex = -1 }: Props) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} pointerEvents="none">
      <G transform={`translate(0, ${BASELINE}) scale(1, -1)`}>
        {strokes.map((s, i) => {
          const done = i < filledCount;
          const current = i === highlightIndex;
          return (
            <Path
              key={i}
              d={s.outline}
              fill={done ? Colors.ink : current ? Colors.traceGuide : Colors.inkFaint}
              opacity={done ? 1 : current ? 1 : 0.45}
            />
          );
        })}
      </G>
    </Svg>
  );
}
