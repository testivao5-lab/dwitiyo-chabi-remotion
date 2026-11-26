import React from 'react';
import { PAL } from '../art/palette';
import { ActorSpec } from '../art/Person';
import { Key, Ledger, OrderPaper, Sandals, Motorcycle, Cash, Sack, Lamp } from '../art/Props';
import { bounceOut, clamp, easeInOut, kf, kf2, lerp, sway, V2, easeOut } from '../lib/anim';
import { AmarWord, COUNTER_Y, Ctx, KEY_POS, SceneOut, bWrite, camSeq, walkTo } from './kit';

const gest = (x: number, dir: 1 | -1, t: number, hgt = 540): V2 => [
  x + dir * 118 + sway(t, 8, 1.3), hgt + sway(t, 14, 0.9),
];

/* S01 — key on the counter */
export const s01 = (c: Ctx): SceneOut => {
  const { t } = c;
  const drop = 2.3;
  const hand = kf2(t, [
    [0, [930, 380]], [1.3, [1030, 500]], [drop - 0.3, [1066, 566]], [drop, [1068, 574]],
    [drop + 0.7, [1010, 470]], [4.5, [930, 420]],
  ]);
  const p = clamp((t - drop) / 0.55);
  const ky = t < drop ? hand[1] + 30 : 612 - 14 * (1 - bounceOut(p));
  const kx = t < drop ? hand[0] + 6 : lerp(hand[0] + 6, KEY_POS[0], bounceOut(p));
  const rot = t < drop ? -24 : -24 * (1 - bounceOut(p)) + Math.sin(p * 12) * 3 * (1 - p);
  const b = bWrite(t);
  return {
    bg: 'shop',
    pal: PAL.present,
    cam: c.cam([
      { d: 4.0, a: [1110, 585, 3.0], b: [1105, 580, 3.35] },
      { d: 99, a: [905, 430, 2.6], b: [905, 420, 2.7] },
    ]),
    actors: [
      b,
      { id: 'M', x: 880, expr: 'sad', hf: t < drop + 1.8 ? hand : null, look: 0.4, lookY: 0.2, z: 'front' },
    ],
    props: (
      <>
        <Ledger x={1440} y={COUNTER_Y} write={clamp(t / 7)} />
        <Key x={kx} y={ky} rot={rot} />
      </>
    ),
  };
};

/* S02 — silence heavier than words */
export const s02 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tHead = c.T(15);
  const stop = t > tHead - 0.2;
  const lift = clamp((t - tHead) / 0.9);
  const b = bWrite(t, {}, stop);
  if (stop) {
    b.lean = lerp(13, 1, easeOut(lift));
    b.lookY = lerp(0.85, 0, lift);
    b.look = lerp(-0.4, -1, lift);
    b.tilt = lerp(6, 0, lift);
    b.expr = t > tHead + 1 ? 'stern' : 'neutral';
    b.hf = [1385, COUNTER_Y - 6];
  }
  const tw = c.T(19) + 0.6;
  const w = walkTo(t, 880, 230, tw, tw + 3.4);
  const leaving = t > tw;
  const m: ActorSpec = {
    id: 'M', x: w.x, flip: leaving, walk: w.walk, z: 'front',
    expr: t > c.T(13, 3) ? 'bitter' : 'sad',
    look: leaving ? -1 : -0.2 + 0.0, lookY: 0.05,
    op: w.x < 330 ? clamp((w.x - 240) / 90) : 1,
  };
  return {
    bg: 'shop',
    pal: PAL.present,
    cam: c.cam([
      { d: c.T(13) - 0.2, a: [1230, 520, 1.55], b: [1210, 510, 1.7] },
      { d: tHead - c.T(13) + 0.2, a: [905, 440, 2.4], b: [915, 435, 2.6] },
      { d: c.T(17) - tHead, a: [1430, 470, 2.4], b: [1430, 465, 2.6] },
      { d: 99, a: [680, 560, 1.25], b: [560, 560, 1.2] },
    ]),
    actors: [b, m],
    props: (
      <>
        <Ledger x={1440} y={COUNTER_Y} write={clamp(t / 12)} />
        <Key x={KEY_POS[0]} y={KEY_POS[1]} />
        <Sandals x={470} y={895} s={0.95} />
      </>
    ),
  };
};

