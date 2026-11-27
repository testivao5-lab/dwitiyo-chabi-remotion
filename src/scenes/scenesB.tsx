import { PAL } from '../art/palette';
import { Actor } from '../art/Actor';
import { Ledger, OrderPaper, Phone, Plate, Key, Sack, Sandals, Lamp } from '../art/Props';
import { clamp, easeOut, kf2, lerp, sway, V2 } from '../lib/anim';
import { Book, COUNTER_Y, Ctx, KEY_POS, SceneOut, camSeq, walkTo } from './kit';

const sandals = <Sandals x={470} y={895} s={0.95} />;

/* S11 — the restaurant owner comes to talk (Saturday) */
export const s11 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tTalk = c.T(77);
  const tFeel = c.T(79);
  const ow = walkTo(t, 240, 640, c.T(75) + 1.0, c.T(75) + 4.0);
  const paper: V2 = [850, 566];
  const talk = t > tTalk;
  return {
    bg: 'shop',
    pal: PAL.tight,
    cam: c.cam([
      { d: tTalk - 0.3, a: [900, 530, 1.1], b: [940, 520, 1.25] },
      { d: tFeel - tTalk + 0.3, a: [780, 500, 1.7], b: [850, 500, 1.85] },
      { d: 99, a: [1300, 470, 2.4], b: [1300, 465, 2.8] },
    ]),
    actors: [
      { id: 'B', x: 1320, flip: true, expr: t > tFeel ? 'worried' : 'neutral', look: t > tFeel ? -0.6 + sway(t, 0.5, 2.5) : -0.8, hf: [1250, COUNTER_Y - 6], hr: [1390, COUNTER_Y - 6] },
      { id: 'M', x: 960, flip: true, expr: 'smile', look: -0.8, hf: talk ? paper : [900, 580], hr: talk ? [895, 585] : null, z: 'front' },
      { id: 'O', x: ow.x, walk: ow.walk, walkBlend: ow.blend, flip: false, expr: 'neutral', look: 0.8, hf: talk ? [paper[0] - 50, paper[1] - 14] : null, z: 'front' },
    ],
    props: (
      <>
        <Ledger x={1440} y={COUNTER_Y} write={1} />
        {sandals}
        {talk && <OrderPaper x={paper[0]} y={paper[1] + 6} s={0.62} rot={-6} />}
      </>
    ),
  };
};

/* S12 — publicly denying Mahin's place */
export const s12 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tB1 = c.T(81, 1);
  const tO = c.T(83, 2);
  const tB2 = c.T(85, 0) - 0.1; // B's "দোকান আমার।" — frame him as soon as he starts to speak
  const tM = c.T(85, 1) - 0.15; // after it: two-shot, ends on Mahin's hurt reaction
  const step = easeOut(clamp((t - c.T(81)) / 1.2));
  const bx = lerp(1320, 1130, step);
  return {
    bg: 'shop',
    pal: PAL.tight,
    cam: c.cam([
      { d: tB1 - 0.2, a: [900, 520, 1.25], b: [960, 515, 1.35] },
      { d: tO - tB1 + 0.2, a: [1120, 450, 2.2], b: [1100, 445, 2.4] },
      { d: tB2 - tO, a: [700, 470, 2.2], b: [690, 470, 2.4] },
      { d: tM - tB2, a: [1130, 435, 2.3], b: [1130, 430, 2.45] },
      // final reaction: Mahin (x = 960) close, B (x = 1130) still in frame while he finishes the sentence
      { d: 99, a: [1050, 450, 2.0], b: [1030, 445, 2.25] },
    ]),
    actors: [
      { id: 'B', x: bx, flip: true, expr: t > tB2 ? 'stern' : 'angry', look: -0.9, hf: t > tB1 - 0.3 && t < tO ? [1000, 560 + sway(t, 8, 0.8)] : [bx - 90, COUNTER_Y - 6], hr: [bx + 70, COUNTER_Y - 6] },
      { id: 'M', x: 960, flip: true, expr: t < tB1 ? 'smile' : t < c.E(85, 0) ? 'neutral' : 'sad', look: t >= tB1 ? 0.7 : -0.8, lookY: t > c.E(85, 0) + 1 ? 0.6 : 0, hf: [878, 590], hr: [866, 592], z: 'front' }, // at O, then at B
      { id: 'O', x: 640, expr: t < tB1 ? 'neutral' : t < tO ? 'surprised' : 'neutral', look: 0.8, z: 'front', hf: t > tO ? [740, 560] : null },
    ],
    props: (
      <>
        <Ledger x={1480} y={COUNTER_Y} write={1} />
        {sandals}
        <OrderPaper x={866} y={584} s={0.62} rot={-6} />
      </>
    ),
  };
};

