import React from 'react';
import { clamp, ik, lerp, mixHex, sway, V2 } from '../lib/anim';
import type { Viseme } from '../lib/lipsync';

export type Expr =
  | 'neutral'
  | 'stern'
  | 'angry'
  | 'sad'
  | 'worried'
  | 'smile'
  | 'bitter'
  | 'surprised'
  | 'soft'
  | 'thinking';

type EP = { ba: number; bY: number; eye: number; mc: number; asym?: number };
const EXPR: Record<Expr, EP> = {
  neutral: { ba: 0, bY: 0, eye: 1, mc: 0.05 },
  stern: { ba: 0.7, bY: 1, eye: 0.82, mc: -0.3 },
  angry: { ba: 1, bY: 3, eye: 0.72, mc: -0.6 },
  sad: { ba: -0.85, bY: -1, eye: 0.7, mc: -0.7 },
  worried: { ba: -0.6, bY: -4, eye: 1.05, mc: -0.3 },
  smile: { ba: -0.1, bY: -1, eye: 0.82, mc: 0.85 },
  bitter: { ba: 0.2, bY: 0, eye: 0.85, mc: 0.35, asym: 1 },
  surprised: { ba: -0.2, bY: -9, eye: 1.28, mc: 0 },
  soft: { ba: -0.4, bY: -1, eye: 0.88, mc: 0.3 },
  thinking: { ba: 0.35, bY: -2, eye: 0.85, mc: -0.15 },
};

export type CharId = 'B' | 'M' | 'Mo' | 'O' | 'C';

interface CharDef {
  skin: string;
  skinShade: string;
  hair: string;
  hairStyle: 'comb' | 'messy' | 'cap' | 'short' | 'saree';
  shirt: string;
  pants: string;
  shoes: string;
  sleeve: 'long' | 'rolled';
  build: number;
  height: number;
  stubble?: boolean;
  mustache?: boolean;
  apron?: string;
  grey?: boolean;
  saree?: string;
  border?: string;
  iris: string;
  belt: string;
}

export const CHARS: Record<CharId, CharDef> = {
  B: {
    skin: '#c08560', skinShade: '#a56d4c', hair: '#1d1613', hairStyle: 'comb',
    shirt: '#6f7c55', pants: '#2f3037', shoes: '#3b2b22', sleeve: 'long',
    build: 1.12, height: 1, stubble: true, iris: '#3a2416', belt: '#2a1d16',
  },
  M: {
    skin: '#c58b62', skinShade: '#a8714f', hair: '#241a15', hairStyle: 'messy',
    shirt: '#4f8089', pants: '#2a2e3a', shoes: '#33271f', sleeve: 'rolled',
    build: 0.94, height: 0.99, iris: '#33200f', belt: '#2a1d16',
  },
  Mo: {
    skin: '#b57a54', skinShade: '#9a6446', hair: '#2a2420', hairStyle: 'saree',
    shirt: '#35505a', pants: '#000', shoes: '#2a211b', sleeve: 'rolled',
    build: 0.98, height: 0.93, saree: '#8c4a45', border: '#d3a64c', iris: '#2c1a10', belt: '#2a1d16',
  },
  O: {
    skin: '#b27851', skinShade: '#976247', hair: '#1c1613', hairStyle: 'cap',
    shirt: '#b99445', pants: '#34384a', shoes: '#3a2c24', sleeve: 'long',
    build: 1.02, height: 1.0, apron: '#e6e0d0', mustache: true, iris: '#2d1a0e', belt: '#2a1d16',
  },
  C: {
    skin: '#b98258', skinShade: '#9d6a49', hair: '#2c2623', hairStyle: 'short',
    shirt: '#a2b0be', pants: '#85795f', shoes: '#3a2c24', sleeve: 'rolled',
    build: 1.2, height: 0.98, mustache: true, grey: true, iris: '#35210f', belt: '#3a2c1f',
  },
};

export interface ActorSpec {
  id: CharId;
  x: number;
  y?: number;
  flip?: boolean;
  scale?: number;
  expr?: Expr;
  expr2?: Expr;
  exprK?: number;
  lean?: number;
  tilt?: number;
  look?: number;
  lookY?: number;
  hf?: V2 | null; // front-hand world target
  hr?: V2 | null; // rear-hand world target
  walk?: number | null; // walk phase (radians) — null/undefined = standing
  sit?: number;
  mouth?: number; // legacy: plain openness override
  vis?: Viseme; // lip-sync viseme
  gest?: number; // 0..1 speech energy → idle gestures
  emph?: number; // 0..1 vocal stress → brow / nod
  pen?: boolean; // holds a pen in the front hand
  op?: number;
  z?: 'back' | 'front';
  seed?: number;
  armsOver?: boolean; // arms are drawn in a later pass (in front of counter / ledger)
  part?: 'all' | 'body' | 'arms';
}

const OUT = '#2b1d17';
const UP = 130;
const LO = 120;
const HIP_Y = -272;
const LEG1 = 135;
const LEG2 = 120;
const ANKLE = 22;

const shade = (c: string, k: number) => mixHex(c, '#000000', k);
const lite = (c: string, k: number) => mixHex(c, '#ffffff', k);

/** elbow always points down / outward (never folds across the chest) */
function elbowBend(sx: number, sy: number, tx: number, ty: number, side: 1 | -1): 1 | -1 {
  const score = (bend: 1 | -1) => {
    const { ex, ey } = ik(sx, sy, tx, ty, UP, LO, bend);
    // elbow must not cross over the centre-line of the body (arm folded across the chest)
    const inside = Math.max(0, 34 - ex * side) * 3.2;
    // prefer elbows that sit low and slightly outward
    return (ey - sy) * 1 + (ex - sx) * side * 0.25 - inside;
  };
  return score(1) >= score(-1) ? 1 : -1;
}

/** tapered capsule between two points */
function tubePath(x0: number, y0: number, x1: number, y1: number, w0: number, w1: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * 0.5;
  const ny = (dx / L) * 0.5;
  return `M ${x0 + nx * w0} ${y0 + ny * w0} L ${x1 + nx * w1} ${y1 + ny * w1} L ${x1 - nx * w1} ${y1 - ny * w1} L ${x0 - nx * w0} ${y0 - ny * w0} Z`;
}
const Tube: React.FC<{ p: number[]; w0: number; w1: number; fill: string; stroke?: string; sw?: number; opacity?: number }> = ({
  p, w0, w1, fill, stroke, sw = 0, opacity = 1,
}) => (
  <g fill={fill} stroke={stroke ?? 'none'} strokeWidth={sw} strokeLinejoin="round" opacity={opacity}>
    <path d={tubePath(p[0], p[1], p[2], p[3], w0, w1)} />
    <circle cx={p[0]} cy={p[1]} r={w0 / 2} />
    <circle cx={p[2]} cy={p[3]} r={w1 / 2} />
  </g>
);

