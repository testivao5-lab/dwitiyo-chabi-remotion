import React from 'react';
import { ActorSpec, CHARS } from '../art/Person';
import { Pal } from '../art/palette';
import { clamp, easeInOut, V2 } from '../lib/anim';
import { segEnd, segStart, sceneStart } from '../lib/story';

export type Cam = [number, number, number];
export const WIDE: Cam = [960, 540, 1];
export const onX = (x: number, z = 2.3, cy = 470): Cam => [x, cy, z];

export interface Shot {
  d: number;
  a: Cam;
  b?: Cam;
}
/** sequential camera shots — hard cut between them, eased drift inside each.
 *  The last shot may use `d >= 90` as a "until the end" sentinel: with `totalDur` (the duration of the scene / branch
 *  the shots belong to) its effective duration becomes `max(0.2, totalDur - t0)`, so the final move actually plays. */
export function camSeq(t: number, shots: Shot[], totalDur?: number): Cam {
  let t0 = 0;
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    const last = i === shots.length - 1;
    const dur = last && s.d >= 90 && totalDur !== undefined ? Math.max(0.2, totalDur - t0) : s.d;
    if (t < t0 + dur || last) {
      const p = easeInOut(clamp((t - t0) / dur));
      const b = s.b ?? s.a;
      return [s.a[0] + (b[0] - s.a[0]) * p, s.a[1] + (b[1] - s.a[1]) * p, s.a[2] + (b[2] - s.a[2]) * p];
    }
    t0 += dur;
  }
  return WIDE;
}

/** Safety net for framing: if a visible actor's head would be cut by the top edge of the frame the camera is raised
 *  just enough to keep ~14px of headroom. It is continuous (weights fade in/out), and deliberate macro shots whose
 *  frame starts below the eyes (hands / paper inserts) are left untouched. `cam` must be the FINAL camera (incl. push-in). */
export function headroom(cam: Cam, actors: ActorSpec[]): Cam {
  const [cx, cy, z] = cam;
  const half = 960 / z;
  const topY = cy - 540 / z;
  let shift = 0;
  for (const a of actors) {
    const d = CHARS[a.id];
    const s = (a.scale ?? 1) * d.height;
    const headTop = (a.y ?? 930) + (a.sit ?? 0) - 686 * s;
    const eyesOut = headTop + 125 * s; // below this line the eyes are out of frame → deliberate macro insert
    const inView = clamp((half - 30 - Math.abs(a.x - cx)) / 120);
    const solid = clamp(((a.op ?? 1) - 0.2) / 0.5);
    const notMacro = clamp((eyesOut - topY) / 40);
    const need = Math.max(0, topY - (headTop - 14));
    shift = Math.max(shift, need * inView * solid * notMacro);
  }
  return [cx, cy - shift, z];
}

export interface SceneOut {
  bg: 'shop' | 'home' | 'room' | 'street';
  pal: Pal;
  cam: Cam;
  actors: ActorSpec[];
  /** drawn right after the background, behind every actor */
  bgFront?: React.ReactNode;
  props?: React.ReactNode;
  front?: React.ReactNode;
  overlay?: React.ReactNode;
  counter?: boolean;
  table?: boolean;
  bgProps?: Record<string, unknown>;
}

export interface Ctx {
  t: number; // seconds since scene start
  d: number; // scene duration
  g: number; // global seconds
  T: (line: number, k?: number) => number; // relative start of segment
  E: (line: number, k?: number) => number; // relative end of segment
  /** camera for the whole scene: like camSeq(t, shots) but the final `d: 99` shot lasts until the scene ends */
  cam: (shots: Shot[]) => Cam;
}

export const makeCtx = (scene: number, d: number, g: number): Ctx => {
  const s0 = sceneStart(scene);
  return {
    t: g - s0,
    d,
    g,
    T: (line, k = 0) => segStart(line, k) - s0,
    E: (line, k = -1) => segEnd(line, k) - s0,
    cam: (shots) => camSeq(g - s0, shots, d),
  };
};

/* -------- reusable staging -------- */
export const COUNTER_Y = 628;
export const FLOOR = 930;
export const KEY_POS: V2 = [1075, 612];

/** big brother writing in the ledger behind the counter */
export function bWrite(t0: number, o: Partial<ActorSpec> = {}, stop = false): ActorSpec {
  const t = Math.max(0, t0); // t can be slightly negative during the pre-roll of a cross-dissolve
  // handwriting: the pen travels along a line, flicks back to the next line, with small up/down strokes
  const cyc = (t * 0.34) % 1;
  const along = cyc < 0.86 ? cyc / 0.86 : 1 - (cyc - 0.86) / 0.14;
  const lineNo = Math.floor(t * 0.34) % 4;
  const sx = stop ? 0 : 1355 + along * 78 + Math.sin(t * 11) * 3.2 - 1380;
  const bob = stop ? 0 : Math.sin(t * 15.5) * 2.2 + Math.max(0, Math.sin(t * 5.3)) * -3 + lineNo * 3;
  const prog = stop ? 0.5 : along;
  return {
    id: 'B',
    x: 1480,
    flip: true,
    expr: 'stern',
    lean: 13 + prog * 1.4,
    tilt: 6 + (stop ? 0 : Math.sin(t * 0.9) * 1.2),
    lookY: 0.85,
    look: -0.4 - prog * 0.12,
    hf: [1380 + sx, COUNTER_Y - 10 + bob],
    hr: [1520, COUNTER_Y - 12],
    pen: !stop,
    ...o,
  };
}

export function walkTo(
  t: number,
  x0: number,
  x1: number,
  ts: number,
  te: number,
): { x: number; walk: number | null; flip: boolean } {
  const p = easeInOut(clamp((t - ts) / (te - ts)));
  const x = x0 + (x1 - x0) * p;
  const moving = t > ts && t < te;
  return { x, walk: moving ? Math.abs(x - x0) / 46 : null, flip: x1 < x0 };
}

/** the word "আমার" as a visual motif */
export const AmarWord: React.FC<{ x: number; y: number; size: number; op: number; color?: string; rot?: number }> = ({
  x, y, size, op, color = '#f4e6c4', rot = 0,
}) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    fontFamily="'Noto Sans Bengali', 'Hind Siliguri', sans-serif"
    fontWeight={800}
    fill={color}
    opacity={op}
    textAnchor="middle"
    transform={`rotate(${rot} ${x} ${y})`}
    stroke="#2b1d17"
    strokeWidth={size * 0.035}
    paintOrder="stroke"
  >
    আমার
  </text>
);

export const Book: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-52} y={-70} width={104} height={140} rx={5} fill="#3a3a48" stroke="#2b1d17" strokeWidth={4} />
    <rect x={-52} y={-70} width={16} height={140} fill="#2a2a34" stroke="#2b1d17" strokeWidth={3} />
    <rect x={-22} y={-44} width={60} height={34} fill="#cdbb8b" stroke="#2b1d17" strokeWidth={2.5} />
    <path d="M -14 -26 q 10 -8 20 0 t 20 0" stroke="#2b1d17" strokeWidth={2.5} fill="none" />
  </g>
);
