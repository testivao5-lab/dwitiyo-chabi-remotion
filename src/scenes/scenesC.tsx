import { PAL } from '../art/palette';
import { ActorSpec } from '../art/Person';
import { Ledger, Key, KeyRing, Pen, Cash, Sandals } from '../art/Props';
import { clamp, easeOut, kf2, lerp, sway, V2, easeInOut } from '../lib/anim';
import { Book, COUNTER_Y, Ctx, KEY_POS, SceneOut, camSeq, walkTo } from './kit';

const sandals = <Sandals x={470} y={895} s={0.95} />;

/* S21 — first apology attempt */
export const s21 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tB1 = c.T(141, 1);
  const tSil = c.T(143);
  const tB2 = c.T(145, 1);
  const w = walkTo(t, 280, 820, c.T(139) + 0.6, c.T(139) + 4.2);
  return {
    bg: 'room',
    pal: PAL.absence,
    cam: camSeq(t, [
      { d: tB1 - 0.2, a: [800, 540, 1.12], b: [960, 530, 1.25] },
      { d: tSil - tB1 + 0.2, a: [850, 470, 2.1], b: [850, 470, 2.4] },
      { d: tB2 - tSil - 0.3, a: [1620, 470, 2.4], b: [1620, 470, 2.6] },
      { d: 99, a: [1180, 500, 1.5], b: [1200, 500, 1.65] },
    ]),
    actors: [
      { id: 'B', x: w.x, walk: w.walk, flip: false, expr: t < tB1 ? 'worried' : 'sad', look: 0.8, hf: [w.x + 78, 500], hr: [w.x + 20, 520] },
      { id: 'M', x: 1620, flip: true, expr: 'sad', look: t < tSil ? 0.6 : 0.4, lookY: 0.2, hf: [1585, 500], hr: [1548, 508], z: 'front' },
    ],
    props: <Book x={w.x + 62 + 22} y={508} s={0.5} rot={-90 + 90} />,
  };
};

/* S22 — "I came to clear your account" */
export const s22 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tPut = c.T(147);
  const tB = c.T(149, 1);
  const tM1 = c.T(151);
  const tM2 = c.T(153, 1);
  const hand = kf2(t, [[0, [1330, 520]], [tPut + 0.2, [1330, 520]], [tPut + 1.6, [1465, 622]], [tPut + 3, [1380, 520]]]);
  const put = t > tPut + 1.6;
  return {
    bg: 'room',
    pal: PAL.absence,
    cam: camSeq(t, [
      { d: tB - 0.2, a: [1480, 540, 1.7], b: [1500, 560, 1.95] },
      { d: tM1 - tB + 0.2, a: [1260, 460, 2.1], b: [1260, 460, 2.35] },
      { d: tM2 - tM1 - 0.3, a: [1500, 600, 2.7], b: [1500, 600, 2.9] },
      { d: 99, a: [1720, 460, 2.5], b: [1720, 460, 2.8] },
    ]),
    actors: [
      { id: 'B', x: 1250, expr: t < tM2 ? 'soft' : 'sad', look: 0.8, hf: put ? [1465, 622] : hand, hr: [1300, 540], lean: put ? 6 : 0, z: 'front' },
      { id: 'M', x: 1740, flip: true, expr: t < tM1 ? 'sad' : t < tM2 ? 'neutral' : 'soft', look: t > tM1 && t < tM2 ? -0.1 : -0.5, lookY: t > tM1 && t < tM2 ? 0.9 : 0.1, hf: [1700, 500], hr: [1665, 505], z: 'back' },
    ],
    props: put ? <Ledger x={1550} y={640} s={0.7} write={1} lines={5} /> : <Book x={hand[0] + 24} y={hand[1] + 6} s={0.5} />,
  };
};

/* S23 — numbers and rules written together */
export const s23 = (c: Ctx): SceneOut => {
  const { t } = c;
  const u = clamp((t - 0.8) / (c.d - 4));
  const tClose = c.E(158) - 3.0;
  const bPen: V2 = [1432 + Math.sin(t * 1.6) * 24, COUNTER_Y - 4];
  return {
    bg: 'shop',
    pal: PAL.neutral,
    cam: camSeq(t, [
      { d: tClose, a: [1420, 480, 1.45], b: [1440, 490, 1.7] },
      { d: 99, a: [1445, 560, 2.0], b: [1445, 560, 2.3] },
    ]),
    actors: [
      { id: 'C', x: 1230, expr: 'thinking', look: 0.8, lookY: 0.6, hf: [1360, 598], hr: null, lean: 8, z: 'back' },
      { id: 'B', x: 1450, flip: true, expr: 'soft', look: -0.1, lookY: 0.9, lean: 10, hf: bPen, hr: [1520, COUNTER_Y - 2], z: 'back' },
      { id: 'M', x: 1670, flip: true, expr: 'soft', look: -0.7, lookY: 0.7, lean: 7, hf: [1530, 604], hr: null, z: 'back' },
    ],
    props: (
      <>
        <Ledger x={1445} y={COUNTER_Y} s={1.15} write={u} lines={7} />
        <Pen x={bPen[0] - 6} y={bPen[1] + 4} rot={-38} />
      </>
    ),
  };
};