/* S03 — how the shop started (memory) */
export const s03 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tMoto = c.T(21, 3);
  // the bike faces right and is not ridden: it stays parked and fades away as the cash changes hands (sold)
  const motoOp = t < tMoto ? clamp(t / 1.2) : 1 - easeInOut(clamp((t - tMoto) / 2.8));
  const cashP = clamp((t - c.T(21, 2)) / 1.2);
  return {
    bg: 'street',
    pal: PAL.memory,
    bgProps: { garland: false },
    cam: c.cam([
      { d: c.T(21, 2) + 0.1, a: [960, 500, 1.05], b: [980, 520, 1.3] },
      { d: 99, a: [900, 560, 1.5], b: [840, 560, 1.7] },
    ]),
    actors: [
      { id: 'B', x: 940, expr: t > c.T(21, 3) ? 'soft' : 'smile', look: 0.7, hf: t > c.T(21, 2) && t < tMoto ? [1070, 600] : null, z: 'front', lookY: -0.2 },
      { id: 'M', x: 1240, flip: true, expr: 'smile', look: -0.6, lookY: -0.2, z: 'front' },
    ],
    props: (
      <>
        <Motorcycle x={470} y={905} s={1} op={motoOp} />
        {cashP > 0 && cashP < 1 && <Cash x={lerp(1260, 1070, easeOut(cashP))} y={lerp(560, 640, easeOut(cashP))} s={0.8} n={3} />}
      </>
    ),
  };
};

/* S04 — two keys, one promise */
export const s04 = (c: Ctx): SceneOut => {
  const { t } = c;
  const nod = t > c.T(29) ? Math.sin((t - c.T(29)) * 5) * 4 : 0;
  const tMo = c.T(27, 3);
  return {
    bg: 'street',
    pal: PAL.memory,
    bgProps: { garland: true, doorGlow: 0.5 },
    cam: c.cam([
      { d: tMo - 0.4, a: [960, 520, 1.05], b: [980, 520, 1.2] },
      { d: 99, a: [1000, 525, 1.45], b: [1000, 525, 1.65] },
    ]),
    actors: [
      { id: 'B', x: 700, expr: 'smile', look: 0.8, tilt: nod, z: 'front' },
      { id: 'Mo', x: 1010, expr: 'soft', look: 0, hf: [1050, 585], hr: [985, 590], z: 'front' },
      { id: 'M', x: 1330, flip: true, expr: 'smile', look: -0.8, tilt: -nod, z: 'front' },
    ],
    props: (
      <>
        <Key x={1030} y={580} rot={80} s={0.85} />
        <Key x={1062} y={590} rot={100} s={0.85} shine={0.9} />
      </>
    ),
  };
};