/* S13 — Mahin folds the order paper */
export const s13 = (c: Ctx): SceneOut => {
  const { t } = c;
  const fold = clamp((t - 0.6) / 3.8);
  const tSay = c.T(89, 1);
  const tGo = c.E(89) + 0.4;
  const ow = walkTo(t, 640, 240, tGo, tGo + 3.2);
  return {
    bg: 'shop',
    pal: PAL.tight,
    cam: c.cam([
      { d: tSay - 0.3, a: [860, 580, 3.1], b: [860, 580, 3.4] },
      { d: tGo - tSay + 0.3, a: [820, 470, 2.0], b: [800, 470, 2.2] },
      { d: 99, a: [700, 540, 1.3], b: [560, 540, 1.2] },
    ]),
    actors: [
      { id: 'M', x: 960, flip: true, expr: t > tSay ? 'soft' : 'neutral', look: -0.3, lookY: t < tSay ? 0.8 : 0, hf: [840, 575 + sway(t, 3, 1.4)], hr: [878, 580], z: 'front' },
      { id: 'O', x: ow.x, walk: ow.walk, walkBlend: ow.blend, flip: t > tGo, expr: 'neutral', look: t > tGo ? -1 : 0.9, z: 'front', op: ow.x < 330 ? clamp((ow.x - 240) / 90) : 1 },
      { id: 'B', x: 1320, flip: true, expr: 'stern', look: -0.7, hf: [1250, COUNTER_Y - 6], hr: [1390, COUNTER_Y - 6] },
    ],
    props: (
      <>
        <Ledger x={1480} y={COUNTER_Y} write={1} />
        {sandals}
        <OrderPaper x={842} y={588} s={0.72 - 0.0 * fold} rot={-6 + 6 * fold} fold={fold} />
      </>
    ),
  };
};

/* S14 — the key goes down on the counter, Mahin leaves */
export const s14 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tM1 = c.T(93, 1);
  const tM2 = c.T(95, 1);
  const tKey = c.T(97) + 0.1;
  const place = kf2(t, [[tKey - 1.0, [930, 500]], [tKey, [1066, 570]], [tKey + 0.8, [1070, 576]], [tKey + 1.3, [940, 470]]]);
  const keyDown = t > tKey + 0.6;
  const walkT = tKey + 1.3;
  const w = walkTo(t, 900, 240, walkT, c.d - 0.2);
  const handing = t > tKey - 1.0 && t < tKey + 1.3;
  return {
    bg: 'shop',
    pal: PAL.present,
    cam: c.cam([
      { d: tM1 - 0.2, a: [1190, 500, 1.5], b: [1180, 500, 1.65] },
      { d: tM2 - tM1 + 0.2, a: [900, 440, 2.3], b: [905, 425, 2.5] },
      { d: tKey - tM2 - 0.2, a: [905, 420, 2.7], b: [915, 405, 2.9] },
      { d: 1.5, a: [1090, 600, 3.0], b: [1080, 610, 3.3] },
      { d: 99, a: [800, 560, 1.4], b: [600, 560, 1.3] },
    ]),
    actors: [
      { id: 'B', x: 1380, flip: true, expr: t > tM1 ? 'stern' : 'angry', look: -0.8, hf: [1290, COUNTER_Y - 6], hr: [1470, COUNTER_Y - 6] },
      {
        id: 'M', x: w.x, walk: w.walk, walkBlend: w.blend, flip: t > walkT, z: 'front',
        expr: t < tM1 ? 'neutral' : t < tM2 ? 'soft' : t < tKey ? 'bitter' : 'neutral',
        look: t > walkT ? -1 : 0.5, lookY: t > tKey - 0.5 && t < tKey + 1.2 ? 0.9 : 0,
        hf: handing ? place : null,
        op: w.x < 330 ? clamp((w.x - 240) / 90) : 1,
      },
    ],
    props: (
      <>
        <Ledger x={1480} y={COUNTER_Y} write={1} />
        {sandals}
        {t > tKey - 1.0 && <Key x={keyDown ? KEY_POS[0] : place[0] + 6} y={keyDown ? KEY_POS[1] : place[1] + 30} rot={keyDown ? 0 : -24} />}
      </>
    ),
  };
};

