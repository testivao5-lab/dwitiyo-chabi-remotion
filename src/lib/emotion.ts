import { SEGMENTS } from '../data/timeline';
import type { Expr } from '../art/Person';
import { FPS } from './story';

/* Dialogue-driven expressions.
 *
 * Scenes author a baseline `expr` per actor; this module overrides it while one of the
 * speaker's script lines is on screen (and for a short hold after the line), so the face
 * follows the emotion of what is actually being said and STAYS on it until the next line.
 * It also returns a backwards-sampled expression + blend factor so callers can cross-fade
 * any change over ~0.5 s instead of popping (stateless: the change point is re-derived
 * from the line table every frame).
 */

/** line → speaker → emotion. Lines absent here keep the scene's authored expr. */
const LINE_EMOTION: Record<number, Partial<Record<string, Expr>>> = {
  // — Mahin (M) —
  9: { M: 'bitter' }, // "চাবি দিলেই অংশীদার হওয়া যায় না"
  13: { M: 'bitter' }, // "এই দোকানে আমি কত টাকা দিছি…" (the accusation)
  45: { M: 'soft' }, // "লাভের হিসাবটা মাসে একবার একসঙ্গে বসি?"
  57: { M: 'smile' }, // "ছোট কইরা শুরু করি…" (enthusiastic idea)
  69: { M: 'worried' }, // "ওনারটা পারলে… পারলাম না কেন?"
  89: { M: 'sad' }, // "আপনি অন্য ব্যবস্থা করেন…" (turning the customer away)
  93: { M: 'sad' }, // "আগে তোমারসঙ্গে ঠিক করা দরকার ছিল। ওইটা আমার ভুল।"
  95: { M: 'sad' }, // "আমার ভুল হইলেই আমি খালি তোমার সঙ্গে থাকি কেন?"
  109: { M: 'sad' }, // "নিজের হইলে তো ভালোই হইত, ভাইজান।"
  121: { M: 'soft' }, // "পিছনের তাকের নিচে…"
  153: { M: 'soft' }, // "আমি তোমারে দোকান ছাড়তে বলি নাই…"
  161: { M: 'soft' }, // "ওই দোকানে এই মাসের কাজের কথা দিছি…"
  175: { M: 'stern' }, // "আগেরটা না মিটলে নতুন বাকি দিতে পারব না।" (polite but firm)

  // — Babu (B) —
  23: { B: 'smile' }, // "দুই ভাই একসঙ্গে দাঁড়ামু…" (proud memory)
  47: { B: 'smile' }, // "তুই কি আমারে বিশ্বাস করস না?"
  59: { B: 'stern' }, // "বাকিতে ব্যবসা বাড়ানোর দরকার নাই।"
  71: { B: 'smile' }, // "ওনারে আমি চিনি।"
  81: { B: 'angry' }, // "দোকানের সিদ্ধান্ত আমি নিই।"
  85: { B: 'angry' }, // "দোকান আমার। ও আমার সঙ্গে থাকে।"
  91: { B: 'angry' }, // "আমারে না জিজ্ঞেস কইরা এতদূর কথা বাড়াইলি কেন?"
  105: { B: 'stern' }, // "নিজের দোকান ছাইড়া অন্যের চাকরি করবি?"
  119: { B: 'angry' }, // "তুই জিনিসগুলো কোথায় রাখছস, কেউ জানে না।"
  141: { B: 'sad' }, // "লোকটার সামনে ওই কথাটা বলা আমার অন্যায় হইছে।"
  145: { B: 'soft' }, // "তোর হিসাবটা পরিষ্কার করতে আসছি।"
  149: { B: 'soft' }, // "ভাই বইলা আটকা রাখার অধিকার আমার নাই।"
  165: { B: 'soft' }, // "কথাটা রাখ। এই কয়দিন আমি ব্যবস্থা করি।"
  185: { B: 'smile' }, // "এটা আমাদের দুইজনের নিয়ম।"

  // — Amma (Mo) —
  27: { Mo: 'soft' }, // "একজন ক্লান্ত হইলে আরেকজন ধরবি।"
  127: { Mo: 'soft' }, // "মাহিনের সঙ্গে বসছস?"
  131: { Mo: 'stern' }, // "কথাটা তোর কাছে সামান্য…" (scolding)

  // — one-offs —
  83: { O: 'surprised' }, // "আপনাদের দুই ভাইয়ের দোকান না?"
  177: { C: 'smile' }, // "এখন ছোট ভাইয়ের অনুমতি লাগে নাকি?"
};

/** how long (s) an emotion lingers after its line ends */
const HOLD = 1.2;
/** cross-fade window (s) for any expression change */
const LAG = 0.5;

type Hit = { t0: number; t1: number; line: number };
const HITS: Record<string, Hit[]> = {};
for (const s of SEGMENTS) {
  if (!s.sp || s.sp === '-' || s.sp === '') continue;
  (HITS[s.sp] ??= []).push({ t0: s.t0, t1: s.t1, line: s.line });
}
for (const k of Object.keys(HITS)) HITS[k].sort((a, b) => a.t0 - b.t0);

const EPS = 1 / FPS;

/** Effective expression at global time g: line override (active + hold) or the scene fallback. */
export function lineEmotion(sp: string, g: number, fallback: Expr): Expr {
  const hits = HITS[sp];
  if (!hits || hits.length === 0) return fallback;
  // last hit that has started at or before g
  let lo = 0, hi = hits.length - 1, idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (hits[mid].t0 <= g) { idx = mid; lo = mid + 1; } else hi = mid - 1;
  }
  if (idx < 0) return fallback;
  const h = hits[idx];
  if (g >= h.t1 + HOLD) return fallback; // hold expires exactly at t1+HOLD (so the ramp's event search can see it)
  return LINE_EMOTION[h.line]?.[sp] ?? fallback;
}

/**
 * Current expression + a 0.5 s-lagged one + blend k (k=0 → fully current, k=1 → fully lagged).
 * During a change the blend ramps 1→0 over LAG seconds, so the face eases into the new
 * emotion instead of popping. Stateless: the change point is the last line-table event.
 */
export function smoothEmotion(
  sp: string,
  g: number,
  fallback: Expr,
): { expr: Expr; expr2: Expr; exprK: number } {
  const now = lineEmotion(sp, g, fallback);
  const prev = lineEmotion(sp, g - LAG, fallback);
  if (prev === now) return { expr: now, expr2: now, exprK: 0 };
  const hits = HITS[sp] ?? [];
  // events where the effective emotion can change, newest first
  const events: number[] = [];
  for (const h of hits) events.push(h.t0, h.t1 + HOLD);
  events.sort((a, b) => b - a);
  let T = g - LAG; // fallback: ramp across the whole window
  for (const b of events) {
    if (b > g) continue;
    if (b <= g - LAG) break;
    if (lineEmotion(sp, b, fallback) !== lineEmotion(sp, b - EPS, fallback)) { T = b; break; }
  }
  const k = Math.min(1, Math.max(0, 1 - (g - T) / LAG));
  return { expr: now, expr2: prev, exprK: k };
}