/* S05 — they really did work together */
export const s05 = (c: Ctx): SceneOut => {
  const { t } = c;
  const t2 = c.T(31, 2);
  const t3 = c.T(31, 3);
  const phase = t < t2 - 0.3 ? 0 : t < t3 - 0.3 ? 1 : 2;
  const D0 = t2 - 0.3; // length of the carrying phase
  const bW = walkTo(t, 220, 1020, 0.3, D0 - 2.0);
  let actors: ActorSpec[];
  let props: React.ReactNode;
  let sackFront: React.ReactNode;
  let cam;
  if (phase === 0) {
    // B carries the sack in FRONT of his chest, then bends and sets it on the floor (0.55s) at the end of the phase
    const dropT = D0 - 1.8;
    const sd = clamp((t - dropT) / 0.55);
    const bend = Math.sin(clamp((t - dropT) / 1.1) * Math.PI);
    const carrying = t < dropT + 0.55;
    const sackX = lerp(bW.x + 20, 1060, easeInOut(sd));
    const sackY = lerp(640, 918, sd * sd); // y is the bottom of the sack: carried at waist height, then set on the floor
    actors = [
      { id: 'M', x: 1480, flip: true, expr: 'smile', look: -0.3, hf: [1340, COUNTER_Y - 6], z: 'back' },
      {
        id: 'B', x: bW.x, walk: bW.walk, flip: false, expr: 'soft', look: 0.5, z: 'front',
        hf: carrying ? [sackX + 8, sackY - 52] : null, hr: carrying ? [sackX - 36, sackY - 40] : null,
        lean: (carrying ? 8 : 0) + 10 * bend, sit: 45 * bend,
      },
    ];
    props = undefined;
    sackFront = <Sack x={sackX} y={sackY} s={0.9} />;
    cam = camSeq(t, [{ d: 99, a: [960, 520, 1.15], b: [1060, 520, 1.3] }], t2 - 0.3);
  } else if (phase === 1) {
    actors = [
      { id: 'B', x: 800, expr: 'sad', lean: 6, tilt: 8, look: 0.3, hf: [832, 375], hr: [775, 600], z: 'front' },
      { id: 'M', x: 1480, flip: true, expr: 'soft', look: -0.5, hf: [1330 + sway(t, 20, 3), COUNTER_Y - 10], z: 'back' },
    ];
    props = <Sack x={1130} y={COUNTER_Y} s={0.5} />;
    cam = camSeq(t - (t2 - 0.3), [{ d: 99, a: [1180, 540, 1.3], b: [1250, 530, 1.4] }], t3 - t2);
  } else {
    actors = [
      { id: 'M', x: 1480, flip: true, expr: 'thinking', lean: 12, lookY: 0.8, look: -0.4, tilt: 6, hf: [1390 + sway(t, 12, 2.6), COUNTER_Y - 6], hr: [1530, COUNTER_Y - 4], z: 'back' },
      { id: 'B', x: 1150, flip: true, expr: 'soft', look: -0.0, tilt: -4, hf: null, z: 'back' },
    ];
    props = (
      <>
        <Lamp x={1700} y={COUNTER_Y} s={1.1} glow={1} />
        <Ledger x={1440} y={COUNTER_Y} write={0.3} lines={4} />
      </>
    );
    cam = camSeq(t - (t3 - 0.3), [{ d: 99, a: [1330, 500, 1.45], b: [1380, 480, 1.7] }], c.d - (t3 - 0.3));
  }
  return {
    bg: 'shop',
    pal: phase === 2 ? PAL.night : phase === 1 ? PAL.absence : PAL.memory,
    cam,
    actors,
    props,
    front: sackFront,
    bgProps: { bulb: true },
  };
};

/* S06 — "আমার" starts to grow */
export const s06 = (c: Ctx): SceneOut => {
  const { t } = c;
  const w1 = c.T(35);
  const w2 = c.T(37, 0);
  const w3 = c.T(37, 1);
  const w4 = c.T(37, 2);
  const opWord = (s: number, e: number) => clamp((t - s) / 0.5) * (1 - clamp((t - e) / 0.8));
  const tOpen = c.T(39);
  const tAsk = c.T(41);
  const tPride = c.T(43);
  const big = t < tOpen;
  const bx = kf(t, [[tOpen, 1480], [tAsk, 1480]]);
  const b: ActorSpec = {
    id: 'B', x: bx, flip: true,
    expr: t > tPride ? 'smile' : 'stern', look: -0.5,
    lean: t > tPride ? -4 : 2,
    // after the pride beat he leans back with his arms relaxed at his sides (idle arms stay behind the counter)
    hf: t > tPride ? null : [1400, COUNTER_Y - 6],
    hr: t > tPride ? null : [1520, COUNTER_Y - 6],
    z: 'back',
  };
  const mX = t < tAsk ? 880 : 860;
  const mAct: ActorSpec = {
    id: 'M', x: mX, expr: t > tAsk ? 'worried' : 'neutral',
    look: t > tAsk ? 0.9 : -0.3, z: 'front',
    hf: t > tOpen && t < tAsk ? [mX + 120, 470 + sway(t, 30, 1.4)] : t > tAsk + 1 ? null : null,
  };
  return {
    bg: 'shop',
    pal: PAL.tight,
    cam: big
      ? camSeq(t, [{ d: 99, a: [1280, 480, 1.35], b: [1330, 470, 1.6] }], tOpen)
      : camSeq(t - tOpen, [{ d: tAsk - tOpen, a: [1130, 520, 1.3], b: [1100, 500, 1.4] }, { d: 99, a: [1150, 500, 1.5], b: [1260, 480, 1.7] }], c.d - tOpen),
    actors: [b, mAct],
    props: (
      <>
        <Ledger x={1440} y={COUNTER_Y} write={1} hl={opWord(w4, w4 + 5)} />
      </>
    ),
    bgFront: (
      <>
        {/* five words, all inside the safe zone between the brothers (x 960..1460, y 275..375), staggered so they build
            one after another instead of colliding */}
        <AmarWord x={1180} y={345} size={Math.min(170, 90 + Math.max(0, t - w1) * 70)} op={opWord(w1, w1 + 1.5) * 0.9} rot={-3} />
        <AmarWord x={1060} y={305} size={100} op={opWord(w2, w2 + 1.1) * 0.85} rot={-4} />
        <AmarWord x={1330} y={295} size={120} op={opWord(w3, w3 + 1.1) * 0.85} rot={2} />
        <AmarWord x={1200} y={365} size={140} op={opWord(w4, w4 + 1.4) * 0.85} rot={-2} />
        <AmarWord x={1210} y={330} size={80 + Math.max(0, t - tPride) * 6} op={clamp((t - tPride) / 1) * 0.5 * (1 - clamp((t - (c.d - 2.4)) / 1.8))} rot={-6} />
      </>
    ),
  };
};

