import { ENVELOPE, SEGMENTS } from '../data/timeline';

export const FPS = 24;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_FRAMES = ENVELOPE.length; // equals narration length

// Scene start times (seconds). Each cut sits inside the silence gap between the last word of the outgoing scene and
// the first word of the incoming one, and — because the incoming scene cross-dissolves in over the PRE frames
// (see Film.tsx, PRE = 10 → 0.42s) BEFORE its start — never earlier than `prevSeg.t1 + PRE/FPS`, so a dissolve never
// overlaps active speech of the outgoing scene. (The boundaries S03→S04, S04→S05, S22→S23, S23→S24 and S24→S25 have gaps < 0.8s,
// so their cuts are pinned just before the next line starts.)
export const SCENE_STARTS: number[] = [
  0, 7.33, 41.11, 68.75, 82.96, 104, 138.06, 155.53, 176.92, 187.82, 217.15, 241.96, 260.73, 274.54, 303.63, 326.88, 339.89, 362.7, 382.98, 398.83, 429.29, 448.75, 475.28, 493.11, 523.91, 534.38, 558.13, 570.08, 578.72,
];
export const SCENE_COUNT = SCENE_STARTS.length;
export const TOTAL_SEC = DURATION_FRAMES / FPS;
export const sceneStart = (i: number) => SCENE_STARTS[i];
export const sceneEnd = (i: number) =>
  i + 1 < SCENE_STARTS.length ? SCENE_STARTS[i + 1] : TOTAL_SEC;
export const sceneDur = (i: number) => sceneEnd(i) - sceneStart(i);

/** global time (sec) where k-th segment of script `line` starts (throws on an invalid line / index) */
export function segStart(line: number, k = 0) {
  const s = SEGMENTS.filter((x) => x.line === line);
  if (s.length === 0) throw new Error(`segStart: script line ${line} does not exist in SEGMENTS`);
  if (k < 0 || k >= s.length) throw new Error(`segStart: line ${line} has ${s.length} segment(s), index ${k} is out of range`);
  return s[k].t0;
}
/** global time (sec) where k-th segment of script `line` ends (k = -1 → last segment) */
export function segEnd(line: number, k = -1) {
  const s = SEGMENTS.filter((x) => x.line === line);
  if (s.length === 0) throw new Error(`segEnd: script line ${line} does not exist in SEGMENTS`);
  if (k >= s.length) throw new Error(`segEnd: line ${line} has ${s.length} segment(s), index ${k} is out of range`);
  return (k < 0 ? s[s.length - 1] : s[k]).t1;
}

/** true when speaker `sp` has an active dialogue segment (for subtle talking body motion) */
export function isTalking(sp: string, g: number) {
  return SEGMENTS.some((s) => s.sp === sp && g >= s.t0 - 0.1 && g <= s.t1 + 0.1);
}