/* S15 — normal at home, absent at the shop */
export const s15 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tHome = c.T(101);
  if (t < tHome - 0.2) {
    const w = walkTo(t, 1750, 420, 0.4, tHome - 0.6);
    return {
      bg: 'street',
      pal: PAL.absence,
      bgProps: { shutter: 0 },
      cam: camSeq(t, [{ d: 99, a: [1450, 540, 1.4], b: [560, 540, 1.35] }], tHome - 0.2),
      actors: [{ id: 'B', x: w.x, walk: w.walk !== null ? w.walk * 1.35 : null, walkBlend: w.blend, flip: true, expr: 'angry', look: -0.6, lean: 5, z: 'front', hf: [w.x - 90, 560], hr: [w.x + 80, 520] }],
    };
  }
  const tn = t - tHome;
  return {
    bg: 'home',
    pal: PAL.home,
    cam: camSeq(tn, [{ d: 99, a: [1050, 520, 1.25], b: [1100, 510, 1.5] }], c.d - tHome),
    actors: [
      { id: 'M', x: 760, expr: tn < 4 ? 'soft' : 'neutral', look: 0.9, hf: tn < 5 ? [850, 600] : [700, 620], z: 'back' },
      { id: 'B', x: 1300, flip: true, sit: 130, expr: t > c.T(103) ? 'thinking' : 'stern', look: -0.55, lookY: 0.35, hf: [1220, 640], hr: [1380, 640], z: 'back' }, // across the table at M
    ],
    props: <Plate x={900} y={642} s={0.8} />,
  };
};

/* S16 — "if only it were mine" */
export const s16 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tB = c.T(105, 1);
  const tM = c.T(109);
  const tSilent = c.T(111);
  return {
    bg: 'home',
    pal: PAL.home,
    table: false,
    cam: c.cam([
      { d: tM - 2.5, a: [700, 470, 2.1], b: [700, 470, 2.4] },
      { d: tSilent - tM + 2.5, a: [1160, 470, 2.2], b: [1160, 465, 2.55] },
      { d: 99, a: [720, 480, 2.4], b: [700, 480, 2.75] },
    ]),
    actors: [
      { id: 'B', x: 700, expr: t < tM ? 'stern' : t < tSilent ? 'neutral' : 'sad', look: 0.9, lookY: t > tSilent ? 0.8 : 0, hf: t > tB - 0.5 && t < tM ? [800, 570 + sway(t, 8, 0.8)] : null },
      { id: 'M', x: 1160, flip: true, expr: t < tM - 0.4 ? 'neutral' : t < tM + 2.6 ? 'bitter' : 'neutral', look: t < tB ? -0.65 : -0.9, hf: [1068, 566], hr: [1050, 588], lookY: 0 }, // eyes on B, then on the note
    ],
    props: <Book x={1060} y={598} s={0.4} rot={-10} />,
  };
};

/* S17 — Mahin's absence shows up in daily problems */
export const s17 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tCust = c.T(115, 0);
  const tCustGo = c.T(115, 2);
  const tCall = c.T(117, 0) + 1.8; // B picks up the phone
  const cw = walkTo(t, 1130, 330, tCustGo + 1.0, tCustGo + 5);
  const ow = walkTo(t, 220, 780, tCustGo + 0.2, tCustGo + 3.6);
  const search = sway(t, 0.8, 2.4);
  const calling = t > tCall - 0.6;
  return {
    bg: 'shop',
    pal: PAL.absence,
    cam: c.cam([
      { d: tCall - 1.0, a: [1090, 520, 1.35], b: [1160, 520, 1.5] },
      { d: 99, a: [1390, 430, 2.5], b: [1390, 415, 2.7] },
    ]),
    actors: [
      {
        id: 'B', x: 1400, flip: true, expr: calling ? 'angry' : 'worried', look: calling || t >= tCust ? -0.6 : -0.35 + search, lookY: 0.1, // counter/customer side — never a dead-centre camera stare
        hf: calling ? null : [1250 + sway(t, 20, 1.2), 540 + sway(t, 12, 0.9)], hr: calling ? [1462, 372] : [1500, COUNTER_Y - 6], tilt: calling ? 6 : 0,
      },
      // soft fade-in: the customer appears at the counter the moment his line starts (a hard 0→1 pop reads as a glitch)
      { id: 'K', x: cw.x, walk: cw.walk, walkBlend: cw.blend, flip: t > tCustGo + 1.0, expr: t < tCustGo ? 'neutral' : 'sad', look: t > tCustGo + 1 ? -1 : 0.9, z: 'front', hf: null, op: t < tCust - 0.2 ? 0 : clamp((t - tCust + 0.2) / 0.5) }, // one-off phone-reservation customer — NOT the acquaintance C
      ...(t > tCustGo
        ? [{ id: 'O' as const, x: ow.x, walk: ow.walk, walkBlend: ow.blend, flip: false, expr: 'neutral' as const, look: 0.9, z: 'front' as const, hf: t > tCustGo + 3.8 ? ([930, 540] as V2) : null }]
        : []),
    ],
    props: (
      <>
        <Sack x={1700} y={COUNTER_Y} s={0.7} />
        <Sack x={1790} y={COUNTER_Y} s={0.55} c="#c9b78a" />
        {sandals}
        {calling && <Phone x={1468} y={352} rot={12} s={1} />}
      </>
    ),
  };
};

