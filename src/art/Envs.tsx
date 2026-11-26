import React from 'react';
import { Pal } from './palette';
import { rng, mixHex, sway } from '../lib/anim';

const OUT = '#2b1d17';
const dk = (c: string, k: number) => mixHex(c, '#000000', k);
const lt = (c: string, k: number) => mixHex(c, '#ffffff', k);

/* ---------- shared texture / lighting defs ---------- */
const Defs: React.FC<{ pal: Pal }> = ({ pal }) => (
  <defs>
    {/* plaster / wall relief */}
    <filter id="tex-wall" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.026" numOctaves="3" seed="4" result="n" />
      <feDiffuseLighting in="n" lightingColor="#ffffff" surfaceScale="1.6" diffuseConstant="1.05" result="l">
        <feDistantLight azimuth="215" elevation="62" />
      </feDiffuseLighting>
      <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.18" k2="0" k3="0" k4="0" />
    </filter>
    {/* wood grain */}
    <filter id="tex-wood" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.16" numOctaves="3" seed="9" result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.2" result="a" />
      <feComposite in="a" in2="SourceGraphic" operator="in" result="g" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="g" />
      </feMerge>
    </filter>
    <filter id="tex-floor" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.09" numOctaves="3" seed="2" result="n" />
      <feDiffuseLighting in="n" lightingColor="#ffffff" surfaceScale="1.2" diffuseConstant="1.1" result="l">
        <feDistantLight azimuth="250" elevation="60" />
      </feDiffuseLighting>
      <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0" />
    </filter>
    <filter id="soft6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter>
    <filter id="soft14" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="14" /></filter>
    <filter id="soft30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30" /></filter>
    <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={dk(pal.wall, 0.35)} />
      <stop offset="0.25" stopColor={pal.wall} />
      <stop offset="0.8" stopColor={lt(pal.wall, 0.04)} />
      <stop offset="1" stopColor={dk(pal.wall, 0.2)} />
    </linearGradient>
    <linearGradient id="woodH" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={lt(pal.wood, 0.2)} />
      <stop offset="0.5" stopColor={pal.wood} />
      <stop offset="1" stopColor={dk(pal.wood, 0.3)} />
    </linearGradient>
    <linearGradient id="woodD" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={lt(pal.woodDark, 0.12)} />
      <stop offset="0.5" stopColor={pal.woodDark} />
      <stop offset="1" stopColor={dk(pal.woodDark, 0.4)} />
    </linearGradient>
    <radialGradient id="glowW" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fff0c0" stopOpacity={0.75} />
      <stop offset="0.4" stopColor="#ffd98a" stopOpacity={0.25} />
      <stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
    </radialGradient>
  </defs>
);

/* ---------- grocery products with cylindrical shading ---------- */
function ShelfItems({ x0, x1, yb, pal, seed, maxH = 100, sid }: { x0: number; x1: number; yb: number; pal: Pal; seed: number; maxH?: number; sid: string }) {
  const r = rng(seed);
  const out: React.ReactNode[] = [];
  const grads: React.ReactNode[] = [];
  let x = x0;
  let i = 0;
  while (x < x1 - 40) {
    const w = 38 + r() * 46;
    const h = 52 + r() * (maxH - 52);
    const c = pal.item[Math.floor(r() * pal.item.length)];
    const kind = Math.floor(r() * 4);
    const key = i++;
    const gid = `${sid}-${key}`;
    grads.push(
      <linearGradient key={gid} id={gid} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={lt(c, 0.18)} />
        <stop offset="0.35" stopColor={c} />
        <stop offset="1" stopColor={dk(c, 0.38)} />
      </linearGradient>,
    );
    const shadow = <ellipse cx={x + w / 2 + 6} cy={yb + 1} rx={w * 0.62} ry={4.5} fill="#000" opacity={0.3} />;
    if (kind === 0) {
      out.push(
        <g key={key}>
          {shadow}
          <rect x={x + w * 0.3} y={yb - h - 22} width={w * 0.4} height={26} fill={dk(c, 0.2)} stroke={OUT} strokeWidth={2} />
          <rect x={x + w * 0.28} y={yb - h - 26} width={w * 0.44} height={8} rx={2} fill="#2b2420" stroke={OUT} strokeWidth={1.5} />
          <rect x={x} y={yb - h} width={w} height={h} rx={9} fill={`url(#${gid})`} stroke={OUT} strokeWidth={2.2} />
          <rect x={x + 5} y={yb - h * 0.65} width={w - 10} height={h * 0.3} fill="#f3ead2" opacity={0.9} />
          <path d={`M ${x + 9} ${yb - h * 0.55} h ${w - 18} M ${x + 9} ${yb - h * 0.46} h ${(w - 18) * 0.6}`} stroke="#6b4a3a" strokeWidth={1.6} opacity={0.7} />
          <rect x={x + 5} y={yb - h + 6} width={4} height={h - 14} rx={2} fill="#fff" opacity={0.28} />
        </g>,
      );
    } else if (kind === 1) {
      out.push(
        <g key={key}>
          {shadow}
          <path d={`M ${x} ${yb} L ${x + 3} ${yb - h} L ${x + w - 3} ${yb - h} L ${x + w} ${yb} Z`} fill={`url(#${gid})`} stroke={OUT} strokeWidth={2.2} />
          <path d={`M ${x + 3} ${yb - h} h ${w - 6} M ${x + 4} ${yb - h + 4} h ${w - 8}`} stroke="#000" strokeWidth={1.4} opacity={0.35} strokeDasharray="2 2" />
          <rect x={x + 8} y={yb - h * 0.7} width={w - 16} height={h * 0.28} fill="#f1e6c8" opacity={0.85} />
          <circle cx={x + w / 2} cy={yb - h * 0.3} r={w * 0.14} fill="#fff" opacity={0.35} />
        </g>,
      );
    } else if (kind === 2) {
      out.push(
        <g key={key}>
          {shadow}
          <rect x={x} y={yb - h * 0.8} width={w} height={h * 0.8} fill={`url(#${gid})`} stroke={OUT} strokeWidth={2.2} />
          <ellipse cx={x + w / 2} cy={yb - h * 0.8} rx={w / 2} ry={6} fill={lt(c, 0.35)} stroke={OUT} strokeWidth={2} />
          <ellipse cx={x + w / 2} cy={yb - h * 0.8} rx={w / 2 - 6} ry={3} fill={dk(c, 0.1)} opacity={0.7} />
          <rect x={x} y={yb - h * 0.5} width={w} height={8} fill="#f1e6c8" opacity={0.8} />
          <rect x={x + 4} y={yb - h * 0.78} width={3} height={h * 0.7} fill="#fff" opacity={0.25} />
        </g>,
      );
    } else {
      out.push(
        <g key={key}>
          {shadow}
          <rect x={x} y={yb - h * 0.9} width={w + 10} height={h * 0.9} fill={`url(#${gid})`} stroke={OUT} strokeWidth={2.2} />
          <path d={`M ${x} ${yb - h * 0.9} l 8 -6 h ${w - 4} l 6 6`} fill={lt(c, 0.25)} stroke={OUT} strokeWidth={1.8} />
          <rect x={x + 6} y={yb - h * 0.72} width={w - 2} height={9} fill="#f1e6c8" opacity={0.8} />
          <path d={`M ${x + 8} ${yb - h * 0.45} h ${w - 6}`} stroke="#000" strokeWidth={1.5} opacity={0.25} />
        </g>,
      );
    }
    x += w + 6 + r() * 12;
  }
  return (
    <g>
      <defs>{grads}</defs>
      {out}
    </g>
  );
}

