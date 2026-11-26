import React from 'react';
import { lerp } from '../lib/anim';

const OUT = '#2b1d17';
const BRASS = '#d4aa45';

export const Key: React.FC<{ x: number; y: number; rot?: number; s?: number; shine?: number }> = ({
  x, y, rot = 0, s = 1, shine = 0.6,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={4} cy={14} rx={70} ry={8} fill="#000" opacity={0.18} transform="translate(46 0)" />
    <path d="M 22 -6 L 118 -6 L 118 6 L 106 6 L 106 16 L 94 16 L 94 6 L 82 6 L 82 20 L 70 20 L 70 6 L 22 6 Z" fill={BRASS} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={0} cy={0} r={26} fill={BRASS} stroke={OUT} strokeWidth={4.5} />
    <circle cx={-2} cy={0} r={10} fill="#3a2d1f" stroke={OUT} strokeWidth={3} />
    <path d="M -18 -12 A 22 22 0 0 1 4 -22" stroke="#fff6cc" strokeWidth={5} fill="none" strokeLinecap="round" opacity={shine} />
    <path d="M 30 -3 L 100 -3" stroke="#fff6cc" strokeWidth={3} opacity={shine * 0.8} strokeLinecap="round" />
  </g>
);

export const KeyRing: React.FC<{ x: number; y: number; s?: number; keys?: number; rot?: number; extra?: boolean }> = ({
  x, y, s = 1, keys = 2, rot = 0, extra = false,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <circle r={30} fill="none" stroke="#a9a9ad" strokeWidth={7} />
    <circle r={30} fill="none" stroke={OUT} strokeWidth={2} opacity={0.7} />
    {Array.from({ length: keys }).map((_, i) => (
      <Key key={i} x={0} y={0} rot={70 + i * 34} s={0.7} shine={0.3} />
    ))}
    {extra && (
      <g transform="rotate(20)">
        <Key x={0} y={0} rot={140} s={0.78} shine={0.9} />
      </g>
    )}
  </g>
);

export const Pen: React.FC<{ x: number; y: number; rot?: number }> = ({ x, y, rot = -30 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-4} y={-4} width={86} height={9} rx={4} fill="#2a4a6a" stroke={OUT} strokeWidth={2.5} />
    <path d="M -4 -4 L -16 0 L -4 5 Z" fill="#e6d9b9" stroke={OUT} strokeWidth={2} />
  </g>
);

/** open accounts ledger lying on the counter (side-on perspective) */
export const Ledger: React.FC<{ x: number; y: number; s?: number; write?: number; lines?: number; hl?: number }> = ({
  x, y, s = 1, write = 1, lines = 6, hl = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -168 0 L 168 0 L 158 10 L -158 10 Z" fill="#3a3a44" stroke={OUT} strokeWidth={3.5} />
    <path d="M -160 -4 L 0 -10 L 0 -2 L -164 4 Z" fill="#d9ceb2" />
    <path d="M -156 -2 L -4 -8 L -4 -66 L -146 -58 Z" fill="#efe6cc" stroke={OUT} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M 156 -2 L 4 -8 L 4 -66 L 146 -58 Z" fill="#f5eed6" stroke={OUT} strokeWidth={3.5} strokeLinejoin="round" />
    <line x1={0} y1={-8} x2={0} y2={-68} stroke={OUT} strokeWidth={3} />
    {Array.from({ length: lines }).map((_, i) => {
      const p = Math.min(1, Math.max(0, write * lines - i));
      const yy = -14 - i * 8.5;
      return (
        <g key={i} opacity={p > 0 ? 1 : 0}>
          <path d={`M -140 ${yy + 4} q 14 -5 28 0 t 28 0 t 28 0 t ${Math.max(1, 38 * p)} 0`.replace(/t 1 0$/, '')} stroke="#3b3a4a" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <path d={`M 14 ${yy + 1} q 14 -5 28 0 t 28 0 t 28 0 t 30 0`} stroke="#3b3a4a" strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.85} />
        </g>
      );
    })}
    {hl > 0 && <path d="M -156 -2 L -4 -8 L -4 -66 L -146 -58 Z" fill="#ffd36a" opacity={0.25 * hl} />}
  </g>
);

export const OrderPaper: React.FC<{ x: number; y: number; rot?: number; s?: number; fold?: number }> = ({
  x, y, rot = 0, s = 1, fold = 0,
}) => {
  const w = lerp(120, 66, fold);
  const h = lerp(158, 46, fold);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#f2ead2" stroke={OUT} strokeWidth={3.5} strokeLinejoin="round" />
      <g opacity={1 - fold}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={i} d={`M -46 ${-58 + i * 19} q 10 -5 20 0 t 20 0 t ${i % 2 ? 14 : 28} 0`} stroke="#3b3a4a" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        ))}
        <rect x={-48} y={-70} width={40} height={6} fill="#a64d43" opacity={0.7} />
      </g>
      <line x1={-w / 2} y1={0} x2={w / 2} y2={0} stroke={OUT} strokeWidth={2.5} opacity={fold * 0.8} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h / 2} fill="#fff" opacity={fold * 0.25} />
    </g>
  );
};