/* S18 — phone call + finding the labelled box */
export const s18 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tFind = c.T(123, 0);
  const tRefl = c.T(125);
  const inCall = t < tFind - 0.3;
  const w = walkTo(t, 1480, 900, tFind - 0.2, tFind + 2.4);
  const atShelf = t > tFind + 2.4;
  const bend = atShelf ? clamp((t - tFind - 2.4) / 1.0) : 0;
  const stand = clamp((t - tRefl) / 1.0);
  const crouch = bend * (1 - stand);
  const bx = w.x;
  const tM = c.T(121, 1);
  // Mahin on the other end of the line (screen-space inset, top-left). He is unflipped, so his ear is on the LEFT of the head.
  const MX = 300;
  const mExpr = t > tM ? 'neutral' : 'soft';
  return {
    bg: 'shop',
    pal: PAL.absence,
    cam: inCall
      ? camSeq(t, [{ d: 99, a: [1000, 480, 1.28], b: [1020, 480, 1.38] }], tFind - 0.3)
      : t < tRefl
        ? camSeq(t - tFind, [{ d: 2.4, a: [1100, 520, 1.3], b: [800, 560, 1.6] }, { d: 99, a: [800, 520, 1.5], b: [790, 530, 1.7] }], tRefl - tFind)
        : camSeq(t - tRefl, [{ d: 99, a: [800, 480, 2.0], b: [795, 470, 2.3] }], c.d - tRefl),
    actors: [
      {
        id: 'B', x: bx, walk: w.walk, walkBlend: w.blend, flip: true, expr: inCall ? (t > tM ? 'neutral' : 'angry') : t > tRefl ? 'sad' : 'thinking',
        // flipped B faces left → his visible ear is on the right (x + 26): far-side (rear) hand holds the phone there
        look: -0.7, lean: 24 * crouch, sit: 65 * crouch, lookY: bend * 0.9,
        hf: !inCall && atShelf && t < tRefl ? [795, 742] : null,
        hr: inCall ? [bx + 58, 372] : null,
        tilt: inCall ? 5 : 0,
      },
    ],
    props: (
      <>
        {sandals}
        {inCall && <Phone x={bx + 62} y={352} rot={12} />}
      </>
    ),
    overlay: inCall ? (
      <g transform="translate(-400 0)">
        <defs>
          <clipPath id="inset18"><rect x={520} y={90} width={420} height={380} rx={26} /></clipPath>
        </defs>
        <rect x={510} y={80} width={440} height={400} rx={32} fill="#1b1e22" />
        <g clipPath="url(#inset18)">
          <rect x={520} y={90} width={420} height={380} fill="#8f9aa0" />
          <rect x={520} y={330} width={420} height={140} fill="#6a6b64" />
          <g>
            <rect x={774} y={104} width={142} height={172} fill="#6f5a45" stroke="#2b1d17" strokeWidth={4} />
            <rect x={784} y={114} width={122} height={152} fill="#9fb8c8" />
            <rect x={784} y={114} width={122} height={70} fill="#c4d6e0" opacity={0.7} />
            <path d="M 845 114 V 266 M 784 190 H 906" stroke="#6f5a45" strokeWidth={6} />
            <path d="M 800 128 L 830 128 L 800 160 Z" fill="#fff" opacity={0.25} />
            <rect x={768} y={268} width={154} height={12} fill="#85684d" stroke="#2b1d17" strokeWidth={3} />
          </g>
          <Actor
            a={{ id: 'M', x: MX + 400, y: 585, scale: 0.62, expr: mExpr, hr: [MX + 400 - 30, 240], look: -0.2 }}
            t={c.g}
            g={c.g}
            instanceId="s18-inset-M"
          />
          <Phone x={MX + 400 - 36} y={226} rot={-10} s={0.55} />
        </g>
      </g>
    ) : null,
  };
};

