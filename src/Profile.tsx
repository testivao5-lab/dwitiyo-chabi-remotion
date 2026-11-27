import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Person, ActorSpec } from './art/Person';

/* YouTube profile picture — 900×900, head-and-shoulders of the narrator on a
   night-sky brand background (crescent moon + stars, like the channel art).
   Render: npx remotion still src/index.ts Profile out.png                  */

const W = 900;
const H = 900;
const T = 4;

const STARS: [number, number, number][] = [
  [70, 120, 3], [150, 60, 2], [240, 150, 2.5], [320, 70, 3], [420, 130, 2],
  [520, 55, 2.5], [610, 140, 3], [700, 80, 2], [790, 160, 2.5], [850, 90, 3],
  [110, 260, 2], [210, 330, 2.5], [760, 280, 2], [830, 350, 2.5], [60, 420, 2],
  [870, 450, 2], [180, 40, 2], [480, 30, 2], [650, 40, 2.5], [380, 200, 1.8],
  [560, 220, 1.8], [300, 250, 1.6], [720, 200, 1.8],
];

export const Profile: React.FC = () => {
  const b: ActorSpec = {
    id: 'B', x: 450, expr: 'smile', look: 0.1, lookY: -0.05, z: 'front', light: 1,
  };
  const cx = 450;
  const cy = 395;
  const z = 1.85;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0d1528' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="pfpSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a1122" />
            <stop offset="0.55" stopColor="#152244" />
            <stop offset="1" stopColor="#1d2f58" />
          </linearGradient>
          <radialGradient id="pfpGlow" cx="0.5" cy="0.42" r="0.55">
            <stop offset="0" stopColor="#3b548f" stopOpacity="0.55" />
            <stop offset="1" stopColor="#3b548f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pfpVig" cx="0.5" cy="0.5" r="0.72">
            <stop offset="0.62" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
        </defs>

        {/* night sky */}
        <rect width={W} height={H} fill="url(#pfpSky)" />
        <rect width={W} height={H} fill="url(#pfpGlow)" />

        {/* crescent moon, top right */}
        <g transform="translate(762 138)">
          <circle r="58" fill="#f6e7a8" opacity={0.16} />
          <circle r="44" fill="#f7ecc4" />
          <circle cx="18" cy="-10" r="38" fill="#101a33" />
        </g>

        {/* stars */}
        {STARS.map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill="#eef3ff" opacity={0.9} />
            <circle cx={x} cy={y} r={r * 2.6} fill="#cdd9ff" opacity={0.14} />
          </g>
        ))}

        {/* character — head & shoulders, framed by camera */}
        <g transform={`translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`}>
          <Person a={b} t={T} instanceId="pfp-B" />
        </g>

        <rect width={W} height={H} fill="url(#pfpVig)" />
        {/* thin brand ring */}
        <rect x={6} y={6} width={W - 12} height={H - 12} rx={40}
          fill="none" stroke="#f6e7a8" strokeWidth={6} opacity={0.85} />
      </svg>
    </AbsoluteFill>
  );
};
