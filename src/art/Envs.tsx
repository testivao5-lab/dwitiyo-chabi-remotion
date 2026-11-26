import React from 'react';
import { Pal } from './palette';
import { rng, mixHex, sway } from '../lib/anim';

const OUT = '#2b1d17';

/* ---------- small helpers ---------- */
const Plank: React.FC<{ x: number; y: number; w: number; h: number; c: string; dark: string; gap?: number }> = ({
  x, y, w, h, c, dark, gap = 120,
}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={c} />
    {Array.from({ length: Math.ceil(w / gap) }).map((_, i) => (
      <line key={i} x1={x + i * gap} y1={y} x2={x + i * gap} y2={y + h} stroke={dark} strokeWidth={3} opacity={0.4} />
    ))}
  </g>
);

function ShelfItems({ x0, x1, yb, pal, seed, maxH = 118 }: { x0: number; x1: number; yb: number; pal: Pal; seed: number; maxH?: number }) {
  const r = rng(seed);
  const out: React.ReactNode[] = [];
  let x = x0;
  let i = 0;
  while (x < x1 - 40) {
    const w = 38 + r() * 46;
    const h = 52 + r() * (maxH - 52);
    const c = pal.item[Math.floor(r() * pal.item.length)];
    const kind = Math.floor(r() * 4);
    const key = i++;
    if (kind === 0) {
      // bottle
      out.push(
        <g key={key}>
          <rect x={x + w * 0.3} y={yb - h - 22} width={w * 0.4} height={26} fill={mixHex(c, '#000', 0.15)} stroke={OUT} strokeWidth={2.5} />
          <rect x={x} y={yb - h} width={w} height={h} rx={9} fill={c} stroke={OUT} strokeWidth={3} />
          <rect x={x + 5} y={yb - h * 0.65} width={w - 10} height={h * 0.3} fill="#f3ead2" opacity={0.85} />
        </g>,
      );
    } else if (kind === 1) {
      // packet
      out.push(
        <g key={key}>
          <path d={`M ${x} ${yb} L ${x + 3} ${yb - h} L ${x + w - 3} ${yb - h} L ${x + w} ${yb} Z`} fill={c} stroke={OUT} strokeWidth={3} />
          <rect x={x + 8} y={yb - h * 0.7} width={w - 16} height={h * 0.28} fill="#f1e6c8" opacity={0.8} />
        </g>,
      );
    } else if (kind === 2) {
      // tin
      out.push(
        <g key={key}>
          <rect x={x} y={yb - h * 0.8} width={w} height={h * 0.8} fill={c} stroke={OUT} strokeWidth={3} />
          <ellipse cx={x + w / 2} cy={yb - h * 0.8} rx={w / 2} ry={6} fill={mixHex(c, '#fff', 0.3)} stroke={OUT} strokeWidth={2.5} />
          <rect x={x} y={yb - h * 0.5} width={w} height={8} fill="#f1e6c8" opacity={0.7} />
        </g>,
      );
    } else {
      // carton box
      out.push(
        <g key={key}>
          <rect x={x} y={yb - h * 0.9} width={w + 10} height={h * 0.9} fill={c} stroke={OUT} strokeWidth={3} />
          <rect x={x + 6} y={yb - h * 0.72} width={w - 2} height={9} fill="#f1e6c8" opacity={0.75} />
        </g>,
      );
    }
    x += w + 6 + r() * 12;
  }
  return <g>{out}</g>;
}

