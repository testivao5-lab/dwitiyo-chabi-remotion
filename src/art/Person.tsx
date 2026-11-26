import React from 'react';
import { clamp, ik, lerp, mixHex, sway, V2 } from '../lib/anim';

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
}

export const CHARS: Record<CharId, CharDef> = {
  B: {
    skin: '#c08560',
    skinShade: '#a56d4c',
    hair: '#1d1613',
    hairStyle: 'comb',
    shirt: '#6f7c55',
    pants: '#2f3037',
    shoes: '#3b2b22',
    sleeve: 'long',
    build: 1.12,
    height: 1,
    stubble: true,
  },
  M: {
    skin: '#c58b62',
    skinShade: '#a8714f',
    hair: '#241a15',
    hairStyle: 'messy',
    shirt: '#4f8089',
    pants: '#2a2e3a',
    shoes: '#33271f',
    sleeve: 'rolled',
    build: 0.94,
    height: 0.99,
  },
  Mo: {
    skin: '#b57a54',
    skinShade: '#9a6446',
    hair: '#2a2420',
    hairStyle: 'saree',
    shirt: '#35505a',
    pants: '#000',
    shoes: '#2a211b',
    sleeve: 'rolled',
    build: 0.98,
    height: 0.93,
    saree: '#8c4a45',
    border: '#d3a64c',
  },
  O: {
    skin: '#b27851',
    skinShade: '#976247',
    hair: '#1c1613',
    hairStyle: 'cap',
    shirt: '#b99445',
    pants: '#34384a',
    shoes: '#3a2c24',
    sleeve: 'long',
    build: 1.02,
    height: 1.0,
    apron: '#e6e0d0',
    mustache: true,
  },
  C: {
    skin: '#b98258',
    skinShade: '#9d6a49',
    hair: '#2c2623',
    hairStyle: 'short',
    shirt: '#a2b0be',
    pants: '#85795f',
    shoes: '#3a2c24',
    sleeve: 'rolled',
    build: 1.2,
    height: 0.98,
    mustache: true,
    grey: true,
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
  mouth?: number;
  op?: number;
  z?: 'back' | 'front';
  seed?: number;
}

const OUT = '#2b1d17';
const UP = 150;
const LO = 140;
const HIP_Y = -272;

function Limb({
  sx,
  sy,
  tx,
  ty,
  l1,
  l2,
  bend,
  w,
  c1,
  c2,
  hand,
  skin,
  foot,
  shoe,
}: {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  l1: number;
  l2: number;
  bend: 1 | -1;
  w: number;
  c1: string;
  c2: string;
  hand?: boolean;
  skin?: string;
  foot?: boolean;
  shoe?: string;
}) {
  const { ex, ey, hx, hy } = ik(sx, sy, tx, ty, l1, l2, bend);
  const ang = (Math.atan2(hy - ey, hx - ex) * 180) / Math.PI;
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <polyline points={`${sx},${sy} ${ex},${ey} ${hx},${hy}`} stroke={OUT} strokeWidth={w + 8} />
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={c1} strokeWidth={w} />
      <line x1={ex} y1={ey} x2={hx} y2={hy} stroke={c2} strokeWidth={w - 4} />
      <circle cx={ex} cy={ey} r={(w - 2) / 2} fill={c1} stroke="none" />
      {hand && (
        <g transform={`translate(${hx} ${hy}) rotate(${ang - 90})`}>
          <ellipse cx={0} cy={14} rx={15} ry={19} fill={skin} stroke={OUT} strokeWidth={3.5} />
          <path d="M 9 8 q 12 6 8 20" stroke={OUT} strokeWidth={3} />
        </g>
      )}
      {foot && (
        <ellipse
          cx={hx + 14}
          cy={hy + 4}
          rx={34}
          ry={15}
          fill={shoe}
          stroke={OUT}
          strokeWidth={3.5}
        />
      )}
    </g>
  );
}