/* ---------- wall clock (hands keep time) ---------- */
const Clock: React.FC<{ x: number; y: number; r: number; t: number; roman?: boolean }> = ({ x, y, r, t }) => {
  const min = ((t * 6) / 60) * 360 + 130; // 1 revolution / minute (film time)
  const hr = 70 + t * 0.5;
  const sec = (t * 6 * 4) % 360;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r + 7} fill="#3a2a1d" stroke={OUT} strokeWidth={3} />
      <circle r={r} fill="#efe6d0" stroke="#6b5a3a" strokeWidth={2} />
      <circle r={r - 6} fill="none" stroke="#b9ad90" strokeWidth={1} />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1={0} y1={-r + 6} x2={0} y2={-r + (i % 3 === 0 ? 17 : 11)} stroke="#3a2d22" strokeWidth={i % 3 === 0 ? 3 : 1.8} transform={`rotate(${i * 30})`} />
      ))}
      <line x1={0} y1={4} x2={0} y2={-r * 0.5} stroke="#2a2018" strokeWidth={4.2} strokeLinecap="round" transform={`rotate(${hr})`} />
      <line x1={0} y1={6} x2={0} y2={-r * 0.78} stroke="#2a2018" strokeWidth={3} strokeLinecap="round" transform={`rotate(${min})`} />
      <line x1={0} y1={10} x2={0} y2={-r * 0.82} stroke="#a03a2a" strokeWidth={1.2} transform={`rotate(${sec})`} />
      <circle r={3.5} fill="#a03a2a" />
      <path d={`M ${-r * 0.7} ${-r * 0.5} A ${r} ${r} 0 0 1 ${r * 0.1} ${-r * 0.95}`} stroke="#fff" strokeWidth={3} opacity={0.35} fill="none" strokeLinecap="round" />
    </g>
  );
};

/* ---------- ceiling fan (side-on, slow) ---------- */
const Fan: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g transform={`translate(${x} ${y})`}>
    <line x1={0} y1={-300} x2={0} y2={0} stroke="#2a2a2a" strokeWidth={5} />
    <rect x={-22} y={-8} width={44} height={22} rx={8} fill="#3c3c3c" stroke={OUT} strokeWidth={3} />
    {[0, 1, 2].map((k) => {
      const a = t * 3.4 + (k * Math.PI * 2) / 3;
      const cx = Math.cos(a) * 130;
      const depth = 0.5 + 0.5 * Math.sin(a);
      return (
        <g key={k} opacity={0.35 + depth * 0.5}>
          <rect x={cx - 70} y={8 + depth * 3} width={140} height={9} rx={4} fill="#4b4339" stroke={OUT} strokeWidth={2} />
        </g>
      );
    })}
    <ellipse cx={0} cy={22} rx={160} ry={7} fill="#000" opacity={0.07} />
  </g>
);