/* ---------- GROCERY SHOP ---------- */
export const Shop: React.FC<{ pal: Pal; t: number; stockBox?: boolean; bulb?: boolean; dusk?: boolean }> = ({
  pal, t, stockBox = true, bulb = true,
}) => {
  const dust = Array.from({ length: 26 }).map((_, i) => {
    const r = rng(i * 17 + 3);
    return { x: 420 + r() * 520, y: 300 + r() * 620, s: 1.5 + r() * 2.2, p: r() * 10 };
  });
  return (
    <g>
      {/* ceiling + back wall */}
      <rect x={-200} y={-200} width={2320} height={1500} fill={pal.wall} />
      <rect x={-200} y={-200} width={2320} height={330} fill={mixHex(pal.wall, '#000', 0.45)} />
      {[200, 760, 1320, 1880].map((x) => (
        <rect key={x} x={x - 30} y={-200} width={60} height={332} fill={mixHex(pal.woodDark, '#000', 0.2)} opacity={0.8} />
      ))}
      <rect x={-200} y={130} width={2320} height={680} fill={pal.wall} />
      {/* wall panel pattern */}
      {Array.from({ length: 20 }).map((_, i) => (
        <rect key={i} x={-100 + i * 130} y={130} width={4} height={680} fill={pal.wall2} opacity={0.35} />
      ))}
      <rect x={-200} y={700} width={2320} height={110} fill={pal.wall2} opacity={0.5} />
      {/* floor */}
      <rect x={-200} y={808} width={2320} height={600} fill={pal.floor} />
      {Array.from({ length: 16 }).map((_, i) => (
        <line key={i} x1={960 + (i - 7.5) * 90} y1={808} x2={960 + (i - 7.5) * 320} y2={1200} stroke={mixHex(pal.floor, '#000', 0.4)} strokeWidth={3} opacity={0.5} />
      ))}
      <rect x={-200} y={800} width={2320} height={14} fill={mixHex(pal.woodDark, '#000', 0.3)} />

      {/* door opening (left) */}
      <g>
        <rect x={80} y={218} width={330} height={600} fill={pal.woodDark} stroke={OUT} strokeWidth={5} />
        <rect x={102} y={240} width={286} height={578} fill={pal.sky} />
        <rect x={102} y={240} width={286} height={300} fill={pal.sky2} opacity={0.7} />
        {/* street silhouettes */}
        <rect x={110} y={420} width={90} height={400} fill={mixHex(pal.sky2, '#000', 0.2)} opacity={0.75} />
        <rect x={210} y={500} width={70} height={320} fill={mixHex(pal.sky2, '#000', 0.3)} opacity={0.7} />
        <path d="M 290 470 L 390 470 L 390 560 L 290 560 Z" fill="#b5534a" opacity={0.55} />
        <rect x={102} y={742} width={286} height={76} fill={mixHex(pal.sky, '#7a6a55', 0.5)} />
        {/* door leaf (ajar) */}
        <path d="M 102 240 L 150 252 L 150 800 L 102 818 Z" fill={pal.wood} stroke={OUT} strokeWidth={4} />
      </g>
      {/* wall clock */}
      <g transform="translate(246 150)">
        <circle r={42} fill="#efe6d0" stroke={OUT} strokeWidth={5} />
        <line x1={0} y1={0} x2={0} y2={-28} stroke={OUT} strokeWidth={4} strokeLinecap="round" />
        <line x1={0} y1={0} x2={20} y2={8} stroke={OUT} strokeWidth={4} strokeLinecap="round" />
      </g>

      {/* shelves */}
      {[262, 412, 562].map((yy, i) => (
        <g key={yy}>
          <ShelfItems x0={470} x1={1880} yb={yy} pal={pal} seed={11 + i * 5} />
          <rect x={455} y={yy} width={1450} height={16} fill={pal.wood} stroke={OUT} strokeWidth={3.5} />
          <rect x={455} y={yy + 16} width={1450} height={7} fill="#000" opacity={0.25} />
        </g>
      ))}
      {/* shelf uprights */}
      {[455, 905, 1355, 1895].map((x) => (
        <rect key={x} x={x - 8} y={130} width={16} height={690} fill={pal.woodDark} stroke={OUT} strokeWidth={3} opacity={0.95} />
      ))}
      {/* lower rear shelf with sacks + stock box */}
      <rect x={455} y={800} width={560} height={16} fill={pal.wood} stroke={OUT} strokeWidth={3.5} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${480 + i * 0} ${0})`}>
          {i === 0 && (
            <g>
              <path d="M 480 800 Q 470 730 500 704 Q 540 690 574 706 Q 600 730 592 800 Z" fill="#d8c79c" stroke={OUT} strokeWidth={3.5} />
              <path d="M 500 740 L 570 740" stroke="#a0524a" strokeWidth={6} />
            </g>
          )}
        </g>
      ))}
      <g>
        <path d="M 878 800 Q 868 740 896 718 Q 934 706 968 722 Q 994 744 986 800 Z" fill="#c9b78a" stroke={OUT} strokeWidth={3.5} />
        <path d="M 896 752 L 964 752" stroke="#6f8a6a" strokeWidth={6} />
      </g>
      {stockBox && (
        <g>
          <rect x={620} y={716} width={190} height={84} fill="#b98d57" stroke={OUT} strokeWidth={4} />
          <rect x={620} y={716} width={190} height={14} fill="#a27b49" stroke={OUT} strokeWidth={3} />
          <rect x={650} y={742} width={130} height={40} fill="#efe6cf" stroke={OUT} strokeWidth={2.5} />
          <path d="M 660 755 q 14 -10 28 0 t 28 0 t 28 0 M 660 770 q 20 -8 40 0 t 38 0" stroke="#2b1d17" strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      )}
      {/* hanging bulb */}
      {bulb && (
        <g>
          <line x1={1210} y1={110} x2={1210} y2={205} stroke={OUT} strokeWidth={4} />
          <ellipse cx={1210} cy={222} rx={20} ry={26} fill="#fff1c4" stroke={OUT} strokeWidth={3.5} />
          <circle cx={1210} cy={222} r={90} fill="#ffe7a8" opacity={0.08} />
        </g>
      )}
      {/* light shaft from the door */}
      <defs>
        <linearGradient id="shaft" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={pal.light} stopOpacity={pal.lightOp} />
          <stop offset="1" stopColor={pal.light} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points="390,250 1100,520 1180,1080 330,1080 390,818" fill="url(#shaft)" />
      {dust.map((d, i) => (
        <circle key={i} cx={d.x + sway(t, 14, 7 + (i % 5), d.p)} cy={d.y + sway(t, 22, 9 + (i % 4), d.p) - t * 2 % 40} r={d.s} fill="#fff7de" opacity={0.28 + 0.2 * Math.sin(t * 0.9 + d.p)} />
      ))}
    </g>
  );
};

/** the counter that characters stand behind (draw after back-actors, before props on top) */
export const ShopCounter: React.FC<{ pal: Pal }> = ({ pal }) => (
  <g>
    <rect x={985} y={652} width={1100} height={560} fill={mixHex(pal.wood, '#000', 0.12)} stroke={OUT} strokeWidth={4.5} />
    {Array.from({ length: 10 }).map((_, i) => (
      <line key={i} x1={985 + i * 118 + 118} y1={652} x2={985 + i * 118 + 118} y2={1212} stroke={pal.woodDark} strokeWidth={4} opacity={0.55} />
    ))}
    <rect x={1010} y={690} width={1060} height={250} fill="none" stroke={pal.woodDark} strokeWidth={3} opacity={0.35} />
    <rect x={985} y={652} width={1100} height={26} fill="#000" opacity={0.22} />
    {/* top surface */}
    <path d="M 975 628 L 2085 628 L 2085 656 L 975 656 Z" fill={mixHex(pal.wood, '#fff', 0.14)} stroke={OUT} strokeWidth={4.5} />
    <path d="M 975 628 L 2085 628 L 2085 636 L 975 636 Z" fill="#fff" opacity={0.18} />
    {/* end-cap shade */}
    <rect x={985} y={656} width={22} height={560} fill="#000" opacity={0.2} />
    {/* kiosk bits on counter */}
    <g transform="translate(1830 628)">
      <rect x={-6} y={-8} width={150} height={8} fill="#6a6a6a" stroke={OUT} strokeWidth={3} />
      <line x1={69} y1={-8} x2={69} y2={-110} stroke={OUT} strokeWidth={5} />
      <line x1={0} y1={-110} x2={140} y2={-110} stroke={OUT} strokeWidth={5} />
      <path d="M -6 -108 Q 10 -70 26 -108 M 114 -108 Q 130 -70 146 -108" stroke={OUT} strokeWidth={4} fill="#b9b2a0" />
    </g>
    <g transform="translate(1610 628)">
      <rect x={0} y={-62} width={64} height={62} rx={8} fill="#c9d6d0" opacity={0.7} stroke={OUT} strokeWidth={3.5} />
      <rect x={-4} y={-72} width={72} height={14} rx={4} fill="#b64c3f" stroke={OUT} strokeWidth={3.5} />
      <circle cx={20} cy={-30} r={7} fill="#e7b04a" /><circle cx={42} cy={-22} r={7} fill="#c85d4a" /><circle cx={34} cy={-40} r={7} fill="#e7b04a" />
    </g>
  </g>
);

/* ---------- HOME DINING ROOM ---------- */
export const HomeRoom: React.FC<{ pal: Pal; t: number }> = ({ pal, t }) => (
  <g>
    <rect x={-200} y={-200} width={2320} height={1100} fill={pal.wall} />
    {Array.from({ length: 18 }).map((_, i) => (
      <rect key={i} x={-60 + i * 130} y={-100} width={3} height={900} fill={pal.wall2} opacity={0.35} />
    ))}
    <rect x={-200} y={560} width={2320} height={250} fill={pal.wall2} opacity={0.55} />
    <rect x={-200} y={800} width={2320} height={600} fill={pal.floor} />
    {Array.from({ length: 14 }).map((_, i) => (
      <line key={i} x1={-200} y1={820 + i * 40} x2={2120} y2={820 + i * 40} stroke={mixHex(pal.floor, '#000', 0.4)} strokeWidth={3} opacity={0.4} />
    ))}
    <rect x={-200} y={796} width={2320} height={16} fill={pal.woodDark} />
    {/* window */}
    <g>
      <rect x={1330} y={170} width={400} height={400} fill={pal.woodDark} stroke={OUT} strokeWidth={5} />
      <rect x={1348} y={188} width={364} height={364} fill={pal.sky} />
      <rect x={1348} y={188} width={364} height={170} fill={pal.sky2} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={1380 + ((i * 97) % 300)} cy={220 + ((i * 53) % 120)} r={2.5} fill="#fff6d8" opacity={0.8} />
      ))}
      <line x1={1530} y1={188} x2={1530} y2={552} stroke={pal.woodDark} strokeWidth={8} />
      <line x1={1348} y1={370} x2={1712} y2={370} stroke={pal.woodDark} strokeWidth={8} />
      <path d="M 1330 160 Q 1380 340 1340 580 L 1280 580 Q 1310 340 1290 160 Z" fill="#9c5b52" stroke={OUT} strokeWidth={3.5} opacity={0.92} />
      <path d="M 1730 160 Q 1680 340 1720 580 L 1780 580 Q 1750 340 1770 160 Z" fill="#9c5b52" stroke={OUT} strokeWidth={3.5} opacity={0.92} />
    </g>
    {/* wall clock + calendar */}
    <g transform="translate(560 240)">
      <circle r={52} fill="#efe6d0" stroke={OUT} strokeWidth={5} />
      <line x1={0} y1={0} x2={0} y2={-34} stroke={OUT} strokeWidth={4.5} strokeLinecap="round" />
      <line x1={0} y1={0} x2={-24} y2={14} stroke={OUT} strokeWidth={4.5} strokeLinecap="round" />
    </g>
    <g transform="translate(260 180)">
      <rect width={130} height={170} fill="#efe6d0" stroke={OUT} strokeWidth={4} />
      <rect width={130} height={40} fill="#a64d43" stroke={OUT} strokeWidth={4} />
      {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => <rect key={`${r}${c}`} x={12 + c * 22} y={56 + r * 26} width={14} height={14} fill="#7a6a55" opacity={0.5} />))}
    </g>
    {/* pendant lamp */}
    <g>
      <line x1={900} y1={-100} x2={900} y2={150} stroke={OUT} strokeWidth={4} />
      <path d="M 840 210 Q 840 150 900 146 Q 960 150 960 210 Z" fill="#c5a15c" stroke={OUT} strokeWidth={4} />
      <ellipse cx={900} cy={212} rx={34} ry={9} fill="#fff1c4" />
      <polygon points="866,214 934,214 1150,830 650,830" fill="#ffd89a" opacity={0.1 + 0.015 * Math.sin(t * 3)} />
    </g>
  </g>
);

export const DiningTable: React.FC<{ pal: Pal; x?: number; plates?: boolean }> = ({ pal, x = 560, plates = true }) => (
  <g>
    <rect x={x} y={690} width={980} height={520} fill={mixHex(pal.wood, '#000', 0.2)} stroke={OUT} strokeWidth={4.5} />
    <rect x={x - 30} y={660} width={1040} height={36} rx={6} fill="#9b6e46" stroke={OUT} strokeWidth={4.5} />
    <rect x={x + 6} y={696} width={968} height={80} fill="#a64d43" opacity={0.9} stroke={OUT} strokeWidth={3} />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
      <rect key={i} x={x + 6 + i * 81} y={696} width={40} height={80} fill="#e6d9b9" opacity={0.28} />
    ))}
    {plates && (
      <g>
        <ellipse cx={x + 250} cy={650} rx={70} ry={11} fill="#e8e1d1" stroke={OUT} strokeWidth={3.5} />
        <ellipse cx={x + 250} cy={646} rx={40} ry={6} fill="#c9a24a" opacity={0.7} />
        <ellipse cx={x + 520} cy={650} rx={70} ry={11} fill="#e8e1d1" stroke={OUT} strokeWidth={3.5} />
        <ellipse cx={x + 520} cy={646} rx={40} ry={6} fill="#e5d3a0" opacity={0.7} />
        <rect x={x + 760} y={582} width={38} height={72} rx={8} fill="#c5dbe3" opacity={0.65} stroke={OUT} strokeWidth={3.5} />
        <path d={`M ${x + 850} 654 L ${x + 850} 560 Q ${x + 900} 560 ${x + 900} 600 L ${x + 890} 654 Z`} fill="#8a9bb0" stroke={OUT} strokeWidth={3.5} />
      </g>
    )}
  </g>
);

/* ---------- MAHIN'S ROOM ---------- */
export const MahinRoom: React.FC<{ pal: Pal; t: number }> = ({ pal, t }) => (
  <g>
    <rect x={-200} y={-200} width={2320} height={1100} fill={pal.wall} />
    <rect x={-200} y={600} width={2320} height={210} fill={pal.wall2} opacity={0.5} />
    <rect x={-200} y={808} width={2320} height={600} fill={pal.floor} />
    <rect x={-200} y={800} width={2320} height={16} fill={pal.woodDark} />
    {/* window */}
    <g>
      <rect x={760} y={170} width={330} height={340} fill={pal.woodDark} stroke={OUT} strokeWidth={5} />
      <rect x={778} y={188} width={294} height={304} fill={pal.sky} />
      <rect x={778} y={188} width={294} height={130} fill={pal.sky2} />
      <line x1={925} y1={188} x2={925} y2={492} stroke={pal.woodDark} strokeWidth={7} />
      <line x1={778} y1={340} x2={1072} y2={340} stroke={pal.woodDark} strokeWidth={7} />
    </g>
    <polygon points="780,500 1080,500 1260,1000 620,1000" fill={pal.light} opacity={0.1} />
    {/* bed */}
    <g>
      <rect x={-40} y={620} width={620} height={260} rx={14} fill="#6e5a46" stroke={OUT} strokeWidth={4.5} />
      <rect x={-40} y={600} width={620} height={110} rx={18} fill="#7b95a0" stroke={OUT} strokeWidth={4.5} />
      <rect x={-40} y={540} width={140} height={150} rx={22} fill="#e0d8c4" stroke={OUT} strokeWidth={4.5} />
      <path d="M 120 640 Q 300 610 560 650" stroke="#5e7782" strokeWidth={5} fill="none" />
    </g>
    {/* small table + folded clothes */}
    <g>
      <rect x={1410} y={640} width={330} height={26} fill="#9b6e46" stroke={OUT} strokeWidth={4.5} />
      <rect x={1432} y={666} width={26} height={170} fill="#6e4d33" stroke={OUT} strokeWidth={3.5} />
      <rect x={1692} y={666} width={26} height={170} fill="#6e4d33" stroke={OUT} strokeWidth={3.5} />
      <rect x={1470} y={596} width={150} height={44} rx={6} fill="#4f8089" stroke={OUT} strokeWidth={3.5} />
      <rect x={1480} y={556} width={130} height={42} rx={6} fill="#c9b78f" stroke={OUT} strokeWidth={3.5} />
      <rect x={1640} y={604} width={52} height={36} rx={6} fill="#a8553f" stroke={OUT} strokeWidth={3.5} />
    </g>
    <g transform={`translate(1220 150) rotate(${sway(t, 0.6, 5)} 0 0)`}>
      <line x1={0} y1={0} x2={0} y2={60} stroke={OUT} strokeWidth={4} />
      <path d="M -40 60 L 40 60 L 0 40 Z" fill="none" stroke={OUT} strokeWidth={4} />
      <path d="M -36 66 L 36 66 L 44 220 L -44 220 Z" fill="#8f9fa8" stroke={OUT} strokeWidth={3.5} opacity={0.9} />
    </g>
  </g>
);

/* ---------- BAZAAR STREET / SHOP EXTERIOR ---------- */
export const Street: React.FC<{ pal: Pal; t: number; garland?: boolean; doorGlow?: number; shutter?: number }> = ({
  pal, t, garland = false, doorGlow = 0, shutter = 0,
}) => {
  const r = rng(91);
  const far = Array.from({ length: 14 }).map((_, i) => ({ x: -100 + i * 160, w: 120 + r() * 80, h: 160 + r() * 200 }));
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.sky2} />
          <stop offset="1" stopColor={pal.sky} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-300} width={2320} height={1100} fill="url(#sky)" />
      {far.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={720 - b.h} width={b.w} height={b.h + 100} fill={mixHex(pal.sky2, '#3a3a3a', 0.28 + (i % 3) * 0.05)} opacity={0.75} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={b.x + 14 + k * 30} y={720 - b.h + 24} width={16} height={22} fill={mixHex(pal.sky, '#fff', 0.2)} opacity={0.5} />
          ))}
        </g>
      ))}
      {/* ground */}
      <rect x={-200} y={800} width={2320} height={500} fill={mixHex(pal.floor, '#9a8a70', 0.35)} />
      <rect x={-200} y={780} width={2320} height={30} fill={mixHex(pal.floor, '#7a6a55', 0.5)} />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M ${-100 + i * 260} 860 q 60 -12 130 0`} stroke={mixHex(pal.floor, '#000', 0.3)} strokeWidth={4} fill="none" opacity={0.4} />
      ))}
      {/* neighbouring stall (left) */}
      <g>
        <rect x={60} y={500} width={360} height={290} fill="#8f8062" stroke={OUT} strokeWidth={4} />
        <path d="M 40 500 L 440 500 L 400 430 L 80 430 Z" fill="#a64d43" stroke={OUT} strokeWidth={4} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={60 + i * 72} y={430} width={36} height={70} fill="#e6d9b9" opacity={0.55} />
        ))}
        <rect x={110} y={640} width={260} height={30} fill="#7a5a3a" stroke={OUT} strokeWidth={3.5} />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={140 + i * 50} cy={620} r={22} fill={['#c9533c', '#d9a53c', '#6a9a55', '#d9a53c', '#c9533c'][i]} stroke={OUT} strokeWidth={3} />)}
      </g>
      {/* neighbouring stall (right) */}
      <g>
        <rect x={1520} y={500} width={420} height={290} fill="#7f8a82" stroke={OUT} strokeWidth={4} />
        <path d="M 1500 500 L 1960 500 L 1920 430 L 1540 430 Z" fill="#4f8089" stroke={OUT} strokeWidth={4} />
        <rect x={1570} y={650} width={300} height={34} fill="#7a5a3a" stroke={OUT} strokeWidth={3.5} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={1590 + i * 70} y={600} width={46} height={50} fill={['#d9a53c', '#b8765a', '#e0d8c4', '#6f8a6a'][i]} stroke={OUT} strokeWidth={3} />)}
      </g>
      {/* the shop front */}
      <g>
        <rect x={500} y={300} width={940} height={500} fill={pal.wall} stroke={OUT} strokeWidth={5} />
        <rect x={500} y={300} width={940} height={110} fill={mixHex(pal.wall2, '#000', 0.12)} stroke={OUT} strokeWidth={5} />
        <rect x={560} y={322} width={820} height={66} rx={8} fill="#e6dcc3" stroke={OUT} strokeWidth={4} />
        <path d="M 600 356 q 30 -22 60 0 t 60 0 M 760 356 h 120 M 920 350 q 20 -20 40 0 t 40 0 M 1040 356 h 80 M 1160 356 q 30 -22 60 0" stroke="#7a3d33" strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* shutter/door */}
        <rect x={560} y={440} width={820} height={360} fill={mixHex(pal.woodDark, '#000', 0.3)} stroke={OUT} strokeWidth={5} />
        <rect x={580} y={456} width={780} height={340 * (1 - shutter) + 4} fill={mixHex(pal.wall2, '#fff', 0.1)} />
        {/* interior glow */}
        <rect x={580} y={456} width={780} height={340} fill="#ffd89a" opacity={0.0 + doorGlow * 0.55} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={600 + i * 150} y={480} width={110} height={80} fill={pal.item[i % 8]} opacity={0.55} stroke={OUT} strokeWidth={3} />
        ))}
        {/* shutter slats */}
        <rect x={580} y={456} width={780} height={340 * shutter} fill="#8c8f8a" stroke={OUT} strokeWidth={4} />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={580} y1={456 + i * 30} x2={1360} y2={456 + i * 30} stroke={OUT} strokeWidth={2} opacity={shutter > 0.05 ? 0.4 : 0} />
        ))}
        {/* lock */}
        <rect x={1180} y={700} width={38} height={46} rx={8} fill="#b59c4f" stroke={OUT} strokeWidth={4} />
        <circle cx={1199} cy={720} r={6} fill={OUT} />
      </g>
      {garland && (
        <g>
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M ${520 + k * 300} 424 Q ${670 + k * 300} 540 ${820 + k * 300} 424`} stroke="#d98a2b" strokeWidth={10} fill="none" strokeDasharray="14 6" strokeLinecap="round" />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <circle key={i} cx={560 + i * 100} cy={440 + Math.sin(i * 1.6) * 8} r={12} fill={i % 2 ? '#e8a33a' : '#d46a2b'} stroke={OUT} strokeWidth={2.5} />
          ))}
        </g>
      )}
      <rect x={-200} y={800} width={2320} height={10} fill="#000" opacity={0.2} />
      {/* drifting dust/pollen */}
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={(i * 211 + t * 12) % 2100 - 80} cy={200 + ((i * 97) % 500) + sway(t, 12, 5, i)} r={2.2} fill="#fff" opacity={0.3} />
      ))}
    </g>
  );
};
