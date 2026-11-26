// Text-driven lip-sync for Bengali narration.
// The narration audio only gives us a loudness envelope + segment timing, so we
//   1. split the Bengali text of each segment into syllables (vowel / onset consonant),
//   2. place syllables in time using the loudness envelope (more energy => more syllables),
//   3. turn the current syllable into a mouth shape (viseme): open / wide-round / lip-press.
import { ENVELOPE, SEGMENTS } from '../data/timeline';

export interface Viseme {
  open: number; // 0..1 jaw opening
  wide: number; // -1 (rounded "u/o") .. +1 (spread "i/e")
  press: number; // 0..1 lips pressed together (p b m)
  teeth: number; // 0..1 upper teeth visible
  tongue: number; // 0..1 tongue visible
}
export const REST: Viseme = { open: 0, wide: 0, press: 0, teeth: 0, tongue: 0 };

const FPS = 24;

type VowelKey = 'a' | 'o' | 'e' | 'i' | 'u' | 'O' | 'ae' | 'ou' | 'ri';
const VOWEL: Record<VowelKey, { open: number; wide: number }> = {
  a: { open: 0.95, wide: 0.15 }, // আ
  o: { open: 0.55, wide: -0.3 }, // অ (inherent)
  e: { open: 0.55, wide: 0.55 }, // এ
  i: { open: 0.24, wide: 1.0 }, // ই ঈ
  u: { open: 0.2, wide: -1.0 }, // উ ঊ
  O: { open: 0.5, wide: -0.75 }, // ও
  ae: { open: 0.7, wide: 0.3 }, // ঐ
  ou: { open: 0.62, wide: -0.55 }, // ঔ
  ri: { open: 0.3, wide: 0.4 }, // ঋ
};

const INDEP: Record<string, VowelKey> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'ae', 'ও': 'O', 'ঔ': 'ou',
};
const SIGN: Record<string, VowelKey> = {
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'ae', 'ো': 'O', 'ৌ': 'ou',
};
const LONG = new Set(['আ', 'ঈ', 'ঊ', 'া', 'ী', 'ূ', 'ো', 'ৌ', 'ঐ', 'ঔ', 'ৈ']);
const BILABIAL = new Set('পফবভম'.split(''));
const TONGUE = new Set('তথদধনলরসশষটঠডঢণ'.split(''));
const TEETH = new Set('তথদধসশষজঝচছযয়'.split(''));
const isCons = (c: string) => {
  const n = c.codePointAt(0) ?? 0;
  return (n >= 0x0995 && n <= 0x09b9) || n === 0x09dc || n === 0x09dd || n === 0x09df;
};

interface Syl {
  v: VowelKey;
  on: string; // onset consonant ('' if none)
  w: number; // relative weight
  nasal: boolean;
  weak: boolean;
  coda?: boolean; // closed by a vowel-less final consonant (ৎ)
}

export function syllabify(text: string): Syl[] {
  const chars = Array.from(text);
  const out: Syl[] = [];
  const wordLast: number[] = [];
  let cur: Syl | null = null;
  let afterHasanta = false;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === '্') {
      afterHasanta = true;
      continue;
    }
    if (c === 'ৎ') {
      // khanda-ta: a bare consonant with NO inherent vowel → closes the current syllable (coda)
      if (cur) cur.coda = true;
      afterHasanta = false;
      const nxt = chars[i + 1];
      if ((nxt === undefined || nxt === ' ') && out.length) wordLast.push(out.length - 1);
      continue;
    }
    if (isCons(c)) {
      if (afterHasanta && cur) {
        afterHasanta = false; // conjunct: stays in same syllable
        continue;
      }
      cur = { v: 'o', on: c, w: 1, nasal: false, weak: false };
      out.push(cur);
    } else if (INDEP[c]) {
      cur = { v: INDEP[c], on: '', w: LONG.has(c) ? 1.25 : 1, nasal: false, weak: false };
      out.push(cur);
    } else if (SIGN[c] && cur) {
      cur.v = SIGN[c];
      if (LONG.has(c)) cur.w = 1.25;
    } else if ((c === 'ং' || c === 'ঁ' || c === 'ঃ') && cur) {
      cur.nasal = true;
    } else if ((c === ',' || c === '।' || c === '?' || c === '!') && cur) {
      cur.w += 0.35;
    }
    afterHasanta = false;
    const nx = chars[i + 1];
    if ((nx === undefined || nx === ' ') && out.length) wordLast.push(out.length - 1);
  }
  // word-final inherent vowel is mostly swallowed in Bengali
  for (const w of wordLast) if (out[w] && out[w].v === 'o' && out[w].on && !out[w].coda) out[w].weak = true;
  return out;
}

interface SegTiming {
  syl: Syl[];
  bounds: number[]; // syllable boundaries in seconds, length = syl.length + 1
}
const cache = new Map<number, SegTiming>();