/* ============================ GROCERY SHOP ============================ */
export const Shop: React.FC<{ pal: Pal; t: number; stockBox?: boolean; bulb?: boolean; dusk?: boolean }> = ({
  pal, t, stockBox = true, bulb = true,
}) => {
  const dust = Array.from({ length: 30 }).map((_, i) => {
    const r = rng(i * 17 + 3);
    return { x: 420 + r() * 620, y: 300 + r() * 620, s: 1.2 + r() * 2.4, p: r() * 10 };
  });
  const plankRows = 11;
  const planks: React.ReactNode[] = [];
  const pr = rng(77);
  for (let row = 0; row < plankRows; row++) {
    const y0 = 808 + Math.pow(row / plankRows, 1.55) * 520;
    const y1 = 808 + Math.pow((row + 1) / plankRows, 1.55) * 520;
    const n = 9 + Math.floor(row * 0.6);
    const off = (row % 2) * 0.5;
    for (let k = -2; k < n + 2; k++) {
      const xa = -200 + ((k + off) / n) * 2320;
      const xb = -200 + ((k + 1 + off) / n) * 2320;
      const tone = 0.88 + pr() * 0.22;
      planks.push(
        <rect key={`${row}-${k}`} x={xa} y={y0} width={xb - xa - 2} height={y1 - y0 - 1.5} fill={dk(pal.floor, 1 - tone > 0 ? 0 : 0)} opacity={1} style={{ fill: mixHex(dk(pal.floor, 0.12), lt(pal.floor, 0.12), pr()) }} />,
      );
    }
  }
  const sway1 = Math.sin(t * 1.1) * 3.2;
  const flick = 0.92 + 0.08 * Math.sin(t * 13) * Math.sin(t * 3.1);
  const walkerX = ((t * 34) % 520) - 100;
  return (
    <g>
      <Defs pal={pal} />
      {/* ceiling + beams */}
      <rect x={-200} y={-300} width={2320} height={430} fill={dk(pal.wall, 0.6)} />
      <rect x={-200} y={-200} width={2320} height={330} fill="url(#wallG)" opacity={0.5} />
      {[200, 760, 1320, 1880].map((x) => (
        <g key={x}>
          <rect x={x - 32} y={-300} width={64} height={432} fill="url(#woodD)" />
          <rect x={x - 32} y={-300} width={64} height={432} fill="#000" opacity={0.12} filter="url(#tex-wood)" />
          <rect x={x + 22} y={-300} width={10} height={432} fill="#000" opacity={0.28} />
        </g>
      ))}
      <rect x={-200} y={118} width={2320} height={22} fill={dk(pal.woodDark, 0.25)} />
      {/* back wall plaster */}
      <rect x={-200} y={130} width={2320} height={690} fill={pal.wall} filter="url(#tex-wall)" />
      <rect x={-200} y={130} width={2320} height={690} fill="url(#wallG)" opacity={0.7} />
      {/* damp stains / wear */}
      <ellipse cx={1020} cy={760} rx={260} ry={60} fill="#000" opacity={0.06} filter="url(#soft14)" />
      <ellipse cx={1700} cy={170} rx={200} ry={40} fill="#000" opacity={0.1} filter="url(#soft14)" />
      {/* wainscot */}
      <rect x={-200} y={690} width={2320} height={125} fill={dk(pal.wall2, 0.12)} filter="url(#tex-wall)" />
      <rect x={-200} y={686} width={2320} height={8} fill={lt(pal.wall2, 0.2)} />
      <rect x={-200} y={694} width={2320} height={5} fill="#000" opacity={0.25} />
      {/* floor */}
      <rect x={-200} y={808} width={2320} height={600} fill={dk(pal.floor, 0.1)} />
      <g filter="url(#tex-floor)">{planks}</g>
      <rect x={-200} y={808} width={2320} height={600} fill="url(#wallG)" opacity={0.0} />
      <rect x={-200} y={808} width={2320} height={600} fill="#000" opacity={0.12} />
      {/* skirting board */}
      <rect x={-200} y={792} width={2320} height={20} fill="url(#woodH)" />
      <rect x={-200} y={810} width={2320} height={8} fill="#000" opacity={0.4} />

      {/* ----- door opening (left) with a living street outside ----- */}
      <g>
        <rect x={74} y={212} width={342} height={612} fill="url(#woodD)" stroke={OUT} strokeWidth={4} />
        <rect x={102} y={240} width={286} height={578} fill={pal.sky} />
        <rect x={102} y={240} width={286} height={578} fill={pal.sky2} opacity={0.55} />
        <g clipPath="url(#doorClip)">
          <clipPath id="doorClip"><rect x={102} y={240} width={286} height={578} /></clipPath>
          <rect x={102} y={240} width={286} height={300} fill={lt(pal.sky2, 0.25)} opacity={0.6} />
          <rect x={110} y={420} width={90} height={400} fill={dk(pal.sky2, 0.22)} opacity={0.75} filter="url(#soft6)" />
          <rect x={210} y={500} width={70} height={320} fill={dk(pal.sky2, 0.32)} opacity={0.7} filter="url(#soft6)" />
          <rect x={286} y={430} width={102} height={312} fill={mixHex(pal.sky2, '#3a3a3a', 0.25)} opacity={0.7} filter="url(#soft6)" />
          <rect x={286} y={462} width={102} height={46} fill="#b5534a" opacity={0.5} filter="url(#soft6)" />
          <rect x={102} y={742} width={286} height={76} fill={mixHex(pal.sky, '#7a6a55', 0.5)} />
          {/* people walking past the door */}
          <g transform={`translate(${walkerX} 0)`} opacity={0.65} filter="url(#soft6)">
            <ellipse cx={120} cy={706} rx={13} ry={14} fill={dk(pal.sky2, 0.5)} />
            <rect x={106} y={716} width={28} height={64} rx={10} fill={dk(pal.sky2, 0.5)} />
            <rect x={108} y={774} width={9} height={44} fill={dk(pal.sky2, 0.55)} transform={`rotate(${Math.sin(t * 7) * 14} 112 774)`} />
            <rect x={122} y={774} width={9} height={44} fill={dk(pal.sky2, 0.55)} transform={`rotate(${-Math.sin(t * 7) * 14} 126 774)`} />
          </g>
        </g>
        <path d="M 102 240 L 150 252 L 150 800 L 102 818 Z" fill="url(#woodH)" stroke={OUT} strokeWidth={3.5} />
        <path d="M 112 262 L 140 268 L 140 780 L 112 790 Z" fill="none" stroke="#000" strokeWidth={2} opacity={0.25} />
        <circle cx={140} cy={520} r={5} fill="#c9a24a" stroke={OUT} strokeWidth={1.5} />
        <rect x={102} y={240} width={286} height={578} fill="url(#glowW)" opacity={0.35} />
      </g>
      <Clock x={246} y={150} r={40} t={t} />

      {/* ----- shelves with depth ----- */}
      {[262, 412, 562].map((yy, i) => (
        <g key={yy}>
          <rect x={462} y={yy - 128} width={1436} height={128} fill="#000" opacity={0.2} />
          <rect x={462} y={yy - 128} width={1436} height={26} fill="#000" opacity={0.18} filter="url(#soft6)" />
          <ShelfItems x0={470} x1={1880} yb={yy} pal={pal} seed={11 + i * 5} sid={`sh${i}`} />
          <rect x={455} y={yy} width={1450} height={17} fill="url(#woodH)" stroke={OUT} strokeWidth={2.5} />
          <rect x={455} y={yy} width={1450} height={4} fill="#fff" opacity={0.25} />
          <rect x={455} y={yy + 17} width={1450} height={10} fill="#000" opacity={0.3} filter="url(#soft6)" />
        </g>
      ))}
      {[455, 905, 1355, 1895].map((x) => (
        <g key={x}>
          <rect x={x - 8} y={130} width={16} height={690} fill="url(#woodD)" stroke={OUT} strokeWidth={2.5} />
          <rect x={x - 8} y={130} width={4} height={690} fill="#fff" opacity={0.1} />
        </g>
      ))}
      {/* lower rear shelf + sacks */}
      <rect x={455} y={800} width={560} height={16} fill="url(#woodH)" stroke={OUT} strokeWidth={2.5} />
      <g>
        <ellipse cx={540} cy={802} rx={70} ry={8} fill="#000" opacity={0.3} />
        <path d="M 480 800 Q 470 730 500 704 Q 540 690 574 706 Q 600 730 592 800 Z" fill="#d8c79c" stroke={OUT} strokeWidth={3} />
        <path d="M 500 710 Q 520 700 560 708 Q 540 740 500 730 Z" fill="#fff" opacity={0.15} />
        <path d="M 500 740 L 570 740" stroke="#a0524a" strokeWidth={6} />
        <path d="M 586 720 Q 594 760 590 800" stroke="#000" strokeWidth={8} opacity={0.12} fill="none" />
      </g>
      <g>
        <ellipse cx={930} cy={802} rx={70} ry={8} fill="#000" opacity={0.3} />
        <path d="M 878 800 Q 868 740 896 718 Q 934 706 968 722 Q 994 744 986 800 Z" fill="#c9b78a" stroke={OUT} strokeWidth={3} />
        <path d="M 896 752 L 964 752" stroke="#6f8a6a" strokeWidth={6} />
        <path d="M 980 740 Q 990 770 986 800" stroke="#000" strokeWidth={8} opacity={0.12} fill="none" />
      </g>
      {stockBox && (
        <g>
          <ellipse cx={715} cy={802} rx={110} ry={8} fill="#000" opacity={0.3} />
          <rect x={620} y={716} width={190} height={84} fill="#b98d57" stroke={OUT} strokeWidth={3} />
          <rect x={620} y={716} width={190} height={84} fill="url(#woodH)" opacity={0.25} />
          <rect x={620} y={716} width={190} height={14} fill="#a27b49" stroke={OUT} strokeWidth={2.5} />
          <path d="M 715 716 v 84" stroke="#000" strokeWidth={2} opacity={0.2} />
          <rect x={650} y={742} width={130} height={40} fill="#efe6cf" stroke={OUT} strokeWidth={2} />
          <path d="M 660 755 q 14 -10 28 0 t 28 0 t 28 0 M 660 770 q 20 -8 40 0 t 38 0" stroke="#2b1d17" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </g>
      )}
      <Fan x={1650} y={118} t={t} />
      {/* hanging bulb (swings, flickers) */}
      {bulb && (
        <g transform={`rotate(${sway1 * 0.6} 1210 100)`}>
          <line x1={1210} y1={100} x2={1210} y2={205} stroke={OUT} strokeWidth={3} />
          <rect x={1202} y={196} width={16} height={14} fill="#3a3a3a" stroke={OUT} strokeWidth={2} />
          <ellipse cx={1210} cy={226} rx={19} ry={25} fill="#fff4cc" stroke={OUT} strokeWidth={2.5} />
          <ellipse cx={1204} cy={218} rx={6} ry={9} fill="#fff" opacity={0.7} />
          <circle cx={1210} cy={226} r={170} fill="url(#glowW)" opacity={0.55 * flick} />
        </g>
      )}
      {/* light shaft from the door */}
      <defs>
        <linearGradient id="shaft" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={pal.light} stopOpacity={pal.lightOp * 1.3} />
          <stop offset="1" stopColor={pal.light} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g filter="url(#soft14)">
        <polygon points="390,250 1100,520 1180,1080 330,1080 390,818" fill="url(#shaft)" opacity={0.85 + 0.15 * Math.sin(t * 0.7)} />
      </g>
      {/* window pool on the floor */}
      <polygon points="330,880 760,880 900,1080 250,1080" fill={pal.light} opacity={pal.lightOp * 0.8} filter="url(#soft14)" />
      {dust.map((d, i) => (
        <circle key={i} cx={d.x + sway(t, 14, 7 + (i % 5), d.p)} cy={d.y + sway(t, 22, 9 + (i % 4), d.p) + sway(t, 14, 17, d.p * 2)} r={d.s} fill="#fff7de" opacity={0.28 + 0.2 * Math.sin(t * 0.9 + d.p)} />
      ))}
    </g>
  );
};

