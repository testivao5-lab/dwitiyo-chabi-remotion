import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Shop, ShopCounter } from './art/Envs';
import { Actor } from './art/Actor';
import { ActorSpec } from './art/Person';
import { Key, Ledger } from './art/Props';
import { PAL } from './art/palette';

/* YouTube thumbnail — Bulbul-Islam-style: bold yellow Bengali headline over a
   story frame. Two brothers behind the shop counter, the old brass key held up.
   Rendered with: npx remotion still src/index.ts Thumbnail out.png            */

const W = 1920;
const H = 1080;
const T = 4; // life/blink clock (seconds)
const G = 592.5; // narration clock — after the last line, so everyone holds a closed smile

export const Thumbnail: React.FC = () => {
  const pal = PAL.present;
  const sid = 'thumb';
  const cx = 1115;
  const cy = 490;
  const z = 1.2;

  const b: ActorSpec = {
    id: 'B', x: 1180, expr: 'smile', look: 0.18, lookY: -0.25,
    hf: [1120, 624], hr: [1072, 630], z: 'front',
    armsMask: { front: true, rear: true },
  };
  const m: ActorSpec = {
    id: 'M', x: 1465, expr: 'smile', look: -0.1,
    hf: [1570, 368], hr: [1430, 634], z: 'front',
    armsMask: { front: true, rear: true },
  };

  return (
    <AbsoluteFill style={{ backgroundColor: pal.wall }}>
      {/* ── scene ── */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <clipPath id="thumbArmClip">
            <rect x={-600} y={-1400} width={3400} height={2060} />
          </clipPath>
          <radialGradient id="thumbVig" cx="0.5" cy="0.5" r="0.74">
            <stop offset="0.6" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity={pal.vig * 0.75} />
          </radialGradient>
        </defs>
        <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
          <Shop pal={pal} t={T} sid={sid} />
          {/* bodies behind the counter */}
          <Actor a={b} t={T} g={G} instanceId="thumb-B-body" part="body" light={1} />
          <Actor a={m} t={T} g={G} instanceId="thumb-M-body" part="body" light={1} />
          <ShopCounter pal={pal} sid={sid} />
          <Ledger x={1046} y={642} write={1} s={1.05} />
          {/* arms over the counter */}
          <g clipPath="url(#thumbArmClip)">
            <Actor a={b} t={T} g={G} instanceId="thumb-B-arms" part="arms" light={1} />
            <Actor a={m} t={T} g={G} instanceId="thumb-M-arms" part="arms" light={1} />
          </g>
          <Key x={1578} y={338} rot={-14} s={1.3} shine={1} />
        </g>
        <rect width={W} height={H} fill="url(#thumbVig)" />
        <rect width={W} height={H} fill={pal.tint} opacity={pal.tintOp * 0.5} />
      </svg>

      {/* ── headline + corner badge ── */}
      <AbsoluteFill>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="thumbScrim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0.7" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={W} height={480} fill="url(#thumbScrim)" />

          <g fontFamily="'Noto Sans Bengali', sans-serif" fontWeight={800} textAnchor="start">
            {/* soft drop shadow layer */}
            <g fill="#000" stroke="#000" strokeWidth={24} paintOrder="stroke" opacity={0.5} transform="translate(8 10)">
              <text x={84} y={178} fontSize={112}>দুই ভাই — এক চাবি</text>
              <text x={84} y={318} fontSize={97}>দোকানটাও দুইজনের!</text>
            </g>
            {/* main yellow headline with heavy black outline */}
            <g fill="#ffe110" stroke="#17100a" strokeWidth={22} paintOrder="stroke">
              <text x={84} y={178} fontSize={112}>দুই ভাই — এক চাবি</text>
              <text x={84} y={318} fontSize={97}>দোকানটাও দুইজনের!</text>
            </g>
          </g>

          {/* corner badge (title tag) */}
          <g>
            <rect x={1546} y={946} width={322} height={98} rx={18}
              fill="#d22f2f" stroke="#140c08" strokeWidth={7} />
            <rect x={1554} y={954} width={306} height={34} rx={12} fill="#fff" opacity={0.14} />
            <text x={1707} y={1014} fontSize={50} fontFamily="'Noto Sans Bengali', sans-serif"
              fontWeight={800} fill="#fff" textAnchor="middle" stroke="#140c08"
              strokeWidth={5} paintOrder="stroke">দ্বিতীয় ছবি</text>
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
