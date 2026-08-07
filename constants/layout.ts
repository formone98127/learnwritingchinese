/** Minimum on-screen size for demo / trace pads (avoids zero-height collapse). */
export const MIN_DEMO_SIZE = 100;
export const MIN_TRACE_SIZE = 140;

export function clampLayoutSize(value: number, min: number): number {
  return Math.max(min, Math.round(value));
}