export const Sandals: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={30} cy={16} rx={110} ry={11} fill="#000" opacity={0.22} />
    {[0, 1].map((i) => (
      <g key={i} transform={`translate(${i * 78} ${i * 6}) rotate(${i ? -6 : 4})`}>
        <path d="M -20 0 Q -30 -26 0 -34 Q 30 -36 34 -8 Q 30 14 -4 14 Q -18 12 -20 0 Z" fill="#4a3a2c" stroke={OUT} strokeWidth={3.5} />
        <path d="M -4 -30 L 6 -2 L 18 -26" fill="none" stroke="#c98a3a" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M -4 -30 L 6 -2 L 18 -26" fill="none" stroke={OUT} strokeWidth={1.5} />
      </g>
    ))}
  </g>
);

export const Phone: React.FC<{ x: number; y: number; rot?: number; s?: number; glow?: number }> = ({
  x, y, rot = 0, s = 1, glow = 0.8,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-22} y={-42} width={44} height={84} rx={9} fill="#1e1f26" stroke={OUT} strokeWidth={3.5} />
    <rect x={-17} y={-34} width={34} height={64} rx={4} fill="#9ec7d6" opacity={0.35 + glow * 0.5} />
    <circle cx={0} cy={36} r={2.5} fill="#555" />
  </g>
);

export const Motorcycle: React.FC<{ x: number; y: number; s?: number; op?: number }> = ({ x, y, s = 1, op = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op} strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx={0} cy={4} rx={190} ry={13} fill="#000" opacity={0.25} />
    {[-110, 110].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={-52} r={52} fill="#2a2a2f" stroke={OUT} strokeWidth={5} />
        <circle cx={cx} cy={-52} r={30} fill="#9a9a9f" stroke={OUT} strokeWidth={4} />
        <circle cx={cx} cy={-52} r={8} fill="#3a3a3f" />
        {[0, 60, 120].map((a) => (
          <line key={a} x1={cx} y1={-52} x2={cx + Math.cos((a * Math.PI) / 180) * 30} y2={-52 + Math.sin((a * Math.PI) / 180) * 30} stroke={OUT} strokeWidth={2} />
        ))}
      </g>
    ))}
    <path d="M -110 -52 L -20 -100 L 60 -100 L 110 -52" fill="none" stroke="#3a3a42" strokeWidth={14} />
    <path d="M -50 -150 Q 10 -170 70 -140 L 62 -102 L -44 -98 Z" fill="#a64d43" stroke={OUT} strokeWidth={4.5} />
    <path d="M -120 -126 Q -70 -146 -48 -128 L -50 -108 L -122 -108 Z" fill="#2f2f35" stroke={OUT} strokeWidth={4} />
    <path d="M 78 -150 L 118 -168 M 98 -160 L 112 -60" stroke={OUT} strokeWidth={8} fill="none" />
    <circle cx={120} cy={-150} r={14} fill="#ffe7a8" stroke={OUT} strokeWidth={3.5} />
  </g>
);

export const Cash: React.FC<{ x: number; y: number; s?: number; n?: number }> = ({ x, y, s = 1, n = 3 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: n }).map((_, i) => (
      <g key={i} transform={`translate(${i * 4} ${-i * 14})`}>
        <rect x={-50} y={-14} width={100} height={30} rx={3} fill="#9fb98a" stroke={OUT} strokeWidth={3} />
        <rect x={-14} y={-14} width={28} height={30} fill="#c9d8b4" opacity={0.7} />
        <circle cx={0} cy={1} r={7} fill="#7a9a6a" opacity={0.7} />
      </g>
    ))}
  </g>
);

export const Plate: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={64} ry={12} fill="#e8e1d1" stroke={OUT} strokeWidth={3.5} />
    <ellipse cx={0} cy={-4} rx={38} ry={6} fill="#c9a24a" opacity={0.6} />
  </g>
);

export const Lamp: React.FC<{ x: number; y: number; s?: number; glow?: number }> = ({ x, y, s = 1, glow = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={-120} r={260} fill="#ffcf8a" opacity={0.09 * glow} />
    <circle cx={0} cy={-120} r={120} fill="#ffcf8a" opacity={0.12 * glow} />
    <path d="M -40 0 L 40 0 L 30 -14 L -30 -14 Z" fill="#5b4631" stroke={OUT} strokeWidth={3.5} />
    <rect x={-6} y={-96} width={12} height={84} fill="#5b4631" stroke={OUT} strokeWidth={3} />
    <path d="M -52 -92 L 52 -92 L 34 -150 L -34 -150 Z" fill="#e8c27a" stroke={OUT} strokeWidth={4} />
    <ellipse cx={0} cy={-92} rx={52} ry={9} fill="#fff3c8" />
  </g>
);

export const Sack: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = '#d8c79c' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -50 0 Q -62 -70 -34 -96 Q 0 -112 34 -96 Q 62 -70 50 0 Z" fill={c} stroke={OUT} strokeWidth={4} />
    <path d="M -34 -60 L 34 -60" stroke="#a0524a" strokeWidth={7} />
    <path d="M -18 -102 L 18 -102" stroke={OUT} strokeWidth={4} />
  </g>
);

/** a polite pointing / gesture bubble-free "thought" dot trail used for memory transitions */
export const Dots: React.FC<{ x: number; y: number; n?: number; c?: string; p?: number }> = ({ x, y, n = 3, c = '#fff', p = 1 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => (
      <circle key={i} cx={x + i * 22} cy={y - i * 12} r={5 + i * 3} fill={c} opacity={Math.min(1, Math.max(0, p * n - i)) * 0.8} stroke="#2b1d17" strokeWidth={2} />
    ))}
  </g>
);