/* S07 — "can we sit together for the profits?" */
export const s07 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tReply = c.T(47);
  const tSilent = c.T(49);
  const tTrust = c.T(51);
  const laugh = t > tReply ? sway(t, 2, 0.33) : 0;
  const b = bWrite(t, {
    expr: t > tReply ? 'smile' : 'stern',
    lean: t > tReply ? 3 : 13,
    lookY: t > tReply ? 0 : 0.85,
    look: -0.7,
    tilt: laugh,
    ...(t > tReply ? { hf: [1375, COUNTER_Y - 4] as V2 } : {}),
  }, t > tReply);
  const m: ActorSpec = {
    id: 'M', x: 900,
    expr: t < tReply ? 'soft' : t < tTrust ? 'sad' : 'neutral',
    look: 0.6, lookY: t > tSilent ? 0.35 : 0,
    hf: t < tReply ? gest(900, 1, t, 560) : null,
    z: 'front',
  };
  return {
    bg: 'shop',
    pal: PAL.tight,
    cam: c.cam([
      { d: c.T(45, 1) - 0.2, a: [1180, 520, 1.5], b: [1200, 520, 1.6] },
      { d: tReply - c.T(45, 1) + 0.2 + 0.0, a: [905, 440, 2.3], b: [910, 430, 2.45] },
      { d: tTrust - tReply, a: [1440, 450, 2.2], b: [1440, 445, 2.35] },
      { d: 99, a: [1430, 436, 2.5], b: [1430, 420, 2.7] },
    ]),
    actors: [b, m],
    props: (
      <>
        <Ledger x={1440} y={COUNTER_Y} write={1} />
        <Key x={KEY_POS[0] + 220} y={KEY_POS[1] + 8} s={0.8} rot={20} />
      </>
    ),
  };
};

/* S08 — the new food shop order */
export const s08 = (c: Ctx): SceneOut => {
  const { t } = c;
  const inShop = t > c.T(57) - 0.3;
  if (!inShop) {
    const hand = t > c.T(55) ? [1010, 560] as V2 : [1020, 570 + sway(t, 10, 1.6)] as V2;
    return {
      bg: 'street',
      pal: PAL.neutral,
      cam: camSeq(t, [{ d: 99, a: [960, 560, 1.4], b: [1010, 560, 1.6] }], c.T(57) - 0.3),
      actors: [
        { id: 'M', x: 800, expr: 'smile', look: 0.8, hf: gest(800, 1, t, 560), z: 'front' },
        { id: 'O', x: 1230, flip: true, expr: 'neutral', look: -0.7, hf: hand, z: 'front' },
      ],
      props: <OrderPaper x={hand[0] + 14} y={hand[1] + 12} rot={-8} s={0.55} />,
    };
  }
  return {
    bg: 'shop',
    pal: PAL.neutral,
    cam: camSeq(t - (c.T(57) - 0.3), [{ d: 99, a: [1170, 520, 1.55], b: [1130, 520, 1.75] }], c.d - (c.T(57) - 0.3)),
    actors: [
      bWrite(t, { expr: 'neutral', lean: 8, lookY: 0.4, look: -0.9 }),
      { id: 'M', x: 880, expr: 'smile', look: 0.9, hf: [980, 520 + sway(t, 10, 1)], z: 'front' },
    ],
    props: (
      <>
        <Ledger x={1440} y={COUNTER_Y} write={0.8} />
        <OrderPaper x={1000} y={512 + sway(t, 10, 1)} rot={-8} s={0.8} />
      </>
    ),
  };
};