/** the counter that characters stand behind (draw after back-actors, before props on top) */
export const ShopCounter: React.FC<{ pal: Pal; t?: number }> = ({ pal }) => (
  <g>
    <defs>
      <linearGradient id="ctrTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lt(pal.wood, 0.4)} />
        <stop offset="0.35" stopColor={lt(pal.wood, 0.15)} />
        <stop offset="1" stopColor={dk(pal.wood, 0.15)} />
      </linearGradient>
      <linearGradient id="ctrFront" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={dk(pal.wood, 0.05)} />
        <stop offset="1" stopColor={dk(pal.wood, 0.3)} />
      </linearGradient>
      <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e6f3f0" stopOpacity={0.85} />
        <stop offset="1" stopColor="#a8c4c0" stopOpacity={0.45} />
      </linearGradient>
    </defs>
    {/* floor shadow in front of the counter */}
    <ellipse cx={1530} cy={1210} rx={640} ry={46} fill="#000" opacity={0.35} filter="url(#soft14)" />
    <rect x={985} y={652} width={1100} height={560} fill="url(#ctrFront)" stroke={OUT} strokeWidth={4} />
    <rect x={985} y={652} width={1100} height={560} fill="#000" opacity={0.1} filter="url(#tex-wood)" />
    {Array.from({ length: 9 }).map((_, i) => (
      <g key={i}>
        <rect x={1003 + i * 120} y={690} width={104} height={250} rx={3} fill="none" stroke="#000" strokeWidth={3} opacity={0.35} />
        <rect x={1006 + i * 120} y={693} width={98} height={244} rx={3} fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.12} />
        <rect x={1003 + i * 120} y={970} width={104} height={200} rx={3} fill="none" stroke="#000" strokeWidth={3} opacity={0.3} />
      </g>
    ))}
    <rect x={985} y={652} width={1100} height={36} fill="#000" opacity={0.3} filter="url(#soft6)" />
    <rect x={985} y={1190} width={1100} height={22} fill="#000" opacity={0.45} />
    {/* top surface (glossy) */}
    <path d="M 972 626 L 2085 626 L 2085 658 L 972 658 Z" fill="url(#ctrTop)" stroke={OUT} strokeWidth={4} />
    <path d="M 972 626 L 2085 626 L 2085 658 L 972 658 Z" fill="#000" opacity={0.14} filter="url(#tex-wood)" />
    <path d="M 980 631 L 2085 631 L 2085 636 L 980 636 Z" fill="#fff" opacity={0.35} />
    <path d="M 972 652 L 2085 652 L 2085 658 L 972 658 Z" fill="#000" opacity={0.25} />
    <path d="M 1160 628 L 1300 628 L 1270 640 L 1120 640 Z" fill="#fff" opacity={0.12} />
    <rect x={985} y={656} width={22} height={560} fill="#000" opacity={0.25} />
    {/* brass scale on the counter */}
    <g transform="translate(1830 628)">
      <ellipse cx={72} cy={-2} rx={86} ry={6} fill="#000" opacity={0.3} />
      <rect x={-6} y={-8} width={150} height={8} fill="#8a8a86" stroke={OUT} strokeWidth={2.5} />
      <rect x={-6} y={-8} width={150} height={3} fill="#fff" opacity={0.35} />
      <line x1={69} y1={-8} x2={69} y2={-110} stroke="#8a7a45" strokeWidth={6} />
      <line x1={0} y1={-110} x2={140} y2={-110} stroke="#a89350" strokeWidth={5} />
      <path d="M -6 -108 Q 10 -70 26 -108 M 114 -108 Q 130 -70 146 -108" stroke="#7a6a35" strokeWidth={3.5} fill="#cfc29a" />
      <circle cx={69} cy={-112} r={6} fill="#d4aa45" stroke={OUT} strokeWidth={2} />
    </g>
    {/* glass jar of sweets */}
    <g transform="translate(1610 628)">
      <ellipse cx={32} cy={0} rx={44} ry={5} fill="#000" opacity={0.3} />
      <rect x={0} y={-62} width={64} height={62} rx={10} fill="url(#glassG)" stroke={OUT} strokeWidth={3} />
      <rect x={-4} y={-72} width={72} height={14} rx={4} fill="#b64c3f" stroke={OUT} strokeWidth={3} />
      <circle cx={20} cy={-20} r={8} fill="#e7b04a" /><circle cx={42} cy={-16} r={8} fill="#c85d4a" /><circle cx={34} cy={-34} r={8} fill="#e7b04a" /><circle cx={16} cy={-38} r={7} fill="#6a9a55" /><circle cx={48} cy={-38} r={7} fill="#d46a8a" />
      <rect x={6} y={-56} width={5} height={44} rx={2.5} fill="#fff" opacity={0.5} />
    </g>
  </g>
);