/* S24 — forgiveness is not an instant return */
export const s24 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tM1 = c.T(161, 1);
  const tB0 = c.T(163);
  const tB1 = c.T(165, 1);
  const tTemp = c.T(167);
  const nod = t > tB1 + 2 && t < tB1 + 4 ? Math.sin((t - tB1 - 2) * 6) * 4 : 0;
  const cashN = t < tTemp ? 2 : t < tTemp + 3 ? 3 : 4;
  return {
    bg: 'shop',
    pal: PAL.absence,
    cam: camSeq(t, [
      { d: tM1 - 0.2, a: [1180, 510, 1.5], b: [1160, 510, 1.65] },
      { d: tB0 - tM1 + 0.2, a: [900, 450, 2.3], b: [905, 450, 2.5] },
      { d: tB1 - tB0 - 0.2, a: [1400, 450, 2.3], b: [1400, 450, 2.5] },
      { d: tTemp - tB1 + 0.2, a: [1150, 500, 1.6], b: [1150, 500, 1.75] },
      { d: 99, a: [1400, 540, 1.35], b: [1520, 540, 1.5] },
    ]),
    actors: [
      { id: 'M', x: 900, expr: t < tM1 ? 'neutral' : 'soft', look: 0.9, tilt: nod, hf: t > tM1 && t < tB0 ? [1010, 560 + sway(t, 8, 1)] : null, z: 'front' },
      { id: 'B', x: 1400, flip: true, expr: t < tB1 - 0.5 ? 'thinking' : 'soft', look: -0.8, hf: t > tB0 && t < tB1 ? [1370, 410] : [1300, 640], hr: [1480, 640] },
      ...(t > tTemp - 0.5 ? [{ id: 'O' as const, x: 1750, flip: true, expr: 'neutral' as const, look: -0.4, hf: [1650, 560 + sway(t, 20, 1.2)] as V2, z: 'back' as const }] : []),
    ],
    props: (
      <>
        <Ledger x={1450} y={COUNTER_Y} write={1} />
        <Cash x={1230} y={COUNTER_Y - 4} s={0.6} n={cashN} />
        {sandals}
      </>
    ),
  };
};

/* S25 — a month later: the old key comes back */
export const s25 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tBack = c.T(171);
  const tKey = c.T(171, 1);
  const w = walkTo(t, 250, 905, tBack + 0.3, tBack + 3.4);
  const pick = clamp((t - (tBack + 3.4)) / 0.9);
  const lift = clamp((t - (tBack + 4.4)) / 0.9);
  const hand: V2 = pick < 1 ? [lerp(940, 1068, easeOut(pick)), lerp(500, 590, easeOut(pick))] : [lerp(1068, 960, easeInOut(lift)), lerp(590, 520, easeInOut(lift))];
  const holding = t > tBack + 4.3;
  return {
    bg: 'shop',
    pal: PAL.neutral,
    cam: camSeq(t, [
      { d: tBack - 0.1, a: [1420, 450, 2.4], b: [1420, 450, 2.7] },
      { d: 3.6, a: [800, 560, 1.4], b: [900, 560, 1.55] },
      { d: 99, a: [1040, 590, 2.7], b: [1000, 570, 2.5] },
    ]),
    actors: [
      { id: 'B', x: 1450, flip: true, expr: t < tBack ? 'sad' : 'soft', look: -0.8, lookY: t < tBack ? 0.6 : 0, hf: [1370, 640], hr: [1520, 640] },
      { id: 'M', x: w.x, walk: w.walk, flip: false, expr: 'neutral', look: 0.8, hf: t > tBack + 3.4 ? hand : null, z: 'front' },
    ],
    props: (
      <>
        <Ledger x={1450} y={COUNTER_Y} write={1} />
        {sandals}
        {!holding && <Key x={KEY_POS[0]} y={KEY_POS[1]} />}
        {holding && <Key x={hand[0] + 6} y={hand[1] + 30} rot={-24} />}
        {t < tKey - 99 && null}
      </>
    ),
  };
};

/* S26 — the familiar customer, the old test */
export const s26 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tM = c.T(175, 1);
  const tC = c.T(177, 1);
  const tStop = c.T(179);
  return {
    bg: 'shop',
    pal: PAL.neutral,
    cam: camSeq(t, [
      { d: tM - 0.2, a: [1330, 500, 1.35], b: [1360, 500, 1.45] },
      { d: tC - tM + 0.2, a: [1330, 470, 2.2], b: [1330, 470, 2.4] },
      { d: tStop - tC + 0.2, a: [1130, 470, 2.3], b: [1130, 470, 2.5] },
      { d: 99, a: [1340, 470, 2.6], b: [1400, 470, 2.7] },
    ]),
    actors: [
      { id: 'C', x: 1120, expr: t < tC - 0.2 ? 'neutral' : 'smile', look: 0.9, hf: t > tC ? [1210, 560] : null, z: 'front' },
      { id: 'M', x: 1340, flip: true, expr: t < tStop ? 'neutral' : 'worried', look: t < tStop ? -0.9 : 0.9, lean: t < tStop - 1 ? 6 : 0, hf: t < tStop ? [1260, 610 + sway(t, 4, 1)] : [1290, 620], hr: [1420, 630] },
      { id: 'B', x: 1700, flip: true, expr: 'neutral', look: -0.6, hf: null, hr: null },
    ],
    props: <Ledger x={1330} y={COUNTER_Y} write={1} s={0.9} />,
  };
};

