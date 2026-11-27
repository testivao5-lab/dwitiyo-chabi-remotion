/* Procedural SFX mix for دویتیय চাবি.
 *
 * Generates public/sfx_mix.wav (22 050 Hz mono 16-bit, full film length) with:
 *   - per-scene ambience beds (shop / home / street / room) at very low level
 *   - one-shot events (footsteps, key clinks, pen writing, ledger thuds, phone ring,
 *     paper, coins) placed at the exact narration / staging moments.
 *
 * Everything is intentionally QUIET: beds 0.03–0.06, one-shots 0.07–0.14 (mix gain).
 * The render workflow muxes this under the narration with amix (normalize=0).
 *
 * Run:  node scripts/gensfx.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEGMENTS } from '../.audit/data/timeline.js';
import { SCENE_STARTS, SCENE_COUNT, sceneDur } from '../.audit/lib/story.js';
import { SCENES } from '../.audit/scenes/index.js';
import { makeCtx } from '../.audit/scenes/kit.js';

const SR = 22050;
const TOTAL = 592.75;
const N = Math.ceil(TOTAL * SR);
const mix = new Float32Array(N);

const FPS = 24;
/** global start of line `line`, segment `k` */
function T(line, k = 0) {
  const segs = SEGMENTS.filter((s) => s.line === line);
  return segs[k].t0;
}
function sceneT(i, line, k = 0) {
  return SCENE_STARTS[i] + (T(line, k) - SCENE_STARTS[i]); // line times are global already
}

// ── helpers ────────────────────────────────────────────────────────────────
let seed = 1234567;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;

function add(tSec, buf, gain = 1) {
  const off = Math.round(tSec * SR);
  for (let i = 0; i < buf.length; i++) {
    const j = off + i;
    if (j >= 0 && j < N) mix[j] += buf[i] * gain;
  }
}

function env(n, a, d, curve = 3) {
  // attack/decay envelope, lengths in samples
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v;
    if (i < a) v = i / Math.max(1, a);
    else {
      const x = (i - a) / Math.max(1, d);
      v = x >= 1 ? 0 : Math.pow(1 - x, curve);
    }
    e[i] = v;
  }
  return e;
}

// ── generators ─────────────────────────────────────────────────────────────
function noise(n) {
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = rnd();
  return b;
}

/** pink-ish (one-pole low-pass) noise bed */
function lpNoise(n, cutoff, tilt = 0) {
  const w = noise(n);
  const out = new Float32Array(n);
  const a = Math.exp((-2 * Math.PI * cutoff) / SR);
  let z = 0;
  for (let i = 0; i < n; i++) {
    z = w[i] * (1 - a) + z * a;
    out[i] = z + (tilt ? (w[i] - z) * tilt : 0);
  }
  return out;
}

/** ambience bed for a scene background kind */
function bed(kind, dur) {
  const n = Math.round(dur * SR);
  let base;
  if (kind === 'street') {
    base = lpNoise(n, 900, 0.55);
    // slow traffic swells
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const swell = 0.55 + 0.45 * Math.sin(t * 0.35) * Math.sin(t * 0.11 + 2);
      base[i] *= swell;
    }
  } else if (kind === 'home') {
    base = lpNoise(n, 500, 0.2);
  } else if (kind === 'room') {
    base = lpNoise(n, 380, 0.12);
  } else {
    base = lpNoise(n, 700, 0.3); // shop
  }
  // faint hum for interiors
  if (kind !== 'street') {
    for (let i = 0; i < n; i++) base[i] += Math.sin((2 * Math.PI * 100 * i) / SR) * 0.05;
  }
  // equal-power-ish fades at both ends (0.5 s) so beds crossfade at scene cuts
  const f = Math.min(Math.round(0.5 * SR), n >> 1);
  for (let i = 0; i < f; i++) {
    const g = i / f;
    base[i] *= g;
    base[n - 1 - i] *= g;
  }
  return base;
}

/** pen writing on paper (loopable scratch) */
function penScratch(dur) {
  const n = Math.round(dur * SR);
  const w = noise(n);
  const out = new Float32Array(n);
  let z = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // differentiate a little (paper hiss) + one-pole smoothing
    const hf = w[i] - z;
    z = w[i] * 0.6 + z * 0.4;
    // rapid stroke tremolo + slower line-progress swell
    const stroke = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 6.3 * t)), 2);
    const lineSwell = 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.45 * t + 1);
    out[i] = (hf * 0.8 + w[i] * 0.2) * (0.25 + 0.75 * stroke) * lineSwell;
  }
  // gentle loop fade
  const f = Math.round(0.15 * SR);
  for (let i = 0; i < f; i++) {
    const g = i / f;
    out[i] *= g;
    out[n - 1 - i] *= g;
  }
  return out;
}