/* ============================ HOME DINING ROOM ============================ */
export const HomeRoom: React.FC<{ pal: Pal; t: number }> = ({ pal, t }) => {
  const flick = 0.9 + 0.1 * Math.sin(t * 9.3) * Math.sin(t * 2.7);
  const curtain = Math.sin(t * 0.8) * 7;
  const planks = Array.from({ length: 12 }).map((_, i) => {
    const r = rng(40 + i);
    const y0 = 808 + Math.pow(i / 12, 1.5) * 520;
    const y1 = 808 + Math.pow((i + 1) / 12, 1.5) * 520;
    return (
      <g key={i}>
        <rect x={-200} y={y0} width={2320} height={y1 - y0} fill={mixHex(dk(pal.floor, 0.1), lt(pal.floor, 0.1), r())} />
        <rect x={-200} y={y0} width={2320} height={2} fill="#000" opacity={0.4} />
        {Array.from({ length: 8 }).map((_, k) => (
          <rect key={k} x={-200 + (k + (i % 2) * 0.5) * 300 + r() * 20} y={y0} width={2} height={y1 - y0} fill="#000" opacity={0.35} />
        ))}
      </g>
    );
  });
  return (
    <g>
      <Defs pal={pal} />
      <rect x={-200} y={-300} width={2320} height={1100} fill={pal.wall} filter="url(#tex-wall)" />
      <rect x={-200} y={-300} width={2320} height={1100} fill="url(#wallG)" opacity={0.8} />
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={-60 + i * 170} y={-100} width={3} height={880} fill={pal.wall2} opacity={0.25} />
      ))}
      <rect x={-200} y={560} width={2320} height={250} fill={dk(pal.wall2, 0.15)} opacity={0.6} filter="url(#tex-wall)" />
      <rect x={-200} y={556} width={2320} height={9} fill={lt(pal.wall2, 0.25)} opacity={0.8} />
      <rect x={-200} y={565} width={2320} height={6} fill="#000" opacity={0.25} />
      <rect x={-200} y={808} width={2320} height={600} fill={pal.floor} />
      <g filter="url(#tex-floor)">{planks}</g>
      <rect x={-200} y={808} width={2320} height={600} fill="#000" opacity={0.18} />
      <rect x={-200} y={786} width={2320} height={24} fill="url(#woodH)" />
      <rect x={-200} y={808} width={2320} height={8} fill="#000" opacity={0.45} />
      {/* window with night sky + moon */}
      <g>
        <rect x={1318} y={158} width={424} height={424} fill="url(#woodD)" stroke={OUT} strokeWidth={4} />
        <defs>
          <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={dk(pal.sky, 0.25)} />
            <stop offset="1" stopColor={lt(pal.sky, 0.12)} />
          </linearGradient>
        </defs>
        <rect x={1348} y={188} width={364} height={364} fill="url(#nightSky)" />
        <circle cx={1626} cy={252} r={70} fill="#fff6d8" opacity={0.12} filter="url(#soft14)" />
        <circle cx={1626} cy={252} r={26} fill="#fff4cc" />
        <circle cx={1636} cy={246} r={22} fill={pal.sky} opacity={0.35} />
        {Array.from({ length: 12 }).map((_, i) => (
          <circle key={i} cx={1370 + ((i * 97) % 320)} cy={206 + ((i * 53) % 150)} r={1.4 + (i % 3) * 0.6} fill="#fff6d8" opacity={0.4 + 0.5 * Math.abs(Math.sin(t * 1.3 + i * 1.7))} />
        ))}
        <path d="M 1348 552 L 1348 470 L 1390 470 L 1390 430 L 1450 430 L 1450 480 L 1520 480 L 1520 410 L 1580 410 L 1580 500 L 1640 500 L 1640 450 L 1712 450 L 1712 552 Z" fill={dk(pal.sky, 0.65)} opacity={0.85} />
        {[1400, 1536, 1600].map((x, i) => <rect key={i} x={x} y={450 + i * 8} width={10} height={14} fill="#ffd98a" opacity={0.7 + 0.2 * Math.sin(t * 0.5 + i)} />)}
        <line x1={1530} y1={188} x2={1530} y2={552} stroke={pal.woodDark} strokeWidth={9} />
        <line x1={1348} y1={370} x2={1712} y2={370} stroke={pal.woodDark} strokeWidth={9} />
        <path d="M 1360 200 L 1500 200 L 1360 400 Z" fill="#fff" opacity={0.05} />
        <rect x={1318} y={572} width={424} height={16} fill="url(#woodH)" stroke={OUT} strokeWidth={2.5} />
        <path d={`M 1330 158 Q ${1380 + curtain} 340 ${1340 + curtain * 0.6} 586 L 1270 586 Q ${1310 + curtain} 340 1290 158 Z`} fill="#9c5b52" stroke={OUT} strokeWidth={3} opacity={0.95} />
        <path d={`M 1730 158 Q ${1680 - curtain} 340 ${1720 - curtain * 0.6} 586 L 1790 586 Q ${1750 - curtain} 340 1770 158 Z`} fill="#9c5b52" stroke={OUT} strokeWidth={3} opacity={0.95} />
        <path d={`M 1316 180 Q ${1340 + curtain} 360 1318 580 M 1300 180 Q ${1324 + curtain} 360 1304 580`} stroke="#000" strokeWidth={4} opacity={0.18} fill="none" />
        <path d={`M 1744 180 Q ${1720 - curtain} 360 1742 580 M 1760 180 Q ${1736 - curtain} 360 1756 580`} stroke="#000" strokeWidth={4} opacity={0.18} fill="none" />
      </g>
      {/* moon spill on the floor */}
      <polygon points="1360,590 1720,590 1500,1000 1120,1000" fill={pal.light} opacity={0.07} filter="url(#soft14)" />
      <Clock x={560} y={240} r={46} t={t} />
      <g transform="translate(260 180)">
        <rect x={4} y={6} width={130} height={170} fill="#000" opacity={0.25} filter="url(#soft6)" />
        <rect width={130} height={170} fill="#efe6d0" stroke={OUT} strokeWidth={3} />
        <rect width={130} height={40} fill="#a64d43" stroke={OUT} strokeWidth={3} />
        {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => <rect key={`${r}${c}`} x={12 + c * 22} y={56 + r * 26} width={14} height={14} fill="#7a6a55" opacity={0.5} />))}
      </g>
      {/* framed family photos */}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${760 + i * 96} ${300 - i * 20})`}>
          <rect x={3} y={5} width={70} height={84} fill="#000" opacity={0.25} filter="url(#soft6)" />
          <rect width={70} height={84} fill="url(#woodD)" stroke={OUT} strokeWidth={2.5} />
          <rect x={7} y={7} width={56} height={70} fill={i ? '#b9a98a' : '#a9b3a0'} />
          <circle cx={35} cy={32} r={11} fill="#6a5a48" opacity={0.7} />
          <path d="M 14 77 Q 35 46 56 77 Z" fill="#6a5a48" opacity={0.7} />
        </g>
      ))}
      {/* pendant lamp */}
      <g transform={`rotate(${Math.sin(t * 0.9) * 0.6} 900 -100)`}>
        <line x1={900} y1={-300} x2={900} y2={150} stroke={OUT} strokeWidth={4} />
        <path d="M 836 214 Q 836 148 900 144 Q 964 148 964 214 Z" fill="#c5a15c" stroke={OUT} strokeWidth={3.5} />
        <path d="M 856 200 Q 860 166 890 156" stroke="#fff" strokeWidth={4} opacity={0.3} fill="none" strokeLinecap="round" />
        <ellipse cx={900} cy={214} rx={36} ry={9} fill="#fff1c4" />
        <circle cx={900} cy={230} r={150} fill="url(#glowW)" opacity={0.55 * flick} />
        <polygon points="866,216 934,216 1160,830 640,830" fill="#ffd89a" opacity={0.09 * flick} filter="url(#soft14)" />
      </g>
    </g>
  );
};

export const DiningTable: React.FC<{ pal: Pal; x?: number; plates?: boolean }> = ({ pal, x = 560, plates = true }) => (
  <g>
    <defs>
      <linearGradient id="tblTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lt(pal.wood, 0.42)} />
        <stop offset="1" stopColor={dk(pal.wood, 0.1)} />
      </linearGradient>
      <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b8564b" />
        <stop offset="1" stopColor="#8d3a33" />
      </linearGradient>
      <linearGradient id="plateG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fbf7ee" />
        <stop offset="1" stopColor="#cfc7b4" />
      </linearGradient>
    </defs>
    <ellipse cx={x + 490} cy={1205} rx={560} ry={40} fill="#000" opacity={0.35} filter="url(#soft14)" />
    <rect x={x} y={690} width={980} height={520} fill={dk(pal.wood, 0.35)} stroke={OUT} strokeWidth={4} />
    <rect x={x} y={690} width={980} height={520} fill="#000" opacity={0.25} filter="url(#tex-wood)" />
    <rect x={x} y={690} width={980} height={60} fill="#000" opacity={0.3} filter="url(#soft6)" />
    {/* tablecloth drape */}
    <path d={`M ${x + 4} 696 L ${x + 976} 696 L ${x + 976} 772 Q ${x + 900} 784 ${x + 820} 772 Q ${x + 740} 786 ${x + 660} 772 Q ${x + 580} 784 ${x + 490} 772 Q ${x + 400} 786 ${x + 320} 772 Q ${x + 240} 784 ${x + 160} 772 Q ${x + 80} 786 ${x + 4} 772 Z`} fill="url(#cloth)" stroke={OUT} strokeWidth={3} />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={x + 6 + i * 81} y={696} width={34} height={82} fill="#e6d9b9" opacity={0.22} />
    ))}
    <rect x={x - 30} y={660} width={1040} height={38} rx={6} fill="url(#tblTop)" stroke={OUT} strokeWidth={4} />
    <rect x={x - 30} y={660} width={1040} height={38} rx={6} fill="#000" opacity={0.12} filter="url(#tex-wood)" />
    <rect x={x - 24} y={664} width={1028} height={5} rx={2} fill="#fff" opacity={0.35} />
    <rect x={x - 30} y={690} width={1040} height={10} fill="#000" opacity={0.3} />
    {plates && (
      <g>
        {[250, 520].map((dx, i) => (
          <g key={i}>
            <ellipse cx={x + dx + 6} cy={654} rx={74} ry={12} fill="#000" opacity={0.28} />
            <ellipse cx={x + dx} cy={650} rx={70} ry={11} fill="url(#plateG)" stroke={OUT} strokeWidth={3} />
            <ellipse cx={x + dx} cy={649} rx={48} ry={7} fill="none" stroke="#b9b09a" strokeWidth={1.5} />
            <ellipse cx={x + dx} cy={647} rx={36} ry={5.5} fill={i ? '#e5d3a0' : '#c9a24a'} opacity={0.8} />
            <circle cx={x + dx - 12} cy={646} r={4} fill="#8a6a2a" opacity={0.6} />
            <circle cx={x + dx + 10} cy={647} r={3} fill="#6a8a3a" opacity={0.6} />
          </g>
        ))}
        <ellipse cx={x + 782} cy={656} rx={26} ry={6} fill="#000" opacity={0.28} />
        <rect x={x + 760} y={582} width={38} height={72} rx={8} fill="#c5dbe3" opacity={0.6} stroke={OUT} strokeWidth={3} />
        <rect x={x + 764} y={612} width={30} height={38} rx={5} fill="#8fb3c4" opacity={0.55} />
        <rect x={x + 766} y={588} width={4} height={56} rx={2} fill="#fff" opacity={0.6} />
        <ellipse cx={x + 875} cy={656} rx={34} ry={6} fill="#000" opacity={0.28} />
        <path d={`M ${x + 850} 654 L ${x + 850} 560 Q ${x + 900} 560 ${x + 900} 600 L ${x + 890} 654 Z`} fill="#8a9bb0" stroke={OUT} strokeWidth={3} />
        <path d={`M ${x + 856} 650 L ${x + 856} 570`} stroke="#fff" strokeWidth={4} opacity={0.35} />
      </g>
    )}
  </g>
);

/* ============================ MAHIN'S ROOM ============================ */
export const MahinRoom: React.FC<{ pal: Pal; t: number }> = ({ pal, t }) => {
  const curtain = Math.sin(t * 0.7) * 6;
  const shirt = Math.sin(t * 1.0) * 2.6;
  return (
    <g>
      <Defs pal={pal} />
      <rect x={-200} y={-300} width={2320} height={1100} fill={pal.wall} filter="url(#tex-wall)" />
      <rect x={-200} y={-300} width={2320} height={1100} fill="url(#wallG)" opacity={0.8} />
      <rect x={-200} y={600} width={2320} height={210} fill={dk(pal.wall2, 0.1)} opacity={0.55} filter="url(#tex-wall)" />
      <rect x={-200} y={808} width={2320} height={600} fill={pal.floor} filter="url(#tex-floor)" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={-200} y={808 + Math.pow(i / 12, 1.5) * 520} width={2320} height={2} fill="#000" opacity={0.35} />
      ))}
      <rect x={-200} y={808} width={2320} height={600} fill="#000" opacity={0.15} />
      <rect x={-200} y={786} width={2320} height={24} fill="url(#woodH)" />
      <rect x={-200} y={808} width={2320} height={8} fill="#000" opacity={0.45} />
      {/* rug */}
      <ellipse cx={1000} cy={980} rx={420} ry={64} fill="#7a4a46" stroke={OUT} strokeWidth={3} opacity={0.9} />
      <ellipse cx={1000} cy={980} rx={340} ry={46} fill="none" stroke="#d3a64c" strokeWidth={4} opacity={0.6} />
      {/* window */}
      <g>
        <rect x={750} y={160} width={350} height={360} fill="url(#woodD)" stroke={OUT} strokeWidth={4} />
        <rect x={778} y={188} width={294} height={304} fill={pal.sky} />
        <rect x={778} y={188} width={294} height={130} fill={pal.sky2} />
        <rect x={778} y={188} width={294} height={304} fill="url(#glowW)" opacity={0.3} />
        <line x1={925} y1={188} x2={925} y2={492} stroke={pal.woodDark} strokeWidth={8} />
        <line x1={778} y1={340} x2={1072} y2={340} stroke={pal.woodDark} strokeWidth={8} />
        <path d={`M 760 160 Q ${795 + curtain} 330 ${770 + curtain * 0.5} 520 L 722 520 Q ${742 + curtain} 330 730 160 Z`} fill="#6c7f88" stroke={OUT} strokeWidth={3} opacity={0.92} />
        <path d={`M 1090 160 Q ${1055 - curtain} 330 ${1080 - curtain * 0.5} 520 L 1128 520 Q ${1108 - curtain} 330 1120 160 Z`} fill="#6c7f88" stroke={OUT} strokeWidth={3} opacity={0.92} />
        <rect x={750} y={520} width={350} height={14} fill="url(#woodH)" stroke={OUT} strokeWidth={2.5} />
      </g>
      <g filter="url(#soft14)">
        <polygon points="780,540 1080,540 1260,1000 620,1000" fill={pal.light} opacity={0.14} />
      </g>
      {/* bed */}
      <g>
        <ellipse cx={270} cy={884} rx={340} ry={22} fill="#000" opacity={0.35} filter="url(#soft6)" />
        <rect x={-40} y={620} width={620} height={260} rx={14} fill="url(#woodH)" stroke={OUT} strokeWidth={4} />
        <rect x={-40} y={600} width={620} height={110} rx={18} fill="#7b95a0" stroke={OUT} strokeWidth={4} />
        <path d="M -40 640 Q 150 660 330 636 Q 460 622 580 650" stroke="#4d6670" strokeWidth={4} fill="none" opacity={0.7} />
        <path d="M 60 610 Q 100 650 90 706 M 200 606 Q 240 650 226 708 M 360 604 Q 400 650 390 708" stroke="#000" strokeWidth={5} opacity={0.1} fill="none" />
        <rect x={-40} y={540} width={140} height={150} rx={22} fill="#e8e0cc" stroke={OUT} strokeWidth={4} />
        <path d="M -20 570 Q 30 590 80 566 M -20 610 Q 30 628 80 606" stroke="#a89f88" strokeWidth={3} fill="none" opacity={0.6} />
        <path d="M 120 640 Q 300 610 560 650" stroke="#5e7782" strokeWidth={5} fill="none" />
        <rect x={-40} y={600} width={620} height={30} rx={12} fill="#fff" opacity={0.1} />
      </g>
      {/* small table + folded clothes */}
      <g>
        <ellipse cx={1575} cy={840} rx={190} ry={14} fill="#000" opacity={0.3} filter="url(#soft6)" />
        <rect x={1410} y={640} width={330} height={26} rx={4} fill="url(#woodH)" stroke={OUT} strokeWidth={4} />
        <rect x={1432} y={666} width={26} height={170} fill="url(#woodD)" stroke={OUT} strokeWidth={3} />
        <rect x={1692} y={666} width={26} height={170} fill="url(#woodD)" stroke={OUT} strokeWidth={3} />
        <rect x={1470} y={596} width={150} height={44} rx={6} fill="#4f8089" stroke={OUT} strokeWidth={3} />
        <path d="M 1478 612 H 1612 M 1478 626 H 1612" stroke="#000" strokeWidth={2} opacity={0.2} />
        <rect x={1480} y={556} width={130} height={42} rx={6} fill="#c9b78f" stroke={OUT} strokeWidth={3} />
        <path d="M 1488 572 H 1602" stroke="#000" strokeWidth={2} opacity={0.18} />
        <rect x={1640} y={604} width={52} height={36} rx={6} fill="#a8553f" stroke={OUT} strokeWidth={3} />
      </g>
      {/* hanging shirt (sways in the breeze) */}
      <g transform={`translate(1220 150) rotate(${shirt} 0 0)`}>
        <line x1={0} y1={-300} x2={0} y2={60} stroke={OUT} strokeWidth={3} />
        <path d="M -42 60 L 42 60 L 0 38 Z" fill="none" stroke="#6a5a48" strokeWidth={4} />
        <path d="M -38 66 L -20 62 Q 0 74 20 62 L 38 66 L 62 110 L 42 120 L 44 230 L -44 230 L -42 120 L -62 110 Z" fill="#8f9fa8" stroke={OUT} strokeWidth={3} opacity={0.95} />
        <path d="M 0 74 V 230" stroke="#000" strokeWidth={2} opacity={0.25} />
        <path d="M 14 100 Q 30 160 24 228" stroke="#000" strokeWidth={10} opacity={0.08} fill="none" />
      </g>
    </g>
  );
};

/* ============================ BAZAAR STREET / SHOP EXTERIOR ============================ */
const Person2: React.FC<{ x: number; y: number; t: number; c: string; s?: number; ph?: number }> = ({ x, y, t, c, s = 1, ph = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.85}>
    <ellipse cx={0} cy={4} rx={26} ry={5} fill="#000" opacity={0.25} />
    <rect x={-6} y={-56} width={7} height={56} fill={dk(c, 0.5)} transform={`rotate(${Math.sin(t * 6 + ph) * 16} 0 -56)`} />
    <rect x={2} y={-56} width={7} height={56} fill={dk(c, 0.55)} transform={`rotate(${-Math.sin(t * 6 + ph) * 16} 4 -56)`} />
    <rect x={-13} y={-112} width={26} height={62} rx={9} fill={c} />
    <circle cx={0} cy={-124} r={12} fill="#a9835f" />
    <path d="M -12 -128 Q 0 -146 12 -128 Z" fill="#2a2018" />
  </g>
);

export const Street: React.FC<{ pal: Pal; t: number; garland?: boolean; doorGlow?: number; shutter?: number }> = ({
  pal, t, garland = false, doorGlow = 0, shutter = 0,
}) => {
  const r = rng(91);
  const far = Array.from({ length: 14 }).map((_, i) => ({ x: -100 + i * 160, w: 120 + r() * 80, h: 160 + r() * 200 }));
  const mid = Array.from({ length: 9 }).map((_, i) => ({ x: -140 + i * 270, w: 200 + r() * 70, h: 120 + r() * 120 }));
  const flutter = Math.sin(t * 3) * 1.4;
  const cloud = (t * 6) % 2600;
  const rickX = 2200 - ((t * 52) % 2900);
  const pedX1 = ((t * 40) % 2600) - 300;
  const pedX2 = 2300 - ((t * 33 + 700) % 2600);
  return (
    <g>
      <Defs pal={pal} />
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.sky2} />
          <stop offset="0.8" stopColor={pal.sky} />
          <stop offset="1" stopColor={lt(pal.sky, 0.25)} />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixHex(pal.floor, '#9a8a70', 0.4)} />
          <stop offset="1" stopColor={dk(mixHex(pal.floor, '#9a8a70', 0.3), 0.3)} />
        </linearGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.sky} stopOpacity={0} />
          <stop offset="1" stopColor={pal.sky} stopOpacity={0.7} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-300} width={2320} height={1100} fill="url(#sky)" />
      <circle cx={1500} cy={120} r={140} fill="url(#glowW)" opacity={0.7} />
      {/* drifting clouds */}
      {[0, 1, 2].map((k) => (
        <g key={k} opacity={0.5} filter="url(#soft14)" transform={`translate(${((cloud + k * 900) % 2600) - 400} ${60 + k * 70})`}>
          <ellipse cx={0} cy={0} rx={170} ry={28} fill="#fff" />
          <ellipse cx={80} cy={-16} rx={110} ry={26} fill="#fff" />
          <ellipse cx={-70} cy={-10} rx={90} ry={20} fill="#fff" />
        </g>
      ))}
      {/* far skyline (hazy) */}
      {far.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={720 - b.h} width={b.w} height={b.h + 100} fill={mixHex(pal.sky2, '#3a3a3a', 0.2 + (i % 3) * 0.05)} opacity={0.7} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={b.x + 14 + k * 30} y={720 - b.h + 24} width={16} height={22} fill={mixHex(pal.sky, '#fff', 0.2)} opacity={0.45} />
          ))}
        </g>
      ))}
      <rect x={-200} y={420} width={2320} height={380} fill="url(#haze)" />
      {mid.map((b, i) => (
        <g key={i} opacity={0.85}>
          <rect x={b.x} y={780 - b.h} width={b.w} height={b.h + 40} fill={mixHex(pal.wall2, '#3a3a3a', 0.35 + (i % 2) * 0.08)} />
          <rect x={b.x} y={780 - b.h} width={b.w} height={10} fill="#000" opacity={0.2} />
          {[0, 1, 2].map((k) => <rect key={k} x={b.x + 22 + k * 56} y={780 - b.h + 30} width={30} height={40} fill={dk(pal.sky2, 0.35)} opacity={0.6} />)}
        </g>
      ))}
      {/* power lines + birds */}
      <path d="M -100 250 Q 480 320 1000 260 T 2100 280" stroke="#2a2a2a" strokeWidth={2.4} fill="none" opacity={0.6} />
      <path d="M -100 276 Q 480 346 1000 286 T 2100 306" stroke="#2a2a2a" strokeWidth={2} fill="none" opacity={0.5} />
      {[0, 1, 2, 3].map((k) => {
        const bx = ((t * (90 + k * 14) + k * 400) % 2500) - 200;
        const by = 150 + k * 38 + Math.sin(t * 1.4 + k) * 12;
        const fl = Math.sin(t * 9 + k * 2) * 7;
        return <path key={k} d={`M ${bx - 14} ${by + fl} Q ${bx - 6} ${by - 4} ${bx} ${by} Q ${bx + 6} ${by - 4} ${bx + 14} ${by + fl}`} stroke="#2a2a2a" strokeWidth={2.4} fill="none" opacity={0.6} />;
      })}
      {/* road */}
      <rect x={-200} y={790} width={2320} height={520} fill="url(#road)" filter="url(#tex-floor)" />
      <rect x={-200} y={774} width={2320} height={30} fill={mixHex(pal.floor, '#7a6a55', 0.5)} />
      <rect x={-200} y={804} width={2320} height={6} fill="#000" opacity={0.25} />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M ${-100 + i * 260} 860 q 60 -12 130 0`} stroke={dk(pal.floor, 0.3)} strokeWidth={3} fill="none" opacity={0.35} />
      ))}
      <ellipse cx={1180} cy={1020} rx={260} ry={22} fill={pal.sky} opacity={0.35} />
      <ellipse cx={1180} cy={1020} rx={200} ry={12} fill="#fff" opacity={0.18} />
      {/* passers-by + rickshaw (behind the main action) */}
      <Person2 x={pedX1} y={846} t={t} c="#8a5a4a" s={0.85} />
      <Person2 x={pedX2} y={852} t={t} c="#4a6a7a" s={0.8} ph={2} />
      <g transform={`translate(${rickX} 862)`} opacity={0.9}>
        <ellipse cx={0} cy={4} rx={150} ry={10} fill="#000" opacity={0.25} />
        {[-70, 70].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={-34} r={34} fill="none" stroke="#222" strokeWidth={6} />
            <g transform={`rotate(${-t * 220} ${cx} -34)`}>
              <path d={`M ${cx - 34} -34 H ${cx + 34} M ${cx} -68 V 0 M ${cx - 24} -58 L ${cx + 24} -10 M ${cx + 24} -58 L ${cx - 24} -10`} stroke="#777" strokeWidth={1.6} />
            </g>
          </g>
        ))}
        <path d="M -70 -34 L -20 -70 L 40 -70 L 70 -34" stroke="#3a3a3a" strokeWidth={6} fill="none" />
        <path d="M -30 -150 Q 30 -170 80 -140 L 74 -80 L -34 -80 Z" fill="#a64d43" stroke={OUT} strokeWidth={3} />
        <circle cx={-120} cy={-80} r={11} fill="#a9835f" />
        <rect x={-130} y={-70} width={22} height={40} rx={7} fill="#6a7a5a" />
      </g>

      {/* neighbouring stall (left) */}
      <g>
        <rect x={60} y={500} width={360} height={290} fill="#8f8062" stroke={OUT} strokeWidth={3.5} filter="url(#tex-wall)" />
        <path d={`M 40 500 L 440 500 L ${400 + flutter} 430 L ${80 + flutter} 430 Z`} fill="#a64d43" stroke={OUT} strokeWidth={3.5} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={60 + i * 72} y={430} width={36} height={70} fill="#e6d9b9" opacity={0.5} />
        ))}
        <rect x={60} y={500} width={360} height={14} fill="#000" opacity={0.25} filter="url(#soft6)" />
        <rect x={110} y={640} width={260} height={30} fill="url(#woodH)" stroke={OUT} strokeWidth={3} />
        {[0, 1, 2, 3, 4].map((i) => <g key={i}><ellipse cx={140 + i * 50 + 4} cy={644} rx={22} ry={5} fill="#000" opacity={0.25} /><circle cx={140 + i * 50} cy={620} r={22} fill={['#c9533c', '#d9a53c', '#6a9a55', '#d9a53c', '#c9533c'][i]} stroke={OUT} strokeWidth={2.5} /><ellipse cx={134 + i * 50} cy={612} rx={6} ry={4} fill="#fff" opacity={0.4} /></g>)}
        {/* kettle steam */}
        {[0, 1, 2].map((k) => (
          <ellipse key={k} cx={330 + Math.sin(t * 1.5 + k) * 8} cy={600 - ((t * 24 + k * 22) % 66)} rx={8 + k * 2} ry={11} fill="#fff" opacity={0.25 * (1 - ((t * 24 + k * 22) % 66) / 66)} filter="url(#soft6)" />
        ))}
      </g>
      {/* neighbouring stall (right) */}
      <g>
        <rect x={1520} y={500} width={420} height={290} fill="#7f8a82" stroke={OUT} strokeWidth={3.5} filter="url(#tex-wall)" />
        <path d={`M 1500 500 L 1960 500 L ${1920 + flutter} 430 L ${1540 + flutter} 430 Z`} fill="#4f8089" stroke={OUT} strokeWidth={3.5} />
        <rect x={1570} y={650} width={300} height={34} fill="url(#woodH)" stroke={OUT} strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => <g key={i}><rect x={1590 + i * 70} y={600} width={46} height={50} fill={['#d9a53c', '#b8765a', '#e0d8c4', '#6f8a6a'][i]} stroke={OUT} strokeWidth={2.5} /><rect x={1594 + i * 70} y={604} width={6} height={40} fill="#fff" opacity={0.25} /></g>)}
      </g>

      {/* the shop front */}
      <g>
        <rect x={500} y={300} width={940} height={500} fill={pal.wall} filter="url(#tex-wall)" stroke={OUT} strokeWidth={4} />
        <rect x={500} y={300} width={940} height={500} fill="url(#wallG)" opacity={0.5} />
        <rect x={500} y={300} width={940} height={110} fill={dk(pal.wall2, 0.12)} stroke={OUT} strokeWidth={4} />
        <rect x={500} y={408} width={940} height={14} fill="#000" opacity={0.3} filter="url(#soft6)" />
        <rect x={560} y={322} width={820} height={66} rx={8} fill="#e6dcc3" stroke={OUT} strokeWidth={3.5} />
        <rect x={566} y={328} width={808} height={10} rx={4} fill="#fff" opacity={0.3} />
        <path d="M 600 358 q 30 -22 60 0 t 60 0 M 760 358 h 120 M 920 352 q 20 -20 40 0 t 40 0 M 1040 358 h 80 M 1160 358 q 30 -22 60 0" stroke="#7a3d33" strokeWidth={6} fill="none" strokeLinecap="round" />
        <rect x={560} y={440} width={820} height={360} fill={dk(pal.woodDark, 0.3)} stroke={OUT} strokeWidth={4} />
        <rect x={580} y={456} width={780} height={340 * (1 - shutter) + 4} fill={mixHex(pal.wall2, '#fff', 0.1)} />
        <rect x={580} y={456} width={780} height={340} fill="#ffd89a" opacity={doorGlow * 0.55} />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} opacity={0.65}>
            <rect x={600 + i * 150} y={480} width={110} height={80} fill={pal.item[i % 8]} stroke={OUT} strokeWidth={2.5} />
            <rect x={600 + i * 150} y={480} width={110} height={80} fill="url(#wallG)" opacity={0.25} />
          </g>
        ))}
        <rect x={580} y={456} width={780} height={340 * shutter} fill="#8c8f8a" stroke={OUT} strokeWidth={4} />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={580} y1={456 + i * 30} x2={1360} y2={456 + i * 30} stroke={OUT} strokeWidth={2} opacity={shutter > 0.05 ? 0.4 : 0} />
        ))}
        <rect x={1180} y={700} width={38} height={46} rx={8} fill="#c4aa55" stroke={OUT} strokeWidth={3.5} />
        <rect x={1186} y={704} width={6} height={36} rx={3} fill="#fff" opacity={0.4} />
        <circle cx={1199} cy={720} r={6} fill={OUT} />
      </g>
      {garland && (
        <g>
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M ${520 + k * 300} 424 Q ${670 + k * 300 + flutter * 2} ${540 + flutter * 3} ${820 + k * 300} 424`} stroke="#d98a2b" strokeWidth={10} fill="none" strokeDasharray="14 6" strokeLinecap="round" />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <circle key={i} cx={560 + i * 100} cy={440 + Math.sin(i * 1.6) * 8 + Math.sin(t * 2 + i) * 2} r={12} fill={i % 2 ? '#e8a33a' : '#d46a2b'} stroke={OUT} strokeWidth={2} />
          ))}
        </g>
      )}
      <ellipse cx={970} cy={806} rx={560} ry={16} fill="#000" opacity={0.28} filter="url(#soft6)" />
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={((i * 211 + t * 12) % 2100) - 80} cy={200 + ((i * 97) % 500) + sway(t, 12, 5, i)} r={2.2} fill="#fff" opacity={0.3} />
      ))}
    </g>
  );
};