function Head({
  d,
  ep,
  mouthOpen,
  look,
  lookY,
  blink,
}: {
  d: CharDef;
  ep: EP;
  mouthOpen: number;
  look: number;
  lookY: number;
  blink: number;
}) {
  const hl = look * 13;
  const hy = lookY * 6;
  const eyeOpen = clamp(ep.eye * (1 - blink), 0.04, 1.4);
  const mc = ep.mc;
  const mw = 20 + mc * 2;
  const my = 36;
  const cy = my - mc * 7; // corner y
  const ctrl = my + mc * 9 + mouthOpen * 4;
  const lowCtrl = ctrl + mouthOpen * 24 + 3;
  const brow = (side: -1 | 1) => {
    const asym = ep.asym && side === 1 ? 1 : 0;
    const inner = -27 + ep.bY + ep.ba * 7 - asym * 3;
    const outer = -27 + ep.bY - ep.ba * 5 - asym * 3;
    const xi = side * 9 + hl;
    const xo = side * 34 + hl;
    return (
      <path
        d={`M ${xi} ${inner} Q ${(xi + xo) / 2} ${Math.min(inner, outer) - 5} ${xo} ${outer}`}
        stroke={d.hairStyle === 'saree' ? '#2a211c' : d.hair}
        strokeWidth={6.5}
        fill="none"
        strokeLinecap="round"
      />
    );
  };
  const eye = (side: -1 | 1) => {
    const ex = side * 21 + hl;
    return (
      <g transform={`translate(${ex} ${-3 + hy})`}>
        <ellipse rx={11} ry={8.5 * eyeOpen} fill="#f3ece0" stroke={OUT} strokeWidth={2.5} />
        <circle cx={look * 4.5} cy={lookY * 3} r={5.2 * Math.min(1, eyeOpen + 0.2)} fill="#2a1a12" />
        <circle cx={look * 4.5 + 1.8} cy={lookY * 3 - 1.8} r={1.5} fill="#fff" opacity={0.85} />
        <path
          d={`M -12 ${-8.5 * eyeOpen + 1} Q 0 ${-12 * eyeOpen - 1} 12 ${-8.5 * eyeOpen + 1}`}
          stroke={OUT}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  };

  const hairBack =
    d.hairStyle === 'saree' ? (
      <path
        d="M -60 30 C -72 -60 -34 -92 0 -92 C 34 -92 72 -60 60 30 L 40 40 L -40 40 Z"
        fill={d.saree}
        stroke={OUT}
        strokeWidth={3.5}
      />
    ) : null;

  let hairFront: React.ReactNode = null;
  switch (d.hairStyle) {
    case 'comb':
      hairFront = (
        <g fill={d.hair} stroke={OUT} strokeWidth={3}>
          <path d="M -53 -6 C -62 -58 -32 -84 6 -82 C 44 -82 62 -56 53 -4 C 48 -30 38 -42 18 -48 C -8 -40 -34 -36 -53 -6 Z" />
          <path d="M 4 -80 C -2 -66 -8 -56 -12 -46" fill="none" stroke="#3a2d26" strokeWidth={2.5} />
        </g>
      );
      break;
    case 'messy':
      hairFront = (
        <path
          d="M -52 -4 C -62 -50 -44 -72 -30 -78 L -26 -90 L -14 -78 L -6 -94 L 4 -80 L 16 -92 L 22 -78 L 36 -84 L 40 -70 C 60 -60 60 -30 52 -4 C 46 -26 36 -38 16 -44 C -8 -34 -34 -34 -52 -4 Z"
          fill={d.hair}
          stroke={OUT}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      );
      break;
    case 'short':
      hairFront = (
        <g fill={d.hair} stroke={OUT} strokeWidth={3}>
          <path d="M -53 -4 C -62 -56 -34 -80 2 -80 C 42 -80 62 -54 53 -2 C 50 -22 42 -36 24 -42 C -4 -36 -36 -34 -53 -4 Z" />
          {d.grey && <path d="M -52 -4 C -54 8 -50 14 -48 16 L -45 -6 Z M 52 -4 C 54 8 50 14 48 16 L 45 -6 Z" fill="#8a8680" />}
        </g>
      );
      break;
    case 'cap':
      hairFront = (
        <g stroke={OUT} strokeWidth={3} strokeLinejoin="round">
          <path d="M -54 -14 C -58 -70 -20 -88 6 -86 C 40 -86 62 -64 54 -14 Z" fill="#3a4a5a" />
          <path d="M 30 -26 Q 78 -28 84 -14 Q 60 -10 30 -12 Z" fill="#2f3d4b" />
          <path d="M -54 -14 L 54 -14" fill="none" />
        </g>
      );
      break;
    case 'saree':
      hairFront = (
        <path
          d="M -54 8 C -60 -46 -34 -74 0 -74 C 34 -74 60 -46 54 8 C 52 -22 38 -44 0 -46 C -38 -44 -52 -22 -54 8 Z"
          fill={d.saree}
          stroke={OUT}
          strokeWidth={3}
        />
      );
      break;
  }

  return (
    <g>
      {hairBack}
      {/* ears */}
      <ellipse cx={-50 + hl * 0.4} cy={2} rx={8} ry={13} fill={d.skin} stroke={OUT} strokeWidth={3} />
      <ellipse cx={50 + hl * 0.4} cy={2} rx={8} ry={13} fill={d.skin} stroke={OUT} strokeWidth={3} />
      {/* face */}
      <path
        d="M -50 -5 C -50 -45 -28 -62 0 -62 C 28 -62 50 -45 50 -5 C 50 36 28 62 0 64 C -28 62 -50 36 -50 -5 Z"
        fill={d.skin}
        stroke={OUT}
        strokeWidth={3.5}
      />
      {/* face shade (light from the left) */}
      <path
        d="M 50 -5 C 50 36 28 62 0 64 C 22 56 36 30 36 -4 C 36 -30 28 -48 12 -58 C 36 -52 50 -34 50 -5 Z"
        fill={d.skinShade}
        opacity={0.55}
      />
      {d.stubble && (
        <path
          d="M -46 14 C -40 52 -20 62 0 62 C 20 62 40 52 46 14 C 36 34 20 42 0 42 C -20 42 -36 34 -46 14 Z"
          fill="#2a1d18"
          opacity={0.38}
        />
      )}
      {hairFront}
      {/* features */}
      {brow(-1)}
      {brow(1)}
      {eye(-1)}
      {eye(1)}
      <path
        d={`M ${hl * 1.1} 4 Q ${hl * 1.1 + 8 + look * 3} 20 ${hl * 1.1 + 2} 24 Q ${hl * 1.1 - 4} 26 ${hl * 1.1 - 8} 22`}
        stroke={OUT}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={0.8}
      />
      {d.mustache && (
        <path
          d={`M ${hl - 24} 27 Q ${hl - 10} 20 ${hl} 27 Q ${hl + 10} 20 ${hl + 24} 27 Q ${hl + 10} 33 ${hl} 30 Q ${hl - 10} 33 ${hl - 24} 27 Z`}
          fill={d.grey ? '#5a5652' : d.hair}
        />
      )}
      {/* mouth */}
      <g transform={`translate(${hl * 0.9} 0)`}>
        {mouthOpen > 0.1 ? (
          <path
            d={`M ${-mw} ${cy} Q 0 ${ctrl - 5} ${mw} ${cy} Q 0 ${lowCtrl} ${-mw} ${cy} Z`}
            fill="#5a2424"
            stroke={OUT}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        ) : (
          <path
            d={`M ${-mw} ${cy} Q 0 ${ctrl} ${mw} ${cy}`}
            stroke={OUT}
            strokeWidth={3.6}
            fill="none"
            strokeLinecap="round"
          />
        )}
      </g>
      {/* cheek blush */}
      <ellipse cx={-30 + hl} cy={22} rx={9} ry={5} fill="#d97a6a" opacity={ep.mc > 0.4 ? 0.28 : 0.12} />
      <ellipse cx={30 + hl} cy={22} rx={9} ry={5} fill="#d97a6a" opacity={ep.mc > 0.4 ? 0.28 : 0.12} />
    </g>
  );
}

export const Person: React.FC<{ a: ActorSpec; t: number }> = ({ a, t }) => {
  const d = CHARS[a.id];
  const s = (a.scale ?? 1) * d.height;
  const flip = a.flip ? -1 : 1;
  const y = a.y ?? 930;
  const sit = a.sit ?? 0;
  const lean = a.lean ?? 0;
  const seed = a.seed ?? a.id.charCodeAt(0);
  const lookL = (a.look ?? 0) * flip; // look is authored in screen-space
  const walking = a.walk !== undefined && a.walk !== null;
  const bw = d.build;
  const ws = 58 * bw;
  const ww = 50 * bw;
  const armW = 31 * Math.sqrt(bw);
  const legW = 46 * Math.sqrt(bw);

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
  // blink
  const cyc = (t * 0.29 + seed * 0.137) % 1;
  const blink = cyc > 0.965 ? Math.sin(((cyc - 0.965) / 0.035) * Math.PI) : 0;
  const breath = sway(t, 2.2, 3.4, seed);

  // world -> local
  const toLocal = (p: V2): V2 => {
    const qx = ((p[0] - a.x) / s) * flip;
    const qy = (p[1] - y - sit) / s;
    const r = (-lean * Math.PI) / 180;
    const dx = qx;
    const dy = qy - HIP_Y;
    return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r) + HIP_Y];
  };
  const fShoulder: V2 = [ws - 10, -482 + breath * 0.3];
  const rShoulder: V2 = [-(ws - 10), -482 + breath * 0.3];
  const idleF: V2 = [ws + 14 + sway(t, 3, 3.1, seed), -240 + sway(t, 3, 2.7, seed)];
  const idleR: V2 = [-(ws + 14) + sway(t, 3, 3.3, seed + 1), -240 + sway(t, 3, 2.9, seed + 2)];
  const hf = a.hf ? toLocal(a.hf) : idleF;
  const hr = a.hr ? toLocal(a.hr) : idleR;

  // legs
  const p = a.walk ?? 0;
  const stride = 54;
  const lf: V2 = walking ? [stride * Math.sin(p), -34 * Math.max(0, Math.cos(p))] : [24, 0];
  const rf: V2 = walking ? [-stride * Math.sin(p), -34 * Math.max(0, -Math.cos(p))] : [-26, 0];
  const bob = walking ? -6 * Math.abs(Math.sin(p)) : 0;
  const tShade = mixHex(d.shirt, '#000000', 0.28);
  const pantsShade = mixHex(d.pants, '#000000', 0.2);
  const opacity = a.op ?? 1;
  const sleeveC = d.sleeve === 'long' ? d.shirt : d.skin;
  const cid = `clip-${a.id}`;

  const torsoPath = `M ${-ws} -490 Q ${-ws - 6} -380 ${-ww} -272 L ${ww} -272 Q ${ws + 6} -380 ${ws} -490 Q 0 -516 ${-ws} -490 Z`;

  return (
    <g
      transform={`translate(${a.x} ${y + sit}) scale(${flip * s} ${s})`}
      opacity={opacity}
    >
      {/* ground shadow */}
      <ellipse cx={0} cy={6} rx={96 * bw} ry={15} fill="#000" opacity={0.26} transform={`translate(0 ${-sit})`} />
      <g transform={`translate(0 ${bob})`}>
        {/* legs / skirt */}
        {d.saree ? (
          <g>
            <path
              d={`M ${-ww} -280 C ${-ww - 8} -150 ${-82 + sway(t, 2, 3, seed)} -60 ${-84 + (walking ? Math.sin(p) * 18 : 0)} -6 L ${84 + (walking ? Math.sin(p) * 18 : 0)} -6 C ${82} -60 ${ww + 8} -150 ${ww} -280 Z`}
              fill={d.saree}
              stroke={OUT}
              strokeWidth={3.5}
            />
            <path
              d={`M ${-84 + (walking ? Math.sin(p) * 18 : 0)} -6 L ${84 + (walking ? Math.sin(p) * 18 : 0)} -6 L ${82} -30 L ${-82} -30 Z`}
              fill={d.border}
              opacity={0.9}
            />
            <path d="M -30 -270 L -44 -10 M 0 -270 L 0 -12 M 30 -270 L 44 -10" stroke={mixHex(d.saree, '#000', 0.3)} strokeWidth={3} fill="none" opacity={0.5} />
            <ellipse cx={-30 + (walking ? Math.sin(p) * 14 : 0)} cy={-4} rx={26} ry={9} fill={d.shoes} />
            <ellipse cx={34 - (walking ? Math.sin(p) * 14 : 0)} cy={-4} rx={26} ry={9} fill={d.shoes} />
          </g>
        ) : (
          <g>
            <Limb sx={-24} sy={-274} tx={rf[0]} ty={rf[1] - 18} l1={140} l2={134} bend={-1} w={legW} c1={pantsShade} c2={pantsShade} foot shoe={d.shoes} />
            <Limb sx={24} sy={-274} tx={lf[0]} ty={lf[1] - 18} l1={140} l2={134} bend={-1} w={legW} c1={d.pants} c2={d.pants} foot shoe={d.shoes} />
            <rect x={-ww + 2} y={-300} width={(ww - 2) * 2} height={46} rx={14} fill={d.pants} stroke={OUT} strokeWidth={3.5} />
          </g>
        )}

        {/* upper body (leans around hip) */}
        <g transform={`rotate(${lean} 0 ${HIP_Y})`}>
          {/* rear arm */}
          <Limb sx={rShoulder[0]} sy={rShoulder[1]} tx={hr[0]} ty={hr[1]} l1={UP} l2={LO} bend={1} w={armW} c1={tShade} c2={d.sleeve === 'long' ? tShade : d.skinShade} hand skin={d.skinShade} />
          {/* torso */}
          <path d={torsoPath} fill={d.saree ? d.shirt : d.shirt} stroke={OUT} strokeWidth={3.8} strokeLinejoin="round" />
          <clipPath id={cid}>
            <path d={torsoPath} />
          </clipPath>
          <g clipPath={`url(#${cid})`}>
            <path d={`M ${ws * 0.25} -520 L ${ws + 20} -520 L ${ws + 20} -260 L ${ww * 0.35} -260 Q ${ws * 0.5} -380 ${ws * 0.25} -520 Z`} fill="#000" opacity={0.2} />
            {!d.saree && <path d={`M 0 -500 L 0 -272`} stroke={OUT} strokeWidth={2.5} opacity={0.55} />}
            {!d.saree && [-440, -385, -330].map((yy) => <circle key={yy} cx={0} cy={yy} r={3.2} fill={OUT} opacity={0.55} />)}
            {d.apron && <path d={`M ${-ww + 6} -430 L ${ww - 6} -430 L ${ww} -266 L ${-ww} -266 Z`} fill={d.apron} stroke={OUT} strokeWidth={3} opacity={0.96} />}
            {d.saree && (
              <g>
                <path d={`M ${-ws} -496 L ${-ws + 30} -496 L ${ws + 10} -300 L ${ws - 30} -270 L ${ws + 10} -270 L ${ws + 10} -420 Z`} fill={d.saree} />
                <path d={`M ${-ws + 26} -496 L ${ws + 10} -296`} stroke={d.border} strokeWidth={9} />
              </g>
            )}
          </g>
          {/* neck + collar */}
          <path d={`M -17 -526 L -19 -496 Q 0 -480 19 -496 L 17 -526 Z`} fill={d.skinShade} stroke={OUT} strokeWidth={3} />
          {!d.saree && <path d={`M -26 -500 L 0 -466 L 26 -500 L 14 -508 L 0 -490 L -14 -508 Z`} fill={mixHex(d.shirt, '#ffffff', 0.12)} stroke={OUT} strokeWidth={3} strokeLinejoin="round" />}
          {/* head */}
          <g transform={`translate(${lookL * 3} ${-590 + breath * 0.6}) rotate(${(a.tilt ?? 0) * flip + sway(t, 0.7, 5, seed)} 0 80)`}>
            <Head d={d} ep={ep} mouthOpen={a.mouth ?? 0} look={lookL} lookY={a.lookY ?? 0} blink={blink} />
          </g>
          {/* front arm */}
          <Limb sx={fShoulder[0]} sy={fShoulder[1]} tx={hf[0]} ty={hf[1]} l1={UP} l2={LO} bend={1} w={armW} c1={d.shirt} c2={sleeveC} hand skin={d.skin} />
        </g>
      </g>
      {/* keep sleeveC referenced for tree-shaking clarity */}
      <g style={{ display: 'none' }}>
        <circle r={0} fill={sleeveC} />
      </g>
    </g>
  );
};