function footstep() {
  const n = Math.round(0.12 * SR);
  const out = new Float32Array(n);
  const e = env(n, 40, n - 40, 4);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const thump = Math.sin(2 * Math.PI * (95 - 140 * t) * t) * Math.exp(-t * 34);
    const scuff = rnd() * Math.exp(-t * 55) * 0.5;
    out[i] = (thump * 0.9 + scuff) * e[i];
  }
  return out;
}

function clink(freqs = [2900, 4130, 5610], dec = 22) {
  const n = Math.round(0.35 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const f of freqs) v += Math.sin(2 * Math.PI * f * t) / freqs.length;
    out[i] = v * Math.exp(-t * dec) + rnd() * Math.exp(-t * 90) * 0.3;
  }
  return out;
}

function thud() {
  const n = Math.round(0.4 * SR);
  const out = new Float32Array(n);
  let z = 0;
  const w = noise(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const body = Math.sin(2 * Math.PI * 72 * t) * Math.exp(-t * 16);
    z = w[i] * 0.15 + z * 0.85; // low-passed noise slap
    out[i] = body * 0.9 + z * Math.exp(-t * 30) * 0.8;
  }
  return out;
}

function paper(dur = 0.4) {
  const n = Math.round(dur * SR);
  const w = noise(n);
  const out = new Float32Array(n);
  let z = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const hf = w[i] - z;
    z = w[i];
    const flutter = 0.4 + 0.6 * Math.abs(Math.sin(2 * Math.PI * 9 * t) * Math.sin(2 * Math.PI * 3.1 * t));
    out[i] = hf * flutter * Math.min(1, t * 30) * Math.max(0, 1 - t / dur);
  }
  return out;
}

function phoneRing() {
  // old landline trill: two close tones, 20 Hz warble, 0.45 s on / 0.55 off, two bursts
  const dur = 2.1;
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const burst = t < 0.45 || (t >= 1.0 && t < 1.45) ? 1 : 0;
    if (!burst) continue;
    const tb = t < 0.45 ? t : t - 1.0;
    const warble = 0.5 + 0.5 * Math.sin(2 * Math.PI * 20 * tb);
    out[i] =
      (Math.sin(2 * Math.PI * 1050 * t) * 0.6 + Math.sin(2 * Math.PI * 1320 * t) * 0.4) *
      warble *
      Math.min(1, tb * 40) *
      Math.min(1, (0.45 - tb) * 30 + 0.2);
  }
  return out;
}

function coins() {
  const n = Math.round(0.5 * SR);
  const out = new Float32Array(n);
  const hits = [0, 0.07, 0.16, 0.3];
  for (const h of hits) {
    const o = Math.round(h * SR);
    const f = 3100 + rnd() * 1800;
    for (let i = 0; i < Math.min(4000, n - o); i++) {
      const t = i / SR;
      out[o + i] += (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 1.61 * t) * 0.5) * Math.exp(-t * 40) * 0.5;
    }
  }
  return out;
}

function pickupClick() {
  const n = Math.round(0.15 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = rnd() * Math.exp(-t * 120) * 0.7 + Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 50) * 0.4;
  }
  return out;
}

// ── scene backgrounds (evaluate the actual scenes) ─────────────────────────
const sceneBg = [];
for (let i = 0; i < SCENE_COUNT; i++) {
  const d = sceneDur(i);
  try {
    const out = SCENES[i](makeCtx(i, d, SCENE_STARTS[i] + d * 0.5));
    sceneBg.push(out.bg || 'shop');
  } catch {
    sceneBg.push('shop');
  }
}

// beds: one per scene at its own bg volume (very low)
const BED_VOL = { shop: 0.05, home: 0.04, street: 0.06, room: 0.03 };
for (let i = 0; i < SCENE_COUNT; i++) {
  const s0 = SCENE_STARTS[i];
  const d = sceneDur(i);
  const kind = sceneBg[i];
  add(s0 - 0.25, bed(kind, d + 0.5), BED_VOL[kind] ?? 0.04);
}

// ── one-shot events (absolute seconds) ─────────────────────────────────────
const penVol = 0.05;
const stepVol = 0.08;

// s01 — key placed on the counter (line 9)
add(T(9, 0) + 1.7, clink(), 0.12);

// s02 — Mahin writing accounts (line 11), pen stops with line 15, footsteps leaving
add(SCENE_STARTS[1], penScratch(21.6), penVol);
for (let t = SCENE_STARTS[1] + 12.5; t < SCENE_STARTS[1] + 15.7; t += 0.52) add(t, footstep(), stepVol);

// s04 — the two keys shine (line 27 reveal)
add(T(27, 2) - 0.4, clink([3400, 4700, 6200], 26), 0.08);
add(T(27, 2) + 0.15, clink([3900, 5300], 30), 0.06);

