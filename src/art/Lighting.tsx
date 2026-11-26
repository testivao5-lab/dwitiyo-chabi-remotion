import React from 'react';
import { HEIGHT, WIDTH } from '../lib/story';
import { hash1 } from '../lib/life';
import { clamp } from '../lib/anim';
import type { Pal } from './palette';

/** A lighting rig: where the key light comes from and what colour it has. */
export interface LightRig {
  kind: 'shop' | 'street' | 'night' | 'day';
  key: string; // key light colour
  fill: string; // shadow-side / ambient colour
  dir: number; // -1 = key from the left, +1 = from the right
  sx: number; // light source (screen space)
  sy: number;
  angle: number; // beam direction (deg, 90 = straight down)
  warm: boolean;
  strength: number;
}

export function rigFor(bg: string, pal: Pal, dusk?: boolean): LightRig {
  const warm = parseInt(pal.tint.slice(1, 3), 16) > parseInt(pal.tint.slice(5, 7), 16);
  if (bg === 'street')
    return { kind: 'street', key: '#ffd08a', fill: '#6a7ba8', dir: -1, sx: 330, sy: 70, angle: 62, warm: true, strength: 1 };
  if (bg === 'home' || bg === 'room')
    return { kind: 'night', key: '#a9c2ff', fill: '#ffb766', dir: 1, sx: 1480, sy: 40, angle: 112, warm: false, strength: 1 };
  if (dusk)
    return { kind: 'shop', key: '#ffd89a', fill: '#4b5a8a', dir: -1, sx: 560, sy: 120, angle: 90, warm: true, strength: 1.1 };
  return warm
    ? { kind: 'shop', key: '#ffe0a6', fill: '#6e4a3a', dir: -1, sx: 250, sy: -80, angle: 66, warm: true, strength: 1 }
    : { kind: 'day', key: '#eaf5ee', fill: '#4d6a70', dir: -1, sx: 230, sy: -80, angle: 68, warm: false, strength: 0.9 };
}

/** SVG filter that paints a thin rim light on the key-light side of a character
 *  (gives the flat vector body volume and separates it from the background). */
export const RimDefs: React.FC<{ id: string; rig: LightRig }> = ({ id, rig }) => (
  <defs>
    <filter id={`rim${id}`} x="-8%" y="-4%" width="116%" height="108%" colorInterpolationFilters="sRGB">
      <feOffset in="SourceAlpha" dx={-rig.dir * 5} dy={4} result="o" />
      <feComposite in="SourceAlpha" in2="o" operator="out" result="edge" />
      <feGaussianBlur in="edge" stdDeviation="1.6" result="eb" />
      <feFlood floodColor={rig.key} floodOpacity={0.5 * rig.strength} result="fl" />
      <feComposite in="fl" in2="eb" operator="in" result="rim" />
      <feComposite in="rim" in2="SourceAlpha" operator="in" result="rimIn" />
      <feOffset in="SourceAlpha" dx={rig.dir * 4} dy={0} result="o2" />
      <feComposite in="SourceAlpha" in2="o2" operator="out" result="edge2" />
      <feGaussianBlur in="edge2" stdDeviation="2" result="eb2" />
      <feFlood floodColor={rig.fill} floodOpacity={0.4} result="fl2" />
      <feComposite in="fl2" in2="eb2" operator="in" result="bounce" />
      <feComposite in="bounce" in2="SourceAlpha" operator="in" result="bounceIn" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="bounceIn" />
        <feMergeNode in="rimIn" />
      </feMerge>
    </filter>
  </defs>
);

/** painted-paper / plaster texture: baked bump-lit noise, blended soft-light over everything */
export const TextureDefs: React.FC = () => (
  <defs>
    <filter id="paper" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.011 0.014" numOctaves="4" seed="7" result="n" />
      <feDiffuseLighting in="n" lightingColor="#fff" surfaceScale="2.6" diffuseConstant="1.05" result="lit">
        <feDistantLight azimuth="235" elevation="58" />
      </feDiffuseLighting>
    </filter>
  </defs>
);