/* ------------------------------ HAND ------------------------------ */
const Hand: React.FC<{
  x: number; y: number; ang: number; skin: string; shadeC: string; thumb: 1 | -1; curl: number; pen?: boolean;
}> = ({ x, y, ang, skin, shadeC, thumb, curl, pen }) => {
  const lens = [0.86, 1, 0.94, 0.74];
  const fx = [-9.5, -3.2, 3.2, 9.5];
  const L = lerp(30, 19, curl);
  const spread = lerp(15, 2.5, curl);
  const th = thumb;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang - 90})`} strokeLinecap="round" strokeLinejoin="round">
      {/* outline underlay */}
      <g stroke={OUT} strokeWidth={10.5} fill="none">
        {fx.map((f, i) => {
          const a = ((i - 1.5) * spread * th * -1 * 1) * (Math.PI / 180);
          const l = L * lens[i];
          const ex = f + Math.sin(a) * l + th * -curl * 3;
          const ey = 30 + Math.cos(a) * l * (1 - curl * 0.1);
          return <path key={i} d={`M ${f} 30 Q ${f + th * -curl * 2} ${30 + l * 0.55} ${ex} ${ey}`} />;
        })}
        <path d={`M ${th * 9} 10 Q ${th * (16 + (1 - curl) * 10)} ${18} ${th * lerp(30, 17, curl)} ${lerp(30, 30, curl)}`} />
      </g>
      <path d="M -13 -2 C -17 10 -16 26 -11 36 L 11 36 C 16 26 17 10 13 -2 Z" fill={skin} stroke={OUT} strokeWidth={3} />
      {/* fingers */}
      <g stroke={skin} strokeWidth={7.4} fill="none">
        {fx.map((f, i) => {
          const a = ((i - 1.5) * spread * th * -1) * (Math.PI / 180);
          const l = L * lens[i];
          const ex = f + Math.sin(a) * l + th * -curl * 3;
          const ey = 30 + Math.cos(a) * l * (1 - curl * 0.1);
          return <path key={i} d={`M ${f} 30 Q ${f + th * -curl * 2} ${30 + l * 0.55} ${ex} ${ey}`} />;
        })}
        <path d={`M ${th * 9} 10 Q ${th * (16 + (1 - curl) * 10)} ${18} ${th * lerp(30, 17, curl)} ${lerp(30, 30, curl)}`} strokeWidth={8.6} />
      </g>
      {/* finger separators + knuckle shade */}
      <g stroke={shadeC} strokeWidth={1.6} fill="none" opacity={0.7}>
        {[-6.4, 0, 6.4].map((f, i) => <path key={i} d={`M ${f} 31 L ${f + th * -curl} ${31 + L * 0.5}`} />)}
        <path d="M -10 33 Q 0 38 10 33" opacity={0.6} />
      </g>
      <path d="M 2 4 C 8 14 9 26 6 36 L 11 36 C 16 26 17 10 13 -2 Z" fill={shadeC} opacity={0.28} />
      {pen && (
        <g>
          <path d={`M ${th * 2} 50 L ${th * 24} 4`} stroke={OUT} strokeWidth={9} />
          <path d={`M ${th * 2} 50 L ${th * 24} 4`} stroke="#2a4a6a" strokeWidth={5.4} />
          <path d={`M ${th * 2} 50 L ${th * 4.2} 44.4`} stroke="#e6d9b9" strokeWidth={5.4} />
          <path d={`M ${th * 8} 38 L ${th * 20} 12`} stroke="#9bb7d0" strokeWidth={1.4} opacity={0.7} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------ ARM ------------------------------ */
const Arm: React.FC<{
  sx: number; sy: number; tx: number; ty: number; side: 1 | -1; w: number; d: CharDef;
  front: boolean; flat: boolean; curl: number; pen?: boolean;
}> = ({ sx, sy, tx, ty, side, w, d, front, flat, curl, pen }) => {
  const bend = elbowBend(sx, sy, tx, ty, side);
  const { ex, ey, hx, hy } = ik(sx, sy, tx, ty, UP, LO, bend);
  let ang = (Math.atan2(hy - ey, hx - ex) * 180) / Math.PI;
  if (flat) {
    // hand lies on the surface: keep the hand close to horizontal, fingers pointing in front of the body
    const r = (ang * Math.PI) / 180;
    const down = Math.sin(r);
    if (down > 0.5) {
      const dirX = Math.cos(r) >= 0.05 ? 1 : Math.cos(r) <= -0.05 ? -1 : -side;
      ang = (Math.atan2(0.5, 0.86 * dirX) * 180) / Math.PI;
    }
  }
  const shirt = front ? d.shirt : shade(d.shirt, 0.22);
  const shirtDark = shade(shirt, 0.25);
  const skin = front ? d.skin : d.skinShade;
  const skinDark = shade(skin, 0.2);
  const rolled = d.sleeve === 'rolled';
  const foreC = rolled ? skin : shirt;
  const wUp0 = w;
  const wUp1 = w * 0.86;
  const wF0 = w * 0.8;
  const wF1 = w * 0.6;
  const up = [sx, sy, ex, ey];
  const fo = [ex, ey, hx, hy];
  // roll-up cuff position: slightly below the elbow
  const fl = Math.hypot(hx - ex, hy - ey) || 1;
  const cx = ex + ((hx - ex) / fl) * 16;
  const cy = ey + ((hy - ey) / fl) * 16;
  const ca = (Math.atan2(hy - ey, hx - ex) * 180) / Math.PI;
  const wx = hx - ((hx - ex) / fl) * 9;
  const wy = hy - ((hy - ey) / fl) * 9;
  return (
    <g>
      {/* outline union */}
      <g>
        <Tube p={up} w0={wUp0} w1={wUp1} fill={OUT} stroke={OUT} sw={6.5} />
        <Tube p={fo} w0={wF0} w1={wF1} fill={OUT} stroke={OUT} sw={6.5} />
        <circle cx={sx} cy={sy} r={w * 0.5} fill={OUT} stroke={OUT} strokeWidth={6.5} />
      </g>
      <Tube p={up} w0={wUp0} w1={wUp1} fill={shirt} />
      <Tube p={fo} w0={wF0} w1={wF1} fill={foreC} />
      <circle cx={ex} cy={ey} r={wUp1 / 2} fill={shirt} />
      <circle cx={sx} cy={sy} r={w * 0.48} fill={shirt} />
      {/* shading: shadow side + highlight */}
      <Tube p={[sx + 3, sy + 3, ex + 3, ey + 3]} w0={wUp0 * 0.45} w1={wUp1 * 0.4} fill={shirtDark} opacity={0.35} />
      <Tube p={fo.map((v, i) => v + (i % 2 === 0 ? 2.5 : 2.5))} w0={wF0 * 0.4} w1={wF1 * 0.4} fill={rolled ? skinDark : shirtDark} opacity={0.3} />
      <Tube p={[sx - 4, sy + 6, ex - 4, ey + 2]} w0={wUp0 * 0.16} w1={wUp1 * 0.14} fill="#fff" opacity={0.1} />
      {/* elbow crease */}
      <path d={`M ${ex - 7} ${ey - 4} q 7 7 14 0`} stroke={shirtDark} strokeWidth={2.2} fill="none" opacity={0.55} transform={`rotate(${ca - 90} ${ex} ${ey})`} />
      {rolled ? (
        <g transform={`translate(${cx} ${cy}) rotate(${ca - 90})`}>
          <rect x={-wF0 * 0.62} y={-8} width={wF0 * 1.24} height={13} rx={6} fill={shirt} stroke={OUT} strokeWidth={3} />
          <path d={`M ${-wF0 * 0.5} -2 L ${wF0 * 0.5} -2`} stroke={shirtDark} strokeWidth={1.8} opacity={0.6} />
        </g>
      ) : (
        <g transform={`translate(${wx} ${wy}) rotate(${ca - 90})`}>
          <rect x={-wF1 * 0.66} y={-6} width={wF1 * 1.32} height={14} rx={5} fill={lite(shirt, 0.14)} stroke={OUT} strokeWidth={3} />
          <circle cx={wF1 * 0.3} cy={1} r={1.8} fill={OUT} opacity={0.6} />
        </g>
      )}
      <Hand x={hx} y={hy} ang={ang} skin={skin} shadeC={skinDark} thumb={(-side) as 1 | -1} curl={curl} pen={pen} />
    </g>
  );
};

/* ------------------------------ LEG ------------------------------ */
const Leg: React.FC<{
  hx0: number; hy0: number; tx: number; ty: number; w: number; pants: string; shoes: string; dir: 1 | -1; rot: number; front: boolean; cuffC: string;
}> = ({ hx0, hy0, tx, ty, w, pants, shoes, dir, rot, front, cuffC }) => {
  const { ex, ey, hx, hy } = ik(hx0, hy0, tx, ty, LEG1, LEG2, -1);
  const c = front ? pants : shade(pants, 0.18);
  const dk = shade(c, 0.28);
  const up = [hx0, hy0, ex, ey];
  const lo = [ex, ey, hx, hy];
  const sole = shade(shoes, 0.45);
  const la = (Math.atan2(hy - ey, hx - ex) * 180) / Math.PI;
  return (
    <g>
      <g>
        <Tube p={up} w0={w * 1.04} w1={w * 0.8} fill={OUT} stroke={OUT} sw={6.5} />
        <Tube p={lo} w0={w * 0.78} w1={w * 0.6} fill={OUT} stroke={OUT} sw={6.5} />
      </g>
      <Tube p={up} w0={w * 1.04} w1={w * 0.8} fill={c} />
      <Tube p={lo} w0={w * 0.78} w1={w * 0.6} fill={c} />
      <circle cx={ex} cy={ey} r={w * 0.4} fill={c} />
      <Tube p={[hx0 + 5, hy0 + 8, ex + 4, ey]} w0={w * 0.4} w1={w * 0.3} fill={dk} opacity={0.35} />
      <Tube p={[ex + 3, ey, hx + 3, hy]} w0={w * 0.32} w1={w * 0.24} fill={dk} opacity={0.35} />
      <path d={`M ${ex - 14} ${ey + 3} q 14 10 28 0 M ${ex - 11} ${ey - 12} q 11 -6 22 0`} stroke={dk} strokeWidth={2.2} fill="none" opacity={0.5} />
      {/* trouser cuff */}
      <g transform={`translate(${hx} ${hy}) rotate(${la - 90})`}>
        <rect x={-w * 0.36} y={-10} width={w * 0.72} height={14} rx={4} fill={dk} stroke={OUT} strokeWidth={3} />
      </g>
      {/* shoe */}
      <g transform={`translate(${hx} ${hy}) scale(${dir} 1) rotate(${rot})`}>
        <path d="M -16 -4 L 11 -6 C 20 -1 36 3 47 12 C 52 15 52 23 45 23 L -18 23 C -24 23 -24 8 -16 -4 Z" fill={shoes} stroke={OUT} strokeWidth={3.2} strokeLinejoin="round" />
        <path d="M -20 17 L 49 17 L 46 23 L -19 23 Z" fill={sole} />
        <path d="M 3 -3 L 12 8 M 11 -4 L 20 6 M 20 -1 L 28 7" stroke={lite(shoes, 0.3)} strokeWidth={1.8} opacity={0.7} />
        <path d="M -12 -2 C -16 6 -14 12 -12 14" stroke="#fff" strokeWidth={2.4} opacity={0.12} fill="none" />
      </g>
    </g>
  );
};

/* ------------------------------ HEAD ------------------------------ */
function Head({
  d, ep, vis, look, lookY, blink, uid, t, seed, emph,
}: {
  d: CharDef; ep: EP; vis: Viseme; look: number; lookY: number; blink: number; uid: string; t: number; seed: number; emph: number;
}) {
  // eyes never stare dead still: tiny saccades
  const sacT = Math.floor(t * 0.85 + seed * 0.37);
  const hash = (n: number) => Math.sin(n * 127.1 + seed * 31.7) * 43758.5453 % 1;
  const sacX = hash(sacT) * 0.1;
  const sacY = hash(sacT + 9.1) * 0.08;
  const lk = clamp(look + sacX, -1.1, 1.1);
  const lky = clamp(lookY + sacY, -1, 1);
  const hl = lk * 13;
  const hy = lky * 6;
  const eyeOpen = clamp(ep.eye * (1 - blink), 0.04, 1.4);
  const mc = ep.mc;

  const brow = (side: -1 | 1) => {
    const asym = ep.asym && side === 1 ? 1 : 0;
    const lift = emph * 3.2;
    const inner = -27 + ep.bY + ep.ba * 7 - asym * 3 - lift;
    const outer = -27 + ep.bY - ep.ba * 5 - asym * 3 - lift;
    const xi = side * 9 + hl;
    const xo = side * 35 + hl;
    const mid = Math.min(inner, outer) - 5;
    const c = d.hairStyle === 'saree' ? '#2a211c' : d.hair;
    return (
      <g>
        <path d={`M ${xi} ${inner} Q ${(xi + xo) / 2} ${mid} ${xo} ${outer}`} stroke={c} strokeWidth={7.6} fill="none" strokeLinecap="round" />
        <path d={`M ${xi + side * 3} ${inner + 1.5} Q ${(xi + xo) / 2} ${mid + 2} ${xo - side * 3} ${outer + 1.5}`} stroke={lite(c, 0.18)} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.5} />
      </g>
    );
  };
  const eye = (side: -1 | 1) => {
    const ex = side * 21 + hl;
    const iw = 11;
    const ih = 8.7 * eyeOpen;
    const px = lk * 4.6;
    const py = lky * 3.2;
    const cid = `ec-${uid}-${side}`;
    return (
      <g transform={`translate(${ex} ${-3 + hy})`}>
        <clipPath id={cid}>
          <ellipse rx={iw} ry={Math.max(0.6, ih)} />
        </clipPath>
        <ellipse rx={iw} ry={Math.max(0.6, ih)} fill="#f1e9dc" />
        <g clipPath={`url(#${cid})`}>
          <circle cx={px} cy={py} r={6.2} fill={`url(#iris-${uid})`} />
          <circle cx={px} cy={py} r={2.7} fill="#0d0705" />
          <circle cx={px + 2.1} cy={py - 2.2} r={1.7} fill="#fff" opacity={0.9} />
          <circle cx={px - 1.8} cy={py + 2} r={0.9} fill="#fff" opacity={0.4} />
          <ellipse rx={iw} ry={ih} cy={-ih * 0.55} fill="#000" opacity={0.16} />
        </g>
        <ellipse rx={iw} ry={Math.max(0.6, ih)} fill="none" stroke={OUT} strokeWidth={2.2} />
        {/* upper lid + crease + lashes */}
        <path d={`M -12 ${-ih + 1.2} Q 0 ${-ih * 1.45 - 1.5} 12 ${-ih + 1.2}`} stroke={OUT} strokeWidth={3.4} fill="none" strokeLinecap="round" />
        <path d={`M ${-10} ${-ih * 1.35 - 4} Q 0 ${-ih * 1.7 - 6} 10 ${-ih * 1.35 - 4}`} stroke={shade(d.skin, 0.4)} strokeWidth={1.5} fill="none" opacity={eyeOpen > 0.5 ? 0.5 : 0.15} />
        <path d={`M ${side * 11} ${-ih + 1} l ${side * 4} -2.4`} stroke={OUT} strokeWidth={2} strokeLinecap="round" />
        <path d={`M -9 ${ih + 1.5} Q 0 ${ih + 3.5} 9 ${ih + 1.5}`} stroke={shade(d.skin, 0.35)} strokeWidth={1.4} fill="none" opacity={0.4} />
      </g>
    );
  };

  /* ---------- mouth (viseme driven) ---------- */
  const open = clamp(vis.open, 0, 1);
  const wide = clamp(vis.wide, -1, 1);
  const press = clamp(vis.press, 0, 1);
  const hw = clamp(19 + mc * 2.2 + wide * 6.2 * Math.min(1, open * 2 + 0.2) - open * 1.2, 10.5, 28);
  const cyc = 37 - mc * 6.5 + open * 1.6;
  const upMid = 36 + mc * 4.5 - open * 2.4 + press * 0.6;
  const loMid = upMid + 0.8 + open * 27 * (1 - 0.2 * Math.max(0, -wide));
  const upCtl = 2 * upMid - cyc;
  const loCtl = 2 * loMid - cyc;
  const lipC = mixHex(d.skin, '#a23a38', 0.5);
  const lipDark = shade(lipC, 0.3);
  const mx = hl * 0.9;
  const mClip = `mclip-${uid}`;
  const isOpen = open > 0.07;
  const teethH = clamp(open * 16, 0, 10) * vis.teeth;
  const mouthEl = (
    <g transform={`translate(${mx} 0)`}>
      {isOpen ? (
        <g>
          <clipPath id={mClip}>
            <path d={`M ${-hw} ${cyc} Q 0 ${upCtl} ${hw} ${cyc} Q 0 ${loCtl} ${-hw} ${cyc} Z`} />
          </clipPath>
          <path d={`M ${-hw} ${cyc} Q 0 ${upCtl} ${hw} ${cyc} Q 0 ${loCtl} ${-hw} ${cyc} Z`} fill="#3c1414" />
          <g clipPath={`url(#${mClip})`}>
            {teethH > 0.6 && <rect x={-hw * 0.82} y={upMid - 6} width={hw * 1.64} height={teethH + 6 + 2} rx={3} fill="#efe8d8" />}
            {teethH > 0.6 && <path d={`M ${-hw * 0.8} ${upMid + teethH + 1} L ${hw * 0.8} ${upMid + teethH + 1}`} stroke="#c9bfa9" strokeWidth={1} />}
            {vis.tongue > 0.1 && <ellipse cx={0} cy={loMid - 3.5} rx={hw * 0.55} ry={3 + open * 6 * vis.tongue} fill="#b4524f" />}
            <rect x={-hw} y={upMid - 8} width={hw * 2} height={6} fill="#000" opacity={0.18} />
          </g>
          <path d={`M ${-hw} ${cyc} Q 0 ${upCtl - 1.2} ${hw} ${cyc}`} stroke={lipDark} strokeWidth={4.2} fill="none" strokeLinecap="round" />
          <path d={`M ${-hw + 1} ${cyc} Q 0 ${loCtl + 1.6} ${hw - 1} ${cyc}`} stroke={lipC} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d={`M ${-hw * 0.5} ${loMid + 4.2} Q 0 ${loMid + 5.4} ${hw * 0.5} ${loMid + 4.2}`} stroke="#fff" strokeWidth={1.4} opacity={0.22} fill="none" strokeLinecap="round" />
          <path d={`M ${-hw} ${cyc} Q 0 ${loCtl} ${hw} ${cyc} Q 0 ${upCtl} ${-hw} ${cyc}`} stroke={OUT} strokeWidth={1.6} fill="none" opacity={0.6} />
        </g>
      ) : (
        <g>
          {/* closed lips: lower lip fuller, upper lip with cupid's bow */}
          <path d={`M ${-hw} ${cyc} Q 0 ${upCtl + 0.8 + press * 0.0} ${hw} ${cyc} Q 0 ${upCtl + 9} ${-hw} ${cyc} Z`} fill={lipC} opacity={0.88} />
          <path d={`M ${-hw * 0.9} ${cyc + 0.5} Q ${-hw * 0.4} ${upMid - 4.2} 0 ${upMid - 2.6} Q ${hw * 0.4} ${upMid - 4.2} ${hw * 0.9} ${cyc + 0.5} Q 0 ${upCtl + 0.6} ${-hw * 0.9} ${cyc + 0.5} Z`} fill={shade(lipC, 0.08)} />
          <path d={`M ${-hw} ${cyc} Q 0 ${upCtl + 1.2 + press * 0.6} ${hw} ${cyc}`} stroke={OUT} strokeWidth={2.9 + press * 0.5} fill="none" strokeLinecap="round" />
          <path d={`M ${-hw * 0.55} ${upMid + 4.8} Q 0 ${upMid + 6.4} ${hw * 0.55} ${upMid + 4.8}`} stroke="#fff" strokeWidth={1.5} opacity={0.2} fill="none" strokeLinecap="round" />
        </g>
      )}
      {mc > 0.45 && (
        <g stroke={shade(d.skin, 0.35)} strokeWidth={2} fill="none" opacity={0.45} strokeLinecap="round">
          <path d={`M ${-hw - 4} ${cyc - 4} q -4 4 -1 9`} />
          <path d={`M ${hw + 4} ${cyc - 4} q 4 4 1 9`} />
        </g>
      )}
    </g>
  );

  const hairBack =
    d.hairStyle === 'saree' ? (
      <path d="M -60 30 C -72 -60 -34 -92 0 -92 C 34 -92 72 -60 60 30 L 40 40 L -40 40 Z" fill={d.saree} stroke={OUT} strokeWidth={3.5} />
    ) : d.hairStyle === 'cap' ? null : (
      <path d="M -56 -2 C -68 -62 -34 -92 4 -90 C 44 -90 68 -62 56 -2 C 52 6 48 4 46 -6 L -46 -6 C -48 4 -52 6 -56 -2 Z" fill={d.hair} stroke={OUT} strokeWidth={3} />
    );

  let hairFront: React.ReactNode = null;
  const hHi = lite(d.hair, 0.22);
  switch (d.hairStyle) {
    case 'comb':
      hairFront = (
        <g>
          <path d="M -53 -6 C -62 -58 -32 -84 6 -82 C 44 -82 62 -56 53 -4 C 48 -30 38 -42 18 -48 C -8 -40 -34 -36 -53 -6 Z" fill={`url(#hair-${uid})`} stroke={OUT} strokeWidth={3} />
          <path d="M 4 -80 C -2 -66 -8 -56 -12 -46 M 20 -78 C 16 -66 10 -56 4 -48 M -22 -76 C -26 -64 -30 -54 -36 -44 M 36 -72 C 34 -62 30 -54 26 -48" fill="none" stroke={hHi} strokeWidth={2} opacity={0.6} strokeLinecap="round" />
          <path d="M -36 -68 C -20 -80 10 -84 30 -76" fill="none" stroke="#fff" strokeWidth={3} opacity={0.12} strokeLinecap="round" />
        </g>
      );
      break;
    case 'messy':
      hairFront = (
        <g>
          <path d="M -52 -4 C -62 -50 -44 -72 -30 -78 L -26 -92 L -14 -78 L -6 -96 L 4 -80 L 16 -94 L 22 -78 L 36 -86 L 40 -70 C 60 -60 60 -30 52 -4 C 46 -26 36 -38 16 -44 C -8 -34 -34 -34 -52 -4 Z" fill={`url(#hair-${uid})`} stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
          <path d="M -34 -66 L -22 -50 M -8 -70 L 0 -52 M 16 -70 L 22 -52 M 34 -62 L 38 -48" stroke={hHi} strokeWidth={2} opacity={0.55} strokeLinecap="round" />
        </g>
      );
      break;
    case 'short':
      hairFront = (
        <g stroke={OUT} strokeWidth={3}>
          <path d="M -53 -4 C -62 -56 -34 -80 2 -80 C 42 -80 62 -54 53 -2 C 50 -22 42 -36 24 -42 C -4 -36 -36 -34 -53 -4 Z" fill={`url(#hair-${uid})`} />
          {d.grey && <path d="M -52 -4 C -54 8 -50 14 -48 16 L -45 -6 Z M 52 -4 C 54 8 50 14 48 16 L 45 -6 Z" fill="#9a968f" />}
          {d.grey && <path d="M -20 -74 C -4 -80 20 -78 34 -68" stroke="#b6b2aa" strokeWidth={3} fill="none" opacity={0.6} />}
        </g>
      );
      break;
    case 'cap':
      hairFront = (
        <g stroke={OUT} strokeWidth={3} strokeLinejoin="round">
          <path d="M -54 -14 C -58 -70 -20 -88 6 -86 C 40 -86 62 -64 54 -14 Z" fill="#3a4a5a" />
          <path d="M -40 -62 C -20 -78 10 -82 32 -72" stroke="#fff" strokeWidth={4} fill="none" opacity={0.1} />
          <path d="M 30 -26 Q 78 -28 84 -14 Q 60 -10 30 -12 Z" fill="#2f3d4b" />
          <path d="M -54 -14 L 54 -14" fill="none" />
          <path d="M -54 -14 L 54 -14 L 54 -8 L -54 -8 Z" fill="#2c3946" stroke="none" opacity={0.7} />
        </g>
      );
      break;
    case 'saree':
      hairFront = (
        <g>
          <path d="M -54 8 C -60 -46 -34 -74 0 -74 C 34 -74 60 -46 54 8 C 52 -22 38 -44 0 -46 C -38 -44 -52 -22 -54 8 Z" fill={d.saree} stroke={OUT} strokeWidth={3} />
          <path d="M -50 -4 C -40 -40 -20 -56 0 -58 C 20 -56 40 -40 50 -4" stroke={shade(d.saree ?? '#000', 0.3)} strokeWidth={2.4} fill="none" opacity={0.6} />
          <path d="M -50 -4 C -44 -34 -26 -50 0 -52" stroke={d.border} strokeWidth={4} fill="none" opacity={0.9} />
          <path d="M 0 -46 C -4 -30 -6 -22 -8 -14" stroke="#1c1512" strokeWidth={2.5} fill="none" opacity={0.7} />
        </g>
      );
      break;
  }

  const nose = hl * 1.1;
  return (
    <g>
      {hairBack}
      {/* ears */}
      <g>
        <ellipse cx={-50 + hl * 0.4} cy={2} rx={8} ry={13} fill={d.skin} stroke={OUT} strokeWidth={3} />
        <ellipse cx={50 + hl * 0.4} cy={2} rx={8} ry={13} fill={d.skinShade} stroke={OUT} strokeWidth={3} />
        <path d={`M ${-51 + hl * 0.4} -4 q -3 6 1 11 M ${51 + hl * 0.4} -4 q 3 6 -1 11`} stroke={shade(d.skin, 0.35)} strokeWidth={1.8} fill="none" opacity={0.7} />
      </g>
      {/* face */}
      <path d="M -50 -5 C -50 -45 -28 -62 0 -62 C 28 -62 50 -45 50 -5 C 50 36 28 62 0 64 C -28 62 -50 36 -50 -5 Z" fill={`url(#skin-${uid})`} stroke={OUT} strokeWidth={3.5} />
      <path d="M 50 -5 C 50 36 28 62 0 64 C 22 56 36 30 36 -4 C 36 -30 28 -48 12 -58 C 36 -52 50 -34 50 -5 Z" fill={d.skinShade} opacity={0.45} />
      {/* soft cheek bones, eye sockets, chin shadow */}
      <ellipse cx={-22 + hl * 0.6} cy={-3 + hy * 0.4} rx={17} ry={11} fill={shade(d.skin, 0.25)} opacity={0.14} />
      <ellipse cx={22 + hl * 0.6} cy={-3 + hy * 0.4} rx={17} ry={11} fill={shade(d.skin, 0.25)} opacity={0.14} />
      <path d="M -26 56 Q 0 66 26 56 Q 0 60 -26 56 Z" fill="#000" opacity={0.12} />
      {d.stubble && (
        <g>
          <path d="M -46 14 C -40 52 -20 62 0 62 C 20 62 40 52 46 14 C 36 34 20 42 0 42 C -20 42 -36 34 -46 14 Z" fill="#2a1d18" opacity={0.36} />
          <path d="M -34 36 L 34 36 M -28 46 L 28 46" stroke="#1b120e" strokeWidth={2} strokeDasharray="1 4" opacity={0.5} />
        </g>
      )}
      {/* forehead / frown lines */}
      {(ep.ba > 0.5 || ep.bY < -3) && (
        <g stroke={shade(d.skin, 0.4)} strokeWidth={1.8} fill="none" opacity={0.35} strokeLinecap="round">
          {ep.ba > 0.5 ? <path d={`M ${hl - 4} -34 l -2 -9 M ${hl + 5} -34 l 2 -9`} /> : <path d={`M ${hl - 24} -46 q 24 -6 48 0 M ${hl - 18} -52 q 18 -5 36 0`} />}
        </g>
      )}
      {hairFront}
      {brow(-1)}
      {brow(1)}
      {eye(-1)}
      {eye(1)}
      {/* nose */}
      <g>
        <path d={`M ${nose + 3} -4 Q ${nose + 9 + lk * 3} 16 ${nose + 5} 23`} stroke={shade(d.skin, 0.4)} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.55} />
        <path d={`M ${nose - 8} 23 Q ${nose - 1} 28 ${nose + 8} 23`} stroke={OUT} strokeWidth={2.8} fill="none" strokeLinecap="round" opacity={0.8} />
        <ellipse cx={nose - 5} cy={23.5} rx={2.4} ry={1.6} fill="#2b1d17" opacity={0.55} />
        <ellipse cx={nose + 5} cy={23.5} rx={2.4} ry={1.6} fill="#2b1d17" opacity={0.55} />
        <ellipse cx={nose - 1} cy={17} rx={3.5} ry={5} fill="#fff" opacity={0.1} />
      </g>
      {d.mustache && (
        <path
          d={`M ${hl - 25} 28 Q ${hl - 10} 19 ${hl} 27 Q ${hl + 10} 19 ${hl + 25} 28 Q ${hl + 10} 34 ${hl} 31 Q ${hl - 10} 34 ${hl - 25} 28 Z`}
          fill={d.grey ? '#5a5652' : d.hair}
          stroke={OUT}
          strokeWidth={1}
        />
      )}
      {mouthEl}
      {/* cheek blush */}
      <ellipse cx={-30 + hl} cy={22} rx={9} ry={5} fill="#d97a6a" opacity={ep.mc > 0.4 ? 0.28 : 0.1} />
      <ellipse cx={30 + hl} cy={22} rx={9} ry={5} fill="#d97a6a" opacity={ep.mc > 0.4 ? 0.28 : 0.1} />
    </g>
  );
}

