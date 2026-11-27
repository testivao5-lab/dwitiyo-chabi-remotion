import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Shop, ShopCounter } from './art/Envs';
import { Actor } from './art/Actor';
import { ActorSpec } from './art/Person';
import { Key, Ledger } from './art/Props';
import { PAL } from './art/palette';

/* YouTube thumbnail — Bulbul-Islam-style: bold yellow Bengali headline over a
   story frame. Tight close crop, open grins, sparkling key, red highlight slab.
   Rendered with: npx remotion still src/index.ts Thumbnail out.png            */

const W = 1920;
const H = 1080;
const T = 4; // life/blink clock (seconds)
const G = 592.5; // narration clock — after the last line, so nobody is talking

export const Thumbnail: React.FC = () => {
  const pal = PAL.present;
  const sid = 'thumb';
  const cx = 1100;
  const cy = 465;
  const z = 1.5;

  const b: ActorSpec = {
    id: 'B', x: 1180, expr: 'smile', mouth: 0.3, look: 0.2, lookY: -0.2,
    hf: [1120, 624], hr: [1072, 630], z: 'front',
    armsMask: { front: true, rear: true },
  };
  const m: ActorSpec = {
    id: 'M', x: 1465, expr: 'smile', mouth: 0.42, look: -0.12,
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
            <stop offset="0.58" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity={Math.min(pal.vig * 1.25, 0.7)} />
          </radialGradient>
          <radialGradient id="thumbWarm" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffb347" stopOpacity="0.22" />
            <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
          </radialGradient>
          <filter id="thumbPop" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="1.18" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.05" intercept="-0.015" />
              <feFuncG type="linear" slope="1.05" intercept="-0.015" />
              <feFuncB type="linear" slope="1.05" intercept="-0.015" />
            </feComponentTransfer>
          </filter>
        </defs>
        <g filter="url(#thumbPop)">
          <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
            <Shop pal={pal} t={T} sid={sid} />
            {/* warm spotlight behind the brothers */}
            <ellipse cx={1330} cy={430} rx={460} ry={330} fill="url(#thumbWarm)" />
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
            {/* sparkle burst behind the key */}
            <g transform="translate(1578 338)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <path key={a}
                  d="M 0 -58 L 9 -18 L 0 -10 L -9 -18 Z"
                  transform={`rotate(${a})`}
                  fill={a % 90 === 0 ? '#ffe110' : '#fff6c8'}
                  opacity={a % 90 === 0 ? 0.95 : 0.8} />
              ))}
              <circle r="26" fill="#ffe110" opacity={0.28} />
              <circle r="11" fill="#ffffff" opacity={0.9} />
            </g>
            <Key x={1578} y={338} rot={-14} s={1.3} shine={1} />
          </g>
        </g>
        <rect width={W} height={H} fill="url(#thumbVig)" />
        <rect width={W} height={H} fill={pal.tint} opacity={pal.tintOp * 0.7} />
      </svg>

      {/* ── headline + corner badge ── */}
      <AbsoluteFill>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="thumbScrim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0.82" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={W} height={560} fill="url(#thumbScrim)" />

          <g transform="rotate(-1.4 500 240)" fontFamily="'Noto Sans Bengali', sans-serif" fontWeight={800}>
            {/* line 1 — yellow on scrim */}
            <g textAnchor="start">
              <g fill="#000" stroke="#000" strokeWidth={24} paintOrder="stroke" opacity={0.5} transform="translate(8 10)">
                <text x={84} y={172} fontSize={114}>দুই ভাই — এক চাবি</text>
              </g>
              <g fill="#ffe110" stroke="#17100a" strokeWidth={22} paintOrder="stroke">
                <text x={84} y={172} fontSize={114}>দুই ভাই — এক চাবি</text>
              </g>
            </g>

            {/* line 2 — red highlight slab + yellow text */}
            <g>
              <rect x={62} y={226} width={874} height={132} rx={18}
                fill="#7d1b1b" transform="translate(7 9)" />
              <rect x={62} y={226} width={874} height={132} rx={18}
                fill="#d22f2f" stroke="#140c08" strokeWidth={8} />
              <rect x={74} y={236} width={850} height={40} rx={14} fill="#fff" opacity={0.15} />
              <text x={499} y={322} fontSize={94} fill="#ffe110" stroke="#140c08"
                strokeWidth={14} paintOrder="stroke" textAnchor="middle">দোকানটাও দুইজনের!</text>
            </g>
          </g>

          {/* corner badge (title tag) */}
          <g>
            <rect x={1546} y={946} width={322} height={98} rx={18}
              fill="#d22f2f" stroke="#140c08" strokeWidth={7} />
            <rect x={1554} y={954} width={306} height={34} rx={12} fill="#fff" opacity={0.14} />
            <text x={1707} y={1014} fontSize={50} fontFamily="'Noto Sans Bengali', sans-serif"
              fontWeight={800} fill="#fff" textAnchor="middle" stroke="#140c08"
              strokeWidth={5} paintOrder="stroke">দ্বিতীয় চাবি</text>
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
