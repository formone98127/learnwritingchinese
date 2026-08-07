import type { CharStrokeData, Point, StrokeInfo } from './types';

// Hanzi data lives in a 1024x1024 box, y-up, baseline shifted by 900.
export const BOX = 1024;
export const BASELINE = 900;

export function polylineLength(pts: number[][]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return len;
}

/** Evenly resample a polyline to n points by arc length. */
export function resample(pts: number[][], n: number): number[][] {
  const total = polylineLength(pts);
  if (total === 0 || pts.length < 2) return pts;
  const step = total / (n - 1);
  const out: number[][] = [pts[0]];
  let acc = 0;
  let i = 1;
  while (out.length < n - 1 && i < pts.length) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (seg === 0) {
      i++;
      continue;
    }
    if (acc + seg >= step * out.length) {
      const t = (step * out.length - acc) / seg;
      out.push([
        pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]),
        pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]),
      ]);
    } else {
      acc += seg;
      i++;
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Data coords -> screen coords for a square view of `size` px. */
export function toScreen(median: number[][], size: number): Point[] {
  const s = size / BOX;
  return median.map(([x, y]) => ({ x: x * s, y: (BASELINE - y) * s }));
}

export function pointsToPath(pts: Point[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

type Seg = { theta: number; len: number };

const deg = (r: number) => (r * 180) / Math.PI;
const angleDiff = (a: number, b: number) => {
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Direction name of a straight run, in writing coords (x right, y down). */
function dirName(theta: number): string {
  if (theta >= -22 && theta < 22) return '橫';
  if (theta >= -70 && theta < -18) return '提';
  if (theta >= 67 && theta < 113) return '豎';
  if (theta >= 113 || theta < -135) return '撇';
  if (theta >= 18 && theta < 67) return '捺';
  return '橫';
}

/** Name of a standalone short stroke (dot vs short pie vs short heng/shu). */
function shortName(theta: number, len: number): string {
  if (theta >= -22 && theta < 22) return '橫';
  if (theta >= 82 && theta < 98 && len >= 140) return '豎';
  if (theta >= 22 && theta < 130) return '點';
  if (theta >= 130 || theta < -135) return '撇';
  return dirName(theta);
}

function hookName(prevTheta: number): string {
  if (prevTheta >= 67 && prevTheta < 113) return '豎鉤';
  if (prevTheta >= -22 && prevTheta < 10) return '橫鉤';
  if (prevTheta >= 10 && prevTheta < 45) return '臥鉤';
  if (prevTheta >= 45 && prevTheta < 67) return '斜鉤';
  return '彎鉤';
}

/**
 * Heuristic stroke-name classifier (點橫豎撇捺提折鉤) from median geometry.
 * Split the median at sharp turns; a short final run turning >60° is a hook.
 */
export function classifyStroke(median: number[][]): string {
  const pts = resample(
    median.map(([x, y]) => [x, -y]), // writing coords: y down
    17,
  );
  const total = polylineLength(pts);

  const segs: Seg[] = [];
  let runLen = 0;
  let runDx = 0;
  let runDy = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    const stepTheta = deg(Math.atan2(dy, dx));
    if (runLen > 0) {
      const runTheta = deg(Math.atan2(runDy, runDx));
      if (angleDiff(stepTheta, runTheta) > 55) {
        segs.push({ theta: runTheta, len: runLen });
        runLen = 0;
        runDx = 0;
        runDy = 0;
      }
    }
    runLen += Math.hypot(dx, dy);
    runDx += dx;
    runDy += dy;
  }
  segs.push({ theta: deg(Math.atan2(runDy, runDx)), len: runLen });

  // Absorb tiny middle segments into neighbours, but keep a short tail (hook candidate).
  const merged: Seg[] = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const isTail = i === segs.length - 1;
    if (s.len < 0.15 * total && !isTail && merged.length > 0) {
      merged[merged.length - 1].len += s.len;
    } else {
      merged.push({ ...s });
    }
  }

  const names = merged.map((s) => dirName(s.theta));

  if (merged.length === 1) {
    const s = merged[0];
    if (total < 320) return shortName(s.theta, total);
    // a 豎-looking stroke whose tail sweeps left is really a curved 撇
    const quarter = Math.max(1, Math.floor(pts.length / 4));
    const early = deg(Math.atan2(pts[quarter][1] - pts[0][1], pts[quarter][0] - pts[0][0]));
    const late = deg(
      Math.atan2(
        pts[pts.length - 1][1] - pts[pts.length - 1 - quarter][1],
        pts[pts.length - 1][0] - pts[pts.length - 1 - quarter][0],
      ),
    );
    if (names[0] === '豎' && angleDiff(early, late) > 35 && late >= 113) return '撇';
    return names[0];
  }

  const last = merged[merged.length - 1];
  const prev = merged[merged.length - 2];
  const isHook = last.len < 0.3 * total && angleDiff(last.theta, prev.theta) > 60;

  if (isHook) {
    if (merged.length >= 3) {
      if (names[0] === '豎' && names[1] === '橫') return '豎彎鉤';
      if (names[0] === '橫' || names[0] === '提') return '橫折鉤';
    }
    return hookName(prev.theta);
  }

  if (merged.length === 2) {
    const [a, b] = names;
    if (a === '豎' && b === '撇') return '撇'; // curved pie splits into two runs
    if (a === '捺' && b === '撇') return '撇';
    if (b === '豎' || b === '橫') return `${a}折`;
    if (b === '提') return `${a}提`;
    return `${a}${b}`;
  }
  return `${names[0]}折折`;
}

export function buildStrokes(data: CharStrokeData, nameOverride?: string[]): StrokeInfo[] {
  const useOverride = nameOverride && nameOverride.length === data.strokes.length;
  return data.strokes.map((outline, index) => {
    const median = data.medians[index] ?? [];
    return {
      index,
      outline,
      median: median.map(([x, y]) => ({ x, y: BASELINE - y })),
      length: polylineLength(median),
      name: useOverride ? nameOverride[index] : classifyStroke(median),
    };
  });
}

export const SAMPLE_COUNT = 24;

/** Resampled screen-space samples of a stroke median for trace validation. */
export function traceSamples(median: Point[], size: number): Point[] {
  const s = size / BOX;
  const raw = median.map((p) => [p.x, p.y]);
  return resample(raw, SAMPLE_COUNT).map(([x, y]) => ({ x: x * s, y: y * s }));
}
