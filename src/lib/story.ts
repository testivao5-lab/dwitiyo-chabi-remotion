import { ENVELOPE, SEGMENTS } from '../data/timeline';

export const FPS = 24;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_FRAMES = ENVELOPE.length; // equals narration length

// scene start times (seconds) — derived from narration alignment (cut in the middle of the pause)
const RAW = [
  0, 7.73, 41.51, 68.91, 83.05, 104.4, 138.46, 155.93, 177.32, 188.22, 217.55,
  242.36, 261.13, 274.94, 304.03, 327.28, 340.29, 363.1, 383.38, 399.23, 429.69,
  449.15, 475.45, 493.3, 524.11, 534.78, 558.53, 570.48, 579.12,
];
export const SCENE_STARTS = RAW.map((t, i) => (i === 0 ? 0 : t - 0.4));
export const TOTAL_SEC = DURATION_FRAMES / FPS;
export const SCENE_COUNT = RAW.length;
export const sceneStart = (i: number) => SCENE_STARTS[i];
export const sceneEnd = (i: number) =>
  i + 1 < SCENE_STARTS.length ? SCENE_STARTS[i + 1] : TOTAL_SEC;
export const sceneDur = (i: number) => sceneEnd(i) - sceneStart(i);

/** global time (sec) where k-th segment of script `line` starts */
export function segStart(line: number, k = 0) {
  const s = SEGMENTS.filter((x) => x.line === line);
  return (s[Math.min(k, s.length - 1)] ?? SEGMENTS[0]).t0;
}
export function segEnd(line: number, k = -1) {
  const s = SEGMENTS.filter((x) => x.line === line);
  const e = k < 0 ? s[s.length - 1] : s[Math.min(k, s.length - 1)];
  return (e ?? SEGMENTS[0]).t1;
}

/** mouth openness 0..1 for speaker at global time (sec) */
export function mouth(sp: string, g: number) {
  const seg = SEGMENTS.find((s) => s.sp === sp && g >= s.t0 - 0.05 && g <= s.t1 + 0.05);
  if (!seg) return 0;
  const f = Math.floor(g * FPS);
  const e = (ENVELOPE[f] ?? 0) / 99;
  const e2 = (ENVELOPE[f + 1] ?? 0) / 99;
  const v = (e * 0.7 + e2 * 0.3) * 2.6;
  return Math.min(1, v < 0.12 ? 0 : v);
}

/** true when speaker `sp` has an active dialogue segment (for subtle talking body motion) */
export function isTalking(sp: string, g: number) {
  return SEGMENTS.some((s) => s.sp === sp && g >= s.t0 - 0.1 && g <= s.t1 + 0.1);
}