// s05 — sack set down at the end of the carry
{
  const d = sceneDur(4);
  const t2 = T(31, 2);
  add(t2 - 1.8, thud(), 0.09);
}

// s07 / s08 — B writing while they plan (bWrite active)
add(SCENE_STARTS[6], penScratch(sceneDur(6) - 0.5), penVol * 0.8);
add(SCENE_STARTS[7], penScratch(14), penVol * 0.7);

// s10 — the acquaintance arrives with the order paper (line 67)
add(T(67, 0) + 0.6, footstep(), stepVol);
add(T(67, 0) + 1.4, footstep(), stepVol * 0.8);
add(T(67, 1) - 0.5, paper(0.5), 0.07);

// s11 — shop owner arrives with the paper (line 75/77)
add(T(75, 1) + 1.2, footstep(), stepVol);
add(T(75, 1) + 2.0, footstep(), stepVol * 0.8);
add(T(77, 0) + 0.3, paper(0.45), 0.07);

// s13 — the owner leaves after being refused (line 91)
add(T(91, 0) - 0.8, footstep(), stepVol);
add(T(91, 0) - 0.2, footstep(), stepVol * 0.8);

// s15 — Babu storms home: street footsteps, then the plate on the table
{
  const s0 = SCENE_STARTS[14];
  const tHome = T(101) - s0;
  for (let t = s0 + 0.6; t < s0 + tHome - 0.7; t += 0.48) add(t, footstep(), stepVol);
  add(T(131, 1) + 0.8, clink([1700, 2400, 3100], 16), 0.08); // plate set down
}

// s17 — customers in and out; phone starts ringing at the very end (line 117)
add(T(115, 0) - 1.2, footstep(), stepVol);
add(T(115, 0) - 0.5, footstep(), stepVol * 0.8);
add(T(115, 2) + 1.3, footstep(), stepVol);
add(T(115, 2) + 2.1, footstep(), stepVol * 0.8);
add(T(117, 0) + 1.8, phoneRing(), 0.13);

// s18 — pickup + conversation
add(T(117, 0) + 4.9, pickupClick(), 0.1);

// s20 — the ledger is opened to search (line 133)
add(T(133, 0) + 0.2, thud(), 0.08);
add(T(133, 0) + 0.5, paper(0.7), 0.06);

// s21 — Babu walks into Mahin's room (line 139)
{
  const s0 = SCENE_STARTS[20];
  for (let t = s0 + (T(139) - s0) + 0.7; t < s0 + (T(139) - s0) + 4.2; t += 0.5) add(t, footstep(), stepVol);
}

// s22 — the khata is placed on the table (line 147)
add(T(147) + 1.6, thud(), 0.1);
add(T(147) + 1.75, paper(0.5), 0.05);

// s23 — writing the shared rules (lines 155-157): pen bed synced with the ink
add(SCENE_STARTS[22] + 0.8, penScratch(13), penVol);

// s24 — cash counted (line 167) + owner arrives (line 167 seg 2)
add(T(167, 0) + 0.4, coins(), 0.09);
add(T(167, 1) + 0.3, coins(), 0.07);
add(T(167, 2) - 0.4, footstep(), stepVol);

// s25 — Mahin takes the old key back (line 171)
add(T(171, 1) + 0.4, clink(), 0.11);

// s26 — the acquaintance returns (line 173)
add(T(173, 0) + 0.8, footstep(), stepVol);
add(T(173, 0) + 1.6, footstep(), stepVol * 0.8);

// s27 — he leaves (line 187/189 region: walking out at goC)
{
  const s0 = SCENE_STARTS[26];
  // C exits ~1.8 s after goC (T(187)); approximate with line 187 start
  const goC = T(187) - s0;
  for (let t = s0 + goC + 1.9; t < s0 + goC + 5.4; t += 0.5) add(t, footstep(), stepVol);
}

// s29 — key on the ring (line 189) + soft final jingle
add(T(189, 0) + 1.2, clink([3200, 4500, 6000], 24), 0.1);
add(T(191, 0) + 0.6, clink([2700, 3900], 20), 0.07);

// ── write wav (16-bit mono) ────────────────────────────────────────────────
// soft-clip safety + normalize the whole mix to a very low peak (user: subtle)
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(mix[i]));
const target = 0.18; // final peak: beds land around -32 dB RMS, one-shots ≤ -15 dB — subtle under the narration
const g = peak > 0 ? target / peak : 1;
const buf = Buffer.alloc(44 + N * 2);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 2, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) {
  let v = Math.tanh(mix[i] * g * 1.05) * 0.95; // gentle soft-clip
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 32767))), 44 + i * 2);
}
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx_mix.wav');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buf);
console.log('wrote', out, (buf.length / 1e6).toFixed(1) + ' MB', 'peak_in=' + peak.toFixed(3), 'gain=' + g.toFixed(3));