/* ------------------------------ PERSON ------------------------------ */
export const Person: React.FC<{ a: ActorSpec; t: number }> = ({ a, t }) => {
  const d = CHARS[a.id];
  const part = a.part ?? 'all';
  const s = (a.scale ?? 1) * d.height;
  const flip = a.flip ? -1 : 1;
  const y = a.y ?? 930;
  const sit = a.sit ?? 0;
  const lean = a.lean ?? 0;
  const seed = a.seed ?? a.id.charCodeAt(0);
  const uid = a.id;
  const lookL = (a.look ?? 0) * flip; // look is authored in screen-space
  const walking = a.walk !== undefined && a.walk !== null;
  const bw = d.build;
  const ws = 58 * bw;
  const ww = 50 * bw;
  const armW = 33 * Math.sqrt(bw);
  const legW = 50 * Math.sqrt(bw);
  const gest = clamp(a.gest ?? 0, 0, 1);
  const emph = clamp(a.emph ?? 0, 0, 1);
  const vis: Viseme = a.vis ?? { open: a.mouth ?? 0, wide: 0, press: 0, teeth: (a.mouth ?? 0) > 0.2 ? 0.7 : 0, tongue: 0 };

  // expression
  const e1 = EXPR[a.expr ?? 'neutral'];
  const e2 = EXPR[a.expr2 ?? a.expr ?? 'neutral'];
  const k = a.exprK ?? 0;
  const ep: EP = {
    ba: lerp(e1.ba, e2.ba, k),
    bY: lerp(e1.bY, e2.bY, k),
    eye: lerp(e1.eye, e2.eye, k),
    mc: lerp(e1.mc, e2.mc, k),
    asym: k > 0.5 ? e2.asym : e1.asym,
  };
  // blink (with the occasional double blink)
  const cyc = (t * 0.29 + seed * 0.137) % 1;
  const dbl = (t * 0.29 + seed * 0.137 + 0.05) % 1;
  const bl = (c: number) => (c > 0.965 ? Math.sin(((c - 0.965) / 0.035) * Math.PI) : 0);
  const blink = Math.max(bl(cyc), Math.floor(t * 0.29 + seed * 0.137) % 3 === 0 ? bl(dbl) : 0);
  const breath = sway(t, 2.2, 3.4, seed);
  const weight = walking ? 0 : sway(t, 3.2, 7.5, seed); // slow weight shift
  const p = a.walk ?? 0;

  // world -> local (undoes lean + weight shift)
  const toLocal = (pt: V2): V2 => {
    const qx = ((pt[0] - a.x) / s) * flip;
    const qy = (pt[1] - y - sit) / s;
    const r = (-lean * Math.PI) / 180;
    const dx = qx;
    const dy = qy - HIP_Y;
    return [dx * Math.cos(r) - dy * Math.sin(r) - weight, dx * Math.sin(r) + dy * Math.cos(r) + HIP_Y];
  };
  const shY = -482 + breath * 0.35;
  const fShoulder: V2 = [ws - 10, shY];
  const rShoulder: V2 = [-(ws - 10), shY];

  // idle / gesture / walking arm targets
  const lift = clamp(gest * 2.4 - 0.25, 0, 1);
  const beat = 0.5 + 0.5 * Math.sin(t * 2.7 + seed);
  const beat2 = 0.5 + 0.5 * Math.sin(t * 2.1 + seed + 2);
  const swing = walking ? Math.sin(p) : 0;
  const talkingGesture = !walking && lift > 0.02;
  let idleF: V2 = [ws + 4 + sway(t, 2.5, 3.1, seed), -238 + sway(t, 2, 2.7, seed)];
  let idleR: V2 = [-(ws + 4) + sway(t, 2.5, 3.3, seed + 1), -238 + sway(t, 2, 2.9, seed + 2)];
  if (walking) {
    idleF = [ws + 6 - swing * 52, -258 + Math.abs(Math.cos(p)) * -10];
    idleR = [-(ws + 6) + swing * 52 * 0.9, -258 + Math.abs(Math.cos(p)) * -10];
  } else if (talkingGesture) {
    // gesture built from joint angles so the elbow always stays low and outward
    const arm = (sd: 1 | -1, amt: number, bt: number): V2 => {
      const al = ((20 + 7 * Math.sin(t * 1.3 + seed + sd)) * Math.PI) / 180;
      const ex = sd * (ws - 10) + sd * Math.sin(al) * UP;
      const ey = shY + Math.cos(al) * UP;
      const be = ((14 + amt * (40 + 85 * bt)) * Math.PI) / 180;
      return [ex + sd * Math.sin(be) * LO * 0.98, ey + Math.cos(be) * LO * 0.98];
    };
    idleF = arm(1, lift, beat);
    idleR = arm(-1, lift * lift * 0.8, beat2);
  }
  const jit = (n: number): V2 => [sway(t, 1.6, 2.3, seed + n), sway(t, 1.6, 1.9, seed + n + 4)];
  const jf = jit(1);
  const jr = jit(2);
  const hfL = a.hf ? toLocal(a.hf) : idleF;
  const hrL = a.hr ? toLocal(a.hr) : idleR;
  const hf: V2 = a.hf ? [hfL[0] + jf[0] * 0.4, hfL[1] + jf[1] * 0.4] : hfL;
  const hr: V2 = a.hr ? [hrL[0] + jr[0] * 0.4, hrL[1] + jr[1] * 0.4] : hrL;
  // hands that rest on a surface (counter / table / ledger) lie flat
  const flatF = !!a.hf && a.hf[1] > 585 && a.hf[1] < 668;
  const flatR = !!a.hr && a.hr[1] > 585 && a.hr[1] < 668;
  const raised = (v: V2) => v[1] < -330;
  const curlF = flatF ? 0.35 : raised(hf) || talkingGesture ? 0.15 + (1 - lift) * 0.3 : 0.85;
  const curlR = flatR ? 0.35 : raised(hr) ? 0.2 : talkingGesture ? 0.45 : 0.85;

  // legs
  const stride = 56;
  const phF = Math.sin(p);
  const phR = -Math.sin(p);
  const lf: V2 = walking ? [stride * phF, -40 * Math.max(0, Math.cos(p))] : [26, 0];
  const rf: V2 = walking ? [-stride * phF * 1 + 0, -40 * Math.max(0, -Math.cos(p))] : [-26, 0];
  const bob = walking ? -7 * Math.abs(Math.sin(p)) : breath * 0.15;
  const footRot = (ph: number, c: number) => (walking ? (c > 0 ? -9 * c : 16 * Math.max(0, -ph)) : 0);
  const dirF: 1 | -1 = 1;
  const dirR: 1 | -1 = walking ? 1 : -1;
  const hipSway = walking ? Math.sin(p) * 3 : weight * 0.35;
  const opacity = a.op ?? 1;
  const tShade = shade(d.shirt, 0.22);
  const torsoPath = `M ${-ws} -486 Q ${-ws - 4} -380 ${-ww} -272 L ${ww} -272 Q ${ws + 4} -380 ${ws} -486 Q ${ws * 0.55} -510 18 -514 L -18 -514 Q ${-ws * 0.55} -510 ${-ws} -486 Z`;
  const cid = `clip-${a.id}`;
  const headTilt = (a.tilt ?? 0) * flip + sway(t, 0.8, 5, seed) + (walking ? Math.sin(p * 2) * 0.8 : 0);
  const headDy = -590 + breath * 0.6 + (walking ? Math.cos(p * 2) * 2 : 0) + emph * 3;

  const rearArm = (
    <Arm sx={rShoulder[0]} sy={rShoulder[1]} tx={hr[0]} ty={hr[1]} side={-1} w={armW} d={d} front={false} flat={flatR} curl={curlR} />
  );
  const frontArm = (
    <Arm sx={fShoulder[0]} sy={fShoulder[1]} tx={hf[0]} ty={hf[1]} side={1} w={armW} d={d} front flat={flatF} curl={curlF} pen={a.pen} />
  );

  const defs = (
    <defs>
      <radialGradient id={`skin-${uid}`} cx="0.36" cy="0.34" r="0.85">
        <stop offset="0" stopColor={lite(d.skin, 0.14)} />
        <stop offset="0.55" stopColor={d.skin} />
        <stop offset="1" stopColor={mixHex(d.skin, d.skinShade, 0.9)} />
      </radialGradient>
      <radialGradient id={`iris-${uid}`} cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stopColor={lite(d.iris, 0.25)} />
        <stop offset="1" stopColor={d.iris} />
      </radialGradient>
      <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={lite(d.hair, 0.12)} />
        <stop offset="1" stopColor={d.hair} />
      </linearGradient>
      <linearGradient id={`shirt-${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={lite(d.shirt, 0.08)} />
        <stop offset="0.55" stopColor={d.shirt} />
        <stop offset="1" stopColor={shade(d.shirt, 0.3)} />
      </linearGradient>
    </defs>
  );

  const torso = (
    <g>
      <path d={torsoPath} fill={`url(#shirt-${uid})`} stroke={OUT} strokeWidth={3.8} strokeLinejoin="round" />
      <clipPath id={cid}>
        <path d={torsoPath} />
      </clipPath>
      <g clipPath={`url(#${cid})`}>
        <path d={`M ${ws * 0.3} -520 L ${ws + 20} -520 L ${ws + 20} -260 L ${ww * 0.4} -260 Q ${ws * 0.55} -380 ${ws * 0.3} -520 Z`} fill="#000" opacity={0.18} />
        {/* chest + waist folds */}
        <path d={`M ${-ws * 0.7} -440 q ${ws * 0.5} 16 ${ws * 1.4} 0 M ${-ww * 0.8} -330 q ${ww * 0.8} 14 ${ww * 1.6} -2 M ${-ww * 0.5} -300 q ${ww * 0.5} 8 ${ww} 0`} stroke={shade(d.shirt, 0.35)} strokeWidth={2.4} fill="none" opacity={0.4} />
        <path d={`M ${-ws + 8} -470 Q ${-ws + 12} -380 ${-ww + 8} -285`} stroke="#fff" strokeWidth={5} fill="none" opacity={0.07} />
        {!d.saree && <path d={`M 0 -500 L 0 -272`} stroke={OUT} strokeWidth={2.4} opacity={0.5} />}
        {!d.saree && [-440, -385, -330].map((yy) => <circle key={yy} cx={0} cy={yy} r={3.4} fill={lite(d.shirt, 0.25)} stroke={OUT} strokeWidth={1.4} />)}
        {!d.saree && <rect x={ws * 0.3} y={-440} width={ws * 0.5} height={ws * 0.5} rx={4} fill="none" stroke={shade(d.shirt, 0.4)} strokeWidth={2} opacity={0.5} />}
        {d.apron && (
          <g>
            <path d={`M ${-ww + 6} -430 L ${ww - 6} -430 L ${ww} -266 L ${-ww} -266 Z`} fill={d.apron} stroke={OUT} strokeWidth={3} opacity={0.97} />
            <path d={`M ${-ww + 10} -420 q ${ww} 10 ${ww * 2 - 20} 0`} stroke="#000" strokeWidth={2} fill="none" opacity={0.15} />
            <rect x={-26} y={-380} width={52} height={36} rx={4} fill="none" stroke={shade(d.apron, 0.3)} strokeWidth={2.4} />
            <path d={`M ${-ww + 6} -430 L ${ww - 6} -430 L ${ww - 6} -422 L ${-ww + 6} -422 Z`} fill="#000" opacity={0.08} />
            <path d={`M ${-ws * 0.7} -490 L ${-ww + 6} -430 M ${ws * 0.7} -490 L ${ww - 6} -430`} stroke={shade(d.apron, 0.35)} strokeWidth={4} />
          </g>
        )}
        {d.saree && (
          <g>
            <path d={`M ${-ws} -496 L ${-ws + 30} -496 L ${ws + 10} -300 L ${ws - 30} -270 L ${ws + 10} -270 L ${ws + 10} -420 Z`} fill={d.saree} />
            <path d={`M ${-ws + 26} -496 L ${ws + 10} -296`} stroke={d.border} strokeWidth={9} />
            <path d={`M ${-ws + 40} -470 L ${ws - 10} -330 M ${-ws + 60} -480 L ${ws} -350`} stroke={shade(d.saree, 0.35)} strokeWidth={2.4} opacity={0.5} />
          </g>
        )}
      </g>
      {/* belt */}
      {!d.saree && (
        <g>
          <rect x={-ww + 1} y={-288} width={(ww - 1) * 2} height={13} rx={3} fill={d.belt} stroke={OUT} strokeWidth={2.4} />
          <rect x={-8} y={-290} width={16} height={17} rx={3} fill="#c9a24a" stroke={OUT} strokeWidth={2} />
        </g>
      )}
      {/* neck + collar */}
      <g>
        <path d="M -17 -528 L -19 -496 Q 0 -478 19 -496 L 17 -528 Z" fill={d.skinShade} stroke={OUT} strokeWidth={3} />
        <path d="M -17 -528 L -19 -496 Q -8 -488 0 -487 L 0 -528 Z" fill={d.skin} opacity={0.5} />
        <path d="M -17 -528 Q 0 -516 17 -528 L 17 -520 Q 0 -508 -17 -520 Z" fill="#000" opacity={0.2} />
      </g>
      {!d.saree && <path d="M -26 -502 L 0 -466 L 26 -502 L 14 -510 L 0 -492 L -14 -510 Z" fill={lite(d.shirt, 0.14)} stroke={OUT} strokeWidth={3} strokeLinejoin="round" />}
      {d.saree && <path d="M -28 -502 Q 0 -470 28 -502 L 18 -510 Q 0 -488 -18 -510 Z" fill={d.border} stroke={OUT} strokeWidth={2.5} />}
    </g>
  );

  const head = (
    <g transform={`translate(${lookL * 3} ${headDy}) rotate(${headTilt} 0 80)`}>
      <Head d={d} ep={ep} vis={vis} look={lookL} lookY={a.lookY ?? 0} blink={blink} uid={uid} t={t} seed={seed} emph={emph} />
    </g>
  );

  const legs = d.saree ? (
    <g>
      <path
        d={`M ${-ww} -280 C ${-ww - 8} -150 ${-82 + sway(t, 2, 3, seed)} -60 ${-84 + (walking ? Math.sin(p) * 18 : 0)} -6 L ${84 + (walking ? Math.sin(p) * 18 : 0)} -6 C ${82} -60 ${ww + 8} -150 ${ww} -280 Z`}
        fill={d.saree}
        stroke={OUT}
        strokeWidth={3.5}
      />
      <path d={`M ${-84 + (walking ? Math.sin(p) * 18 : 0)} -6 L ${84 + (walking ? Math.sin(p) * 18 : 0)} -6 L ${82} -30 L ${-82} -30 Z`} fill={d.border} opacity={0.9} />
      <path d="M -30 -270 L -44 -10 M 0 -270 L 0 -12 M 30 -270 L 44 -10 M -15 -270 L -22 -12 M 15 -270 L 22 -12" stroke={shade(d.saree ?? '#000', 0.3)} strokeWidth={3} fill="none" opacity={0.45} />
      <path d={`M ${ww - 8} -280 C ${ww} -150 80 -60 82 -6 L 84 -6 C 86 -60 ${ww + 12} -150 ${ww + 2} -280 Z`} fill="#000" opacity={0.15} />
      <ellipse cx={-30 + (walking ? Math.sin(p) * 14 : 0)} cy={-4} rx={26} ry={9} fill={d.shoes} />
      <ellipse cx={34 - (walking ? Math.sin(p) * 14 : 0)} cy={-4} rx={26} ry={9} fill={d.shoes} />
    </g>
  ) : (
    <g>
      <Leg hx0={-22} hy0={-276} tx={rf[0]} ty={rf[1] - ANKLE} w={legW} pants={d.pants} shoes={d.shoes} dir={dirR} rot={footRot(phR, -Math.cos(p))} front={false} cuffC={d.pants} />
      <Leg hx0={22} hy0={-276} tx={lf[0]} ty={lf[1] - ANKLE} w={legW} pants={d.pants} shoes={d.shoes} dir={dirF} rot={footRot(phF, Math.cos(p))} front cuffC={d.pants} />
      <rect x={-ww + 2} y={-300} width={(ww - 2) * 2} height={46} rx={14} fill={d.pants} stroke={OUT} strokeWidth={3.5} />
    </g>
  );

  const shadow = (
    <g transform={`translate(0 ${-sit})`}>
      <ellipse cx={0} cy={6} rx={104 * bw} ry={16} fill="#000" opacity={0.2} />
      <ellipse cx={0} cy={5} rx={70 * bw} ry={10} fill="#000" opacity={0.2} />
    </g>
  );

  return (
    <g transform={`translate(${a.x} ${y + sit}) scale(${flip * s} ${s})`} opacity={opacity}>
      {defs}
      <g transform={`translate(0 ${bob})`}>
        {part !== 'arms' && shadow}
        {part !== 'arms' && <g transform={`translate(${hipSway} 0)`}>{legs}</g>}
        <g transform={`rotate(${lean} 0 ${HIP_Y})`}>
          <g transform={`translate(${weight} 0)`}>
            {part === 'arms' ? (
              <>
                {rearArm}
                {frontArm}
              </>
            ) : (
              <>
                {part === 'all' && rearArm}
                <g transform={`translate(0 ${-(-272)}) scale(1 ${1 + breath * 0.0016}) translate(0 ${-272})`}>{torso}</g>
                {head}
                {part === 'all' && frontArm}
              </>
            )}
          </g>
        </g>
      </g>
      <g style={{ display: 'none' }}>
        <circle r={0} fill={tShade} />
      </g>
    </g>
  );
};