export const Texture: React.FC = () => (
  <g style={{ mixBlendMode: 'soft-light' }} opacity={0.24} pointerEvents="none">
    <rect width={WIDTH} height={HEIGHT} filter="url(#paper)" />
  </g>
);

/** screen-blended light: beams, source glow, lens streak, floor pool, volumetric dust */
export const LightLayer: React.FC<{ id: number; t: number; rig: LightRig; lamp?: boolean }> = ({ id, t, rig, lamp }) => {
  const { sx, sy, angle, key } = rig;
  const a0 = (angle * Math.PI) / 180;
  const beams = [
    { off: -26, w: 150, o: 0.16 },
    { off: -11, w: 90, o: 0.2 },
    { off: 4, w: 190, o: 0.12 },
    { off: 17, w: 80, o: 0.18 },
    { off: 31, w: 130, o: 0.1 },
  ];
  const len = 1700;
  const flick = (k: number) => 0.8 + 0.2 * Math.sin(t * (0.5 + k * 0.17) + k * 2.1) + 0.04 * Math.sin(t * 7.3 + k);
  const beamPoly = (b: { off: number; w: number }) => {
    const ang = a0 + (b.off * Math.PI) / 180;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const nx = -dy;
    const ny = dx;
    const w0 = b.w * 0.15;
    const w1 = b.w * 2.2;
    return `${sx + nx * w0},${sy + ny * w0} ${sx + dx * len + nx * w1},${sy + dy * len + ny * w1} ${sx + dx * len - nx * w1},${sy + dy * len - ny * w1} ${sx - nx * w0},${sy - ny * w0}`;
  };
  const dust = Array.from({ length: 46 }).map((_, i) => {
    const layer = i % 3;
    const sp = 3 + layer * 5;
    const x0 = hash1(i * 3.1 + id) * WIDTH;
    const y0 = hash1(i * 7.7 + id) * HEIGHT;
    const x = (x0 + t * sp * (0.6 + hash1(i)) + Math.sin(t * 0.35 + i) * 26 + WIDTH * 4) % WIDTH;
    const y = (y0 - t * (2 + layer * 2.5) + Math.sin(t * 0.5 + i * 1.7) * 14 + HEIGHT * 400) % HEIGHT;
    const px = x - sx;
    const py = y - sy;
    const dist = Math.abs(px * Math.sin(a0) - py * Math.cos(a0));
    const along = px * Math.cos(a0) + py * Math.sin(a0);
    const inb = along > 0 ? Math.exp(-Math.pow(dist / (260 + along * 0.25), 2)) : 0;
    const tw = 0.6 + 0.4 * Math.sin(t * (1 + layer) + i * 3.3);
    return { x, y, r: 1.2 + layer * 1.3, o: (0.05 + 0.6 * inb) * tw * (layer === 0 ? 0.7 : 1), layer };
  });
  return (
    <g style={{ mixBlendMode: 'screen' }} pointerEvents="none">
      <defs>
        <linearGradient id={`beam${id}`} gradientUnits="userSpaceOnUse" x1={sx} y1={sy} x2={sx + Math.cos(a0) * len} y2={sy + Math.sin(a0) * len}>
          <stop offset="0" stopColor={key} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={key} stopOpacity={0.35} />
          <stop offset="1" stopColor={key} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`src${id}`}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
          <stop offset="0.18" stopColor={key} stopOpacity={0.55} />
          <stop offset="1" stopColor={key} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`pool${id}`}>
          <stop offset="0" stopColor={key} stopOpacity={0.45} />
          <stop offset="1" stopColor={key} stopOpacity={0} />
        </radialGradient>
        <filter id={`bs${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={`db${id}`} x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      <g filter={`url(#bs${id})`}>
        {beams.map((b, i) => (
          <polygon key={i} points={beamPoly(b)} fill={`url(#beam${id})`} opacity={b.o * 0.6 * flick(i) * rig.strength} />
        ))}
      </g>
      <circle cx={sx} cy={sy} r={460} fill={`url(#src${id})`} opacity={0.28 * flick(9) * rig.strength} />
      {rig.kind === 'street' && (
        <g opacity={0.16 * flick(3)}>
          <ellipse cx={sx} cy={sy} rx={1100} ry={9} fill={key} filter={`url(#bs${id})`} />
          <circle cx={sx + 380} cy={sy + 280} r={46} fill={key} opacity={0.35} />
          <circle cx={sx + 560} cy={sy + 400} r={24} fill="#ff9d6a" opacity={0.4} />
          <circle cx={sx + 760} cy={sy + 520} r={64} fill="#fff1c9" opacity={0.2} />
        </g>
      )}
      <ellipse cx={rig.kind === 'night' ? 1180 : 760} cy={930} rx={620} ry={120} fill={`url(#pool${id})`} opacity={0.3 * flick(5) * rig.strength} />
      {lamp && <circle cx={960} cy={560} r={520} fill={`url(#src${id})`} opacity={0.35 * flick(2)} />}
      {dust.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#fff4d8" opacity={clamp(d.o, 0, 0.8)} filter={d.layer === 2 ? `url(#db${id})` : undefined} />
      ))}
    </g>
  );
};