/* S19 — mother's one question */
export const s19 = (c: Ctx): SceneOut => {
  const { t } = c;
  const tB = c.T(129, 1);
  const tMo2 = c.T(131, 1);
  const plateP = clamp((t - tMo2 - 0.5) / 2.5);
  const plate: V2 = [lerp(900, 790, plateP), lerp(642, 600, plateP)];
  return {
    bg: 'home',
    pal: PAL.home,
    cam: c.cam([
      { d: c.T(127, 1) + 0.6, a: [1000, 500, 1.3], b: [980, 490, 1.45] },
      { d: tB - c.T(127, 1) - 0.6, a: [800, 460, 2.2], b: [800, 460, 2.4] },
      { d: tMo2 - tB, a: [1260, 480, 2.3], b: [1260, 480, 2.5] },
      { d: 99, a: [820, 480, 2.1], b: [900, 480, 2.0] },
    ]),
    actors: [
      { id: 'Mo', x: 760, expr: t < tMo2 ? 'soft' : 'neutral', look: 0.9, hf: t > tMo2 + 0.4 ? plate : [860, 640], hr: [700, 620], z: 'back' },
      { id: 'B', x: 1260, flip: true, sit: 130, expr: t < tB ? 'stern' : t < tMo2 + 3 ? 'bitter' : 'sad', look: -0.5, lookY: t > tMo2 + 3 ? 0.8 : 0.1, hf: [1190, 640], hr: [1350, 640], z: 'back' },
    ],
    props: <Plate x={1000} y={642} s={0.8} />,
    front: t > tMo2 + 0.4 ? <Plate x={plate[0]} y={plate[1] + 10} s={0.75} /> : null,
  };
};

/* S20 — what the ledger does not say */
export const s20 = (c: Ctx): SceneOut => {
  const { t } = c;
  const t135 = c.T(135);
  const u = clamp((t - t135) / Math.max(1, c.E(135) - t135));
  const t137 = c.T(137);
  const finger = kf2(t, [[0, [1180, 560]], [c.T(133) + 0.5, [1010, 640]], [t135 - 0.5, [1070, 640]], [t135 + 2, [1000, 620]], [c.E(135), [1160, 610]]]);
  const box = (x: number, y: number, p: number) => (
    <g opacity={clamp(p * 2) * (0.7 + 0.3 * Math.sin(t * 4 + x))}>
      <rect x={x} y={y} width={230} height={62} rx={8} fill="none" stroke="#ffd87a" strokeWidth={4} strokeDasharray="12 9" />
      <text x={x + 115} y={y + 46} fontSize={40} textAnchor="middle" fill="#ffd87a" fontFamily="Georgia, serif">?</text>
    </g>
  );
  return {
    bg: 'home',
    pal: PAL.night,
    bgProps: { plates: false }, // late at night: only the ledger and the lamp are on the table
    cam: c.cam([
      { d: c.T(133) + 0.8, a: [1100, 500, 1.35], b: [1090, 520, 1.5] },
      { d: 99, a: [1070, 540, 2.2], b: [1060, 520, 2.45] },
    ]),
    actors: [
      { id: 'B', x: 1280, flip: true, sit: 130, expr: t > t137 ? 'sad' : 'thinking', look: -0.8, lookY: t > t137 ? 0.9 : 0.6, tilt: t > t137 ? 8 : 3, lean: 12, hf: finger, hr: [1350, COUNTER_Y - 6], z: 'back' },
    ],
    props: (
      <>
        {/* entries already exist — Mahin is searching them, not writing */}
        <Ledger x={1010} y={662} s={1.35} write={1} lines={6} />
        <Lamp x={1450} y={662} s={1.1} />
        {box(655, 335, u * 3 - 0)}
        {box(905, 335, u * 3 - 1)}
        {box(780, 425, u * 3 - 2)}
      </>
    ),
  };
};
