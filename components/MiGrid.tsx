import Svg, { Line, Rect } from 'react-native-svg';

import { Colors } from '@/constants/colors';

/** 米字格 practice grid. */
export function MiGrid({ size }: { size: number }) {
  const h = size / 2;
  return (
    <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Rect x={1} y={1} width={size - 2} height={size - 2} stroke={Colors.grid} strokeWidth={2} fill="none" />
      <Line x1={h} y1={0} x2={h} y2={size} stroke={Colors.grid} strokeWidth={1.5} strokeDasharray="8 6" />
      <Line x1={0} y1={h} x2={size} y2={h} stroke={Colors.grid} strokeWidth={1.5} strokeDasharray="8 6" />
      <Line x1={0} y1={0} x2={size} y2={size} stroke={Colors.grid} strokeWidth={1.5} strokeDasharray="8 6" />
      <Line x1={size} y1={0} x2={0} y2={size} stroke={Colors.grid} strokeWidth={1.5} strokeDasharray="8 6" />
    </Svg>
  );
}