/* S09 — B refuses */
export const s09 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tNo = c.T(59, 1);
  const tExpl = c.T(61);
  const tDeaf = c.T(63);
  const stopH: V2 = [1275, 560];
  const b: ActorSpec = tDeaf > t
    ? { id: 'B', x: 1480, flip: true, expr: 'stern', look: -0.9, hf: t > tNo - 0.2 ? stopH : [1390, COUNTER_Y - 6], hr: [1520, COUNTER_Y - 6], lean: 0 }
    : bWrite(t, { expr: 'stern' }, true);
  return {
    bg: 'shop',
    pal: PAL.tight,
    cam: c.cam([
      { d: tExpl - 0.1, a: [1200, 490, 1.7], b: [1190, 490, 1.85] },
      { d: tDeaf - tExpl, a: [1050, 500, 1.8], b: [1040, 500, 1.95] },
      { d: 99, a: [1300, 480, 2.0], b: [1300, 480, 2.3] },
    ]),
    actors: [
      b,
      { id: 'M', x: 900, expr: t < tNo ? 'smile' : t < tDeaf ? 'worried' : 'sad', look: 0.8, hf: t < tNo ? [1000, 540] : t < tDeaf ? gest(900, 1, t, 580) : [940, 640], z: 'front', tilt: t > tDeaf ? 5 : 0 },
    ],
    props: (
      <>
        <Ledger x={1440} y={COUNTER_Y} write={1} />
        <OrderPaper x={t < tNo ? 1010 : 940} y={t < tNo ? 540 : 650} rot={-8} s={0.7} />
      </>
    ),
  };
};

/* S10 — the credit double standard */
export const s10 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tCust = c.T(67);
  const tAsk = c.T(69);
  const tKnow = c.T(71);
  const tFold = c.T(73);
  const cw = walkTo(t, 260, 1160, tCust + 0.3, tCust + 3.3);
  const fold = clamp((t - tFold - 0.4) / 2.2);
  const customerHere = t > tCust;
  const actors: ActorSpec[] = [
    t < tCust
      ? { id: 'B', x: 1480, flip: true, expr: 'thinking', look: -0.6, lean: 3, hf: [1395, 600], hr: [1520, COUNTER_Y - 6] }
      : { id: 'B', x: 1480, flip: true, expr: t > tKnow ? 'neutral' : 'smile', look: -0.9, hf: t > tCust + 3.4 && t < tKnow + 1.5 ? [1250, 580] : [1395, COUNTER_Y - 6], hr: [1520, COUNTER_Y - 6] },
    { id: 'M', x: 760, expr: t < tAsk ? 'neutral' : t < tFold ? 'sad' : 'neutral', look: t < tCust ? 0.3 : 0.8, hf: t > tFold ? [790 + 90, 560 + 20 * fold] : null, z: 'front', lookY: t > tFold ? 0.7 : 0 },
  ];
  if (customerHere) actors.push({ id: 'C', x: cw.x, walk: cw.walk, flip: t < tCust + 3.3, expr: 'smile', look: 0.9, z: 'front', hf: null });
  return {
    bg: 'shop',
    pal: PAL.tight,
    cam: c.cam([
      { d: tCust - 0.2, a: [1400, 450, 2.1], b: [1400, 445, 2.3] },
      { d: tAsk - tCust + 0.2, a: [1100, 520, 1.5], b: [1180, 520, 1.6] },
      { d: tKnow - 0.15 - tAsk, a: [800, 450, 2.1], b: [790, 450, 2.35] },
      // B ("ওনারে আমি চিনি।") and the customer C are framed while he answers
      { d: tFold - 0.2 - (tKnow - 0.15), a: [1340, 490, 1.75], b: [1360, 490, 1.85] },
      { d: 99, a: [840, 590, 3.2], b: [840, 595, 3.4] }, // macro on the paper: heads deliberately out of frame
    ]),
    actors,
    props: (
      <>
        <Ledger x={1440} y={COUNTER_Y} write={1} />
        <Cash x={1320} y={COUNTER_Y - 4} s={0.6} n={t < tCust ? 4 : 2} />
        {t > tCust + 3 && t < tKnow + 2 && <Sack x={1150} y={COUNTER_Y} s={0.5} c="#c9b78a" />}
        {t > tFold - 0.3 && <OrderPaper x={880} y={575 + 15 * fold} rot={-4} s={0.8} fold={fold} />}
      </>
    ),
  };
};
