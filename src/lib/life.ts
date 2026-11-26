// "Life" layer — deterministic helpers that implement the 12 principles of animation
// (all pure functions of time, so Remotion can render any frame independently).
//
//  1 squash & stretch   → body scale on stress / breath          (Person)
//  2 anticipation       → look-ahead on vocal stress             (Film.Actor → Person)
//  3 staging            → slow camera push + light/shadow focus  (Film)
//  4 straight-ahead/pose→ held poses + weight-shift targets      (weightShift)
//  5 follow-through     → hair / hands / head lag behind body    (Person)
//  6 slow in / slow out → every transition is eased              (below)
//  7 arcs               → gestures are built from joint angles   (Person)
//  8 secondary action   → breathing, blinks, saccades, brows     (below)
//  9 timing             → asymmetric breath, irregular saccades  (below)
// 10 exaggeration       → stress pushes brows / nods / stretch   (Person)
// 11 solid drawing      → rim light, volume-preserving scale     (Person / Lighting)
// 12 appeal             → soft shading, warm highlights          (everywhere)
import { clamp, smooth } from './anim';

export const hash1 = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const ease = (x: number) => smooth(clamp(x));

/** Breathing cycle 0..1 : quicker inhale, small hold, long relaxed exhale (asymmetric = alive) */
export function breathWave(t: number, seed = 0): number {
  const period = 3.5 + hash1(seed) * 1.0;
  const ph = (((t + seed * 0.73) / period) % 1 + 1) % 1;
  if (ph < 0.36) return ease(ph / 0.36);
  if (ph < 0.46) return 1;
  return 1 - ease((ph - 0.46) / 0.54);
}

/** Held weight shift −1..1 : the figure rests on one leg, then (slow in / slow out) moves to the other */
export function weightShift(t: number, seed = 0): number {
  const L = 5.2;
  const off = hash1(seed + 3) * L;
  const x = (t + off) / L;
  const k = Math.floor(x);
  const f = x - k;
  const val = (j: number) => (hash1(j * 1.7 + seed) > 0.5 ? 1 : -1) * (0.45 + 0.55 * hash1(j * 3.1 + seed + 7));
  const a = val(k - 1);
  const b = val(k);
  return a + (b - a) * ease(f / 0.2);
}

/** Eye darts: quick eased jumps (~0.1s) at irregular intervals instead of constant jitter */
export function smoothSaccade(t: number, seed = 0): { x: number; y: number } {
  const step = 1.15;
  const start = (j: number) => j * step + hash1(j + seed * 0.37) * 0.55;
  let j = Math.floor(t / step);
  if (t < start(j)) j -= 1;
  const tx = (n: number) => (hash1(n * 2.3 + seed) - 0.5) * 2;
  const ty = (n: number) => (hash1(n * 5.9 + seed + 9) - 0.5) * 2;
  const e = ease((t - start(j)) / 0.1);
  return { x: tx(j - 1) + (tx(j) - tx(j - 1)) * e, y: ty(j - 1) + (ty(j) - ty(j - 1)) * e };
}

/** critically-damped-ish overshoot curve for hits (0 → 1 with a small overshoot) */
export function overshoot(x: number, k = 1.6): number {
  const t = clamp(x);
  return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
}