/** multiply-blended shade: ceiling falloff, floor occlusion, edge darkening, colour bounce */
export const ShadeLayer: React.FC<{ id: number; rig: LightRig; t: number }> = ({ id, rig, t }) => (
  <g pointerEvents="none">
    <defs>
      <linearGradient id={`top${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#05060d" stopOpacity={rig.kind === 'street' ? 0.12 : 0.5} />
        <stop offset="0.28" stopColor="#05060d" stopOpacity={0} />
      </linearGradient>
      <linearGradient id={`bot${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.62" stopColor="#0a0605" stopOpacity={0} />
        <stop offset="1" stopColor="#0a0605" stopOpacity={0.45} />
      </linearGradient>
      <linearGradient id={`side${id}`} x1={rig.dir < 0 ? 1 : 0} y1="0" x2={rig.dir < 0 ? 0 : 1} y2="0">
        <stop offset="0" stopColor={rig.fill} stopOpacity={0.34} />
        <stop offset="0.45" stopColor={rig.fill} stopOpacity={0} />
      </linearGradient>
      <radialGradient id={`bounce${id}`} cx={rig.dir < 0 ? '30%' : '70%'} cy="100%" r="70%">
        <stop offset="0" stopColor={rig.key} stopOpacity={0.18} />
        <stop offset="1" stopColor={rig.key} stopOpacity={0} />
      </radialGradient>
    </defs>
    <g style={{ mixBlendMode: 'multiply' }}>
      <rect width={WIDTH} height={HEIGHT} fill={`url(#top${id})`} />
      <rect width={WIDTH} height={HEIGHT} fill={`url(#bot${id})`} />
      <rect width={WIDTH} height={HEIGHT} fill={`url(#side${id})`} />
    </g>
    <g style={{ mixBlendMode: 'soft-light' }}>
      <rect width={WIDTH} height={HEIGHT} fill={`url(#bounce${id})`} opacity={0.9 + 0.1 * Math.sin(t)} />
    </g>
  </g>
);

/** halation: warm glow bleeding around the brightest region of the frame */
export const Halation: React.FC<{ rig: LightRig; id: number }> = ({ rig, id }) => (
  <g style={{ mixBlendMode: 'screen' }} pointerEvents="none" opacity={0.2}>
    <defs>
      <radialGradient id={`hal${id}`} cx={`${(rig.sx / WIDTH) * 100}%`} cy={`${Math.max(0, rig.sy / HEIGHT) * 100}%`} r="85%">
        <stop offset="0" stopColor={rig.key} stopOpacity={0.22} />
        <stop offset="0.6" stopColor={rig.key} stopOpacity={0.04} />
        <stop offset="1" stopColor={rig.key} stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={WIDTH} height={HEIGHT} fill={`url(#hal${id})`} />
  </g>
);
