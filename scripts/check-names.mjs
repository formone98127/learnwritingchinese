// One-off sanity check of the stroke-name classifier against all bundled chars.
// Mirrors lib/strokeGeometry.ts classifyStroke (keep in sync manually).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

function polylineLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return len;
}
function resample(pts, n) {
  const total = polylineLength(pts);
  if (total === 0 || pts.length < 2) return pts;
  const step = total / (n - 1);
  const out = [pts[0]];
  let acc = 0;
  let i = 1;
  while (out.length < n - 1 && i < pts.length) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= step * out.length) {
      const t = (step * out.length - acc) / seg;
      out.push([pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])]);
    } else {
      acc += seg;
      i++;
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const deg = (r) => (r * 180) / Math.PI;
const angleDiff = (a, b) => {
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
function dirName(theta) {
  if (theta >= -22 && theta < 22) return '橫';
  if (theta >= -70 && theta < -18) return '提';
  if (theta >= 67 && theta < 113) return '豎';
  if (theta >= 113 || theta < -135) return '撇';
  if (theta >= 18 && theta < 67) return '捺';
  return '橫';
}
function shortName(theta, len) {
  if (theta >= -22 && theta < 22) return '橫';
  if (theta >= 82 && theta < 98 && len >= 140) return '豎';
  if (theta >= 22 && theta < 130) return '點';
  if (theta >= 130 || theta < -135) return '撇';
  return dirName(theta);
}
function hookName(prevTheta) {
  if (prevTheta >= 67 && prevTheta < 113) return '豎鉤';
  if (prevTheta >= -22 && prevTheta < 10) return '橫鉤';
  if (prevTheta >= 10 && prevTheta < 45) return '臥鉤';
  if (prevTheta >= 45 && prevTheta < 67) return '斜鉤';
  return '彎鉤';
}
function classifyStroke(median) {
  const pts = resample(median.map(([x, y]) => [x, -y]), 17);
  const total = polylineLength(pts);
  const segs = [];
  let runLen = 0, runDx = 0, runDy = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    const stepTheta = deg(Math.atan2(dy, dx));
    if (runLen > 0) {
      const runTheta = deg(Math.atan2(runDy, runDx));
      if (angleDiff(stepTheta, runTheta) > 55) {
        segs.push({ theta: runTheta, len: runLen });
        runLen = 0; runDx = 0; runDy = 0;
      }
    }
    runLen += Math.hypot(dx, dy);
    runDx += dx;
    runDy += dy;
  }
  segs.push({ theta: deg(Math.atan2(runDy, runDx)), len: runLen });
  const merged = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const isTail = i === segs.length - 1;
    if (s.len < 0.15 * total && !isTail && merged.length > 0) merged[merged.length - 1].len += s.len;
    else merged.push({ ...s });
  }
  const names = merged.map((s) => dirName(s.theta));
  if (merged.length === 1) {
    const s = merged[0];
    if (total < 320) return shortName(s.theta, total);
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
    if (a === '豎' && b === '撇') return '撇';
    if (a === '捺' && b === '撇') return '撇';
    if (b === '豎' || b === '橫') return `${a}折`;
    if (b === '提') return `${a}提`;
    return `${a}${b}`;
  }
  return `${names[0]}折折`;
}

const dir = path.resolve('assets/strokes');
for (const f of (await readdir(dir)).sort()) {
  const ch = String.fromCodePoint(parseInt(f.replace('.json', ''), 16));
  const data = JSON.parse(await readFile(path.join(dir, f), 'utf8'));
  console.log(`${ch}  ${data.medians.map((m) => classifyStroke(m)).join(' ')}`);
}