function timingFor(idx: number): SegTiming {
  const hit = cache.get(idx);
  if (hit) return hit;
  const seg = SEGMENTS[idx];
  const syl = syllabify(seg.text);
  const f0 = Math.max(0, Math.floor(seg.t0 * FPS));
  const f1 = Math.min(ENVELOPE.length - 1, Math.ceil(seg.t1 * FPS));
  const cum: number[] = [0]; // cumulative energy (with a floor so quiet parts still progress)
  for (let f = f0; f <= f1; f++) cum.push(cum[cum.length - 1] + 0.12 + (ENVELOPE[f] ?? 0) / 99);
  const total = cum[cum.length - 1];
  const wOf = (s: Syl) => (s.weak ? s.w * 0.55 : s.w);
  const wsum = syl.reduce((a, s) => a + wOf(s), 0) || 1;
  const bounds: number[] = [seg.t0];
  let acc = 0;
  for (let i = 0; i < syl.length; i++) {
    acc += wOf(syl[i]);
    const target = (acc / wsum) * total;
    let j = 0;
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const span = cum[j + 1] - cum[j] || 1;
    const frac = Math.min(1, Math.max(0, (target - cum[j]) / span));
    bounds.push((f0 + j + frac) / FPS);
  }
  bounds[bounds.length - 1] = Math.max(bounds[bounds.length - 1], seg.t1);
  const r = { syl, bounds };
  cache.set(idx, r);
  return r;
}

const env = (g: number) => {
  const f = g * FPS;
  const a = Math.floor(f);
  const p = f - a;
  const e0 = (ENVELOPE[a] ?? 0) / 99;
  const e1 = (ENVELOPE[a + 1] ?? 0) / 99;
  return e0 + (e1 - e0) * p;
};
const sm = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** smoothed speech loudness 0..1 around time g (used for gestures / head movement) */
export function loudness(g: number, win = 0.3) {
  let s = 0;
  const n = 5;
  for (let i = -n; i <= n; i++) s += env(g + (i / n) * win);
  return Math.min(1, (s / (2 * n + 1)) * 1.7);
}

/** index of the segment that speaker `sp` is currently saying (or -1) */
export function activeSeg(sp: string, g: number) {
  for (let i = 0; i < SEGMENTS.length; i++) {
    const s = SEGMENTS[i];
    if (s.sp === sp && g >= s.t0 - 0.06 && g <= s.t1 + 0.08) return i;
  }
  return -1;
}

function shapeOf(s: Syl, p: number, amp: number, nextV: VowelKey | null): Viseme {
  const base = VOWEL[s.v];
  const nb = nextV ? VOWEL[nextV] : base;
  const tail = sm((p - 0.62) / 0.38) * 0.45; // co-articulation toward next vowel
  let open = base.open + (nb.open - base.open) * tail;
  const wide = base.wide + (nb.wide - base.wide) * tail;
  const onsetP = s.on ? 1 - sm(p / 0.32) : 0; // onset consonant narrows / closes the lips
  let press = 0;
  if (s.on && BILABIAL.has(s.on)) press = onsetP;
  else if (s.on) open *= 1 - 0.55 * onsetP;
  const shape = Math.pow(Math.sin(Math.min(1, Math.max(0, p)) * Math.PI), 0.65);
  open *= 0.3 + 0.7 * shape;
  open *= 0.45 + 0.75 * amp;
  if (s.weak) open *= 0.6;
  if (s.nasal && p > 0.7) {
    const q = sm((p - 0.7) / 0.3);
    press = Math.max(press, q * 0.6);
    open *= 1 - 0.5 * q;
  }
  if (s.coda && p > 0.75) open *= 1 - 0.35 * sm((p - 0.75) / 0.25); // vowel-less final ৎ: jaw closes, no extra opening
  open *= 1 - press * 0.95;
  const teeth = Math.min(1, open * 1.6) * (s.on && TEETH.has(s.on) ? 1 : 0.75) * (1 - press);
  const tongue = s.on && TONGUE.has(s.on) && open > 0.2 ? Math.min(1, onsetP + 0.2) * 0.9 : open > 0.65 ? 0.5 : 0;
  return { open: Math.min(1, open), wide, press, teeth, tongue };
}

/** mouth shape for speaker `sp` at global time g (seconds) */
export function visemeAt(sp: string, g: number): Viseme {
  const idx = activeSeg(sp, g);
  if (idx < 0) return REST;
  const seg = SEGMENTS[idx];
  const { syl, bounds } = timingFor(idx);
  if (!syl.length) return REST;
  const amp = env(g);
  if (g < seg.t0 || g > seg.t1) {
    const edge = g < seg.t0 ? 1 - (seg.t0 - g) / 0.06 : 1 - (g - seg.t1) / 0.08;
    return { ...REST, open: 0.08 * Math.max(0, edge) };
  }
  if (amp < 0.07) return { ...REST, press: 0.3 }; // silence between phrases => lips close
  let i = 0;
  while (i < syl.length - 1 && g >= bounds[i + 1]) i++;
  const p = (g - bounds[i]) / Math.max(0.04, bounds[i + 1] - bounds[i]);
  const v = shapeOf(syl[i], p, Math.min(1, amp * 1.5), syl[i + 1] ? syl[i + 1].v : null);
  v.open = Math.min(v.open, 0.18 + amp * 1.0);
  return v;
}
