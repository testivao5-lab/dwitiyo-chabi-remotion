// Deterministic animation helpers (no Math.random at render-time)
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeInOut = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = (x: number) => Math.pow(clamp(x), 2.2);
export const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export const bounceOut = (x: number) => {
  let t = clamp(x);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

/** piecewise keyframes [time, value] with easing between */
export function kf(
  t: number,
  pts: [number, number][],
  ease: (x: number) => number = easeInOut,
): number {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1];
      const [t1, v1] = pts[i];
      return lerp(v0, v1, ease((t - t0) / (t1 - t0 || 1)));
    }
  }
  return pts[pts.length - 1][1];
}

export type V2 = [number, number];
export function kf2(
  t: number,
  pts: [number, V2][],
  ease: (x: number) => number = easeInOut,
): V2 {
  return [
    kf(
      t,
      pts.map(([tt, v]) => [tt, v[0]]),
      ease,
    ),
    kf(
      t,
      pts.map(([tt, v]) => [tt, v[1]]),
      ease,
    ),
  ];
}

export const sway = (t: number, amp: number, period = 4, phase = 0) =>
  Math.sin(((t + phase) / period) * Math.PI * 2) * amp;

// seeded random
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

export const rad = (d: number) => (d * Math.PI) / 180;

/** two-bone inverse kinematics. bend = +1 / -1 chooses elbow side */
export function ik(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  l1: number,
  l2: number,
  bend: 1 | -1,
) {
  const dx = tx - sx;
  const dy = ty - sy;
  const d = Math.hypot(dx, dy) || 0.001;
  const dd = clamp(d, Math.abs(l1 - l2) + 2, l1 + l2 - 0.5);
  const a = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd);
  const A = Math.acos(clamp(cosA, -1, 1));
  const ang = a + bend * A;
  return {
    ex: sx + Math.cos(ang) * l1,
    ey: sy + Math.sin(ang) * l1,
    hx: sx + Math.cos(a) * dd,
    hy: sy + Math.sin(a) * dd,
  };
}