/* S27 — the ledger goes in front of Mahin */
export const s27 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tSlide = c.T(183) + 0.3;
  const tB = c.T(185, 1);
  const p = easeInOut(clamp((t - tSlide) / 1.6));
  const lx = lerp(1640, 1440, p);
  const goC = c.E(185) - 3.8;
  const cw = walkTo(t, 1120, 300, goC + 1.8, goC + 6);
  const actors: ActorSpec[] = [
    { id: 'C', x: cw.x, walk: cw.walk, flip: t > goC + 1.8, expr: t < goC + 1 ? 'smile' : 'surprised', look: t > goC + 1.8 ? -1 : 0.9, z: 'front', hf: null },
    { id: 'M', x: 1340, flip: true, expr: t < tSlide ? 'worried' : 'soft', look: t < c.T(183) ? 0.9 : -0.3, lookY: t > tSlide ? 0.7 : 0, hf: [1270, 625], hr: null },
    { id: 'B', x: 1700, flip: true, expr: t < tB ? 'soft' : 'soft', look: t > tB ? -0.9 : -0.6, hf: t < tSlide + 1.7 ? [lx + 82, 620] : [1560, 600], hr: [1770, 640], lean: p > 0.1 && p < 1 ? 6 : 0 },
  ];
  return {
    bg: 'shop',
    pal: PAL.ending,
    cam: camSeq(t, [
      { d: c.T(183) - 0.2, a: [1450, 500, 1.6], b: [1480, 500, 1.7] },
      { d: tB - c.T(183) + 0.2, a: [1520, 580, 2.3], b: [1500, 590, 2.1] },
      { d: 99, a: [1520, 480, 1.9], b: [1500, 490, 1.7] },
    ]),
    actors,
    props: <Ledger x={lx} y={COUNTER_Y} write={1} />,
  };
};

/* S28 — key on his own ring */
export const s28 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tHook = c.T(189) + 1.2;
  const k = easeInOut(clamp((t - tHook) / 2.4));
  const keyPos: V2 = [lerp(1120, 1262, k), lerp(612, 598, k)];
  const done = k >= 1;
  return {
    bg: 'shop',
    pal: PAL.ending,
    cam: camSeq(t, [
      { d: 3.4, a: [1220, 520, 1.7], b: [1220, 520, 1.9] },
      { d: 99, a: [1230, 580, 2.9], b: [1235, 580, 3.2] },
    ]),
    actors: [
      { id: 'M', x: 1340, flip: true, expr: 'neutral', look: -0.6, lookY: 0.7, lean: 8, hf: done ? [1270, 596] : [keyPos[0] - 4, keyPos[1] - 20], hr: [1370, 610], z: 'back' },
      { id: 'B', x: 1700, flip: true, expr: 'soft', look: -0.8, hf: null, z: 'back' },
    ],
    props: (
      <>
        <KeyRing x={1262} y={596} s={0.9} keys={2} extra={done} rot={-10} />
        {!done && <Key x={keyPos[0]} y={keyPos[1]} rot={-16 * k} s={0.9} />}
      </>
    ),
    bgProps: { bulb: true },
  };
};

/* S29 — same lock, different meaning for the door */
export const s29 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tClosed = c.T(193);
  const tOpen = c.T(195) + 0.4;
  const open = easeInOut(clamp((t - tOpen) / 3.2));
  const turn = clamp((t - 0.4) / 2.0);
  return {
    bg: 'street',
    pal: PAL.ending,
    bgProps: { shutter: 1 - 0.55 * open, doorGlow: open, garland: false },
    cam: camSeq(t, [
      { d: tClosed - 0.2, a: [1060, 560, 1.5], b: [1150, 600, 1.9] },
      { d: tOpen - tClosed + 0.2, a: [1170, 640, 2.3], b: [1180, 650, 2.5] },
      { d: 99, a: [1080, 560, 1.9], b: [960, 520, 1.0] },
    ]),
    actors: [
      { id: 'B', x: 960, expr: t < tOpen ? 'soft' : 'smile', look: 0.9, z: 'front', tilt: -2 },
      { id: 'M', x: 1130, expr: 'neutral', look: 0.9, lookY: 0.2, hf: [1190, 712], hr: null, z: 'front' },
    ],
    props: <Key x={1196} y={722} rot={turn * 90} s={0.55} />,
  };
};

export const _c = [Cash];
