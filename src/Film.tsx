import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Person, ActorSpec } from './art/Person';
import { PAL } from './art/palette';
import { HomeRoom, MahinRoom, Shop, ShopCounter, Street, DiningTable } from './art/Envs';
import { FPS, HEIGHT, WIDTH, SCENE_COUNT, sceneDur, sceneEnd, sceneStart, isTalking, DURATION_FRAMES } from './lib/story';
import { visemeAt, loudness } from './lib/lipsync';
import { clamp, rng } from './lib/anim';
import { SceneOut, makeCtx, COUNTER_Y } from './scenes/kit';
import { SCENES } from './scenes';
import { Halation, LightLayer, RimDefs, ShadeLayer, Texture, TextureDefs, rigFor } from './art/Lighting';

const PRE = 10; // dissolve frames before each scene boundary

const Actor: React.FC<{ a: ActorSpec; t: number; g: number; part?: ActorSpec['part']; light?: number }> = ({ a, t, g, part, light }) => {
  const talking = isTalking(a.id, g);
  const vis = a.mouth !== undefined ? undefined : visemeAt(a.id, g);
  const gest = talking ? loudness(g, 0.35) : 0;
  const emphAt = (gg: number) => (talking ? clamp((loudness(gg, 0.06) - loudness(gg, 0.8)) * 2.4, 0, 1) : 0);
  const emph = emphAt(g);
  const tiltAt = (gg: number) => (talking ? Math.sin(gg * 4.1 + a.id.length) * 1.1 * loudness(gg, 0.35) + emphAt(gg) * 1.8 : 0);
  // principles: follow-through (velocity of head / stress) + anticipation (look-ahead of stress)
  const dTilt = tiltAt(g) - tiltAt(g - 0.1);
  const dEmph = emph - emphAt(g - 0.08);
  const anti = clamp((emphAt(g + 0.12) - emph) * 1.6, 0, 1);
  const spec: ActorSpec = {
    ...a,
    vis,
    gest,
    emph,
    part,
    light,
    dTilt,
    dEmph,
    anti,
    // natural speaking motion: head nods on stressed syllables, body rocks gently
    tilt: (a.tilt ?? 0) + (talking ? Math.sin(g * 4.1 + a.id.length) * 1.1 * gest + emph * 1.8 : 0),
    lean: (a.lean ?? 0) + (talking ? Math.sin(g * 2.3) * 0.7 * gest + emph * 0.9 : 0),
  };
  return <Person a={spec} t={t} />;
};

const Atmosphere: React.FC<{ t: number; warm: boolean; id: number }> = ({ t, warm, id }) => {
  const r = rng(300 + id);
  const motes = Array.from({ length: 22 }).map(() => ({ x: r() * WIDTH, y: r() * HEIGHT, s: 1 + r() * 2.6, sp: 4 + r() * 8, ph: r() * 10 }));
  return (
    <g>
      <defs>
        <radialGradient id={`bloom${id}`} cx="22%" cy="14%" r="70%">
          <stop offset="0" stopColor={warm ? '#ffd9a0' : '#e6f2ff'} stopOpacity={0.2} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`fall${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.7" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.28} />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill={`url(#bloom${id})`} />
      <rect width={WIDTH} height={HEIGHT} fill={`url(#fall${id})`} />
      {motes.map((m, i) => (
        <circle
          key={i}
          cx={(m.x + t * m.sp * 3 + Math.sin(t * 0.4 + m.ph) * 24) % WIDTH}
          cy={(m.y - t * m.sp + HEIGHT * 4) % HEIGHT}
          r={m.s}
          fill="#fff6dc"
          opacity={0.1 + 0.1 * Math.sin(t * 0.8 + m.ph)}
        />
      ))}
    </g>
  );
};

const SceneView: React.FC<{ i: number; from: number }> = ({ i, from }) => {
  const local = useCurrentFrame();
  const gFrame = local + from;
  const s0 = sceneStart(i);
  const g = Math.max(gFrame / FPS, s0);
  const c = makeCtx(i, sceneDur(i), g);
  const out: SceneOut = SCENES[i](c);
  const [cx0, cy0, z0] = out.cam;
  // staging: very slow push-in over each scene (eased) draws the eye to the characters
  const prog = clamp((g - s0) / sceneDur(i));
  const z = z0 * (1 + 0.028 * prog * prog * (3 - 2 * prog));
  const pal = out.bg === 'home' && !out.pal ? PAL.home : out.pal;
  const tg = gFrame / FPS;
  // handheld camera: very small breathing drift (keeps the frame alive without looking shaky)
  const cx = cx0 + Math.sin(tg * 0.9 + i) * 1.6 + Math.sin(tg * 2.3) * 0.5;
  const cy = cy0 + Math.sin(tg * 0.7 + 2 + i) * 1.4;
  const roll = Math.sin(tg * 0.5 + i) * 0.12;
  const bgProps = out.bgProps ?? {};
  const rig = rigFor(out.bg, pal, (bgProps as { dusk?: boolean }).dusk);

  // actors sitting / standing behind a counter or table: their arms are drawn AFTER props so that
  // hands rest ON the ledger/counter instead of disappearing underneath it.
  const behindCounter = out.bg === 'shop' && out.counter !== false;
  const atTable = out.bg === 'home' && out.table !== false;
  const clipY = behindCounter ? COUNTER_Y + 5 : 672;
  const armsOver = (a: ActorSpec) =>
    a.z !== 'front' &&
    a.walk == null &&
    ((behindCounter && a.x > 1000) || (atTable && a.x > 560 && a.x < 1540)) &&
    !!((a.hf && a.hf[1] > 500) || (a.hr && a.hr[1] > 500));
  const back = out.actors.filter((a) => a.z !== 'front');
  const front = out.actors.filter((a) => a.z === 'front');
  const over = back.filter(armsOver);
  const fade = i === 0 ? 1 : interpolate(local, [0, PRE], [0, 1], { extrapolateRight: 'clamp' });
  const warm = parseInt(pal.tint.slice(1, 3), 16) > parseInt(pal.tint.slice(5, 7), 16);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <TextureDefs />
        <RimDefs id={String(i)} rig={rig} />
        <defs>
          <filter id={`dof${i}`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={1.5} />
          </filter>
          <clipPath id={`armclip${i}`}>
            <rect x={-600} y={-600} width={3400} height={clipY + 600} />
          </clipPath>
        </defs>
        <g transform={`translate(960 540) rotate(${roll}) scale(${z}) translate(${-cx} ${-cy})`}>
          <g filter={`url(#dof${i})`}>
            {out.bg === 'shop' && <Shop pal={pal} t={tg} {...bgProps} />}
            {out.bg === 'home' && <HomeRoom pal={pal} t={tg} />}
            {out.bg === 'room' && <MahinRoom pal={pal} t={tg} />}
            {out.bg === 'street' && <Street pal={pal} t={tg} {...bgProps} />}
          </g>
          {out.bgFront}
          {back.map((a, k) => (
            <g key={`b${k}${a.id}`} filter={`url(#rim${i})`}>
              <Actor a={a} t={tg} g={g} part={armsOver(a) ? 'body' : 'all'} light={rig.dir} />
            </g>
          ))}
          {out.bg === 'shop' && out.counter !== false && <ShopCounter pal={pal} t={tg} />}
          {out.bg === 'home' && out.table !== false && <DiningTable pal={pal} />}
          {out.props}
          {over.length > 0 && (
            <g clipPath={`url(#armclip${i})`}>
              {over.map((a, k) => (
                <g key={`o${k}${a.id}`} filter={`url(#rim${i})`}>
                  <Actor a={a} t={tg} g={g} part="arms" light={rig.dir} />
                </g>
              ))}
            </g>
          )}
          {front.map((a, k) => (
            <g key={`f${k}${a.id}`} filter={`url(#rim${i})`}>
              <Actor a={a} t={tg} g={g} light={rig.dir} />
            </g>
          ))}
          {out.front}
        </g>
        {/* colour grade: mood tint + vignette + atmosphere */}
        <defs>
          <radialGradient id={`vg${i}`} cx="50%" cy="48%" r="75%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={pal.vig} />
          </radialGradient>
        </defs>
        <ShadeLayer id={i} rig={rig} t={tg} />
        <LightLayer id={i} t={tg} rig={rig} lamp={!!(bgProps as { dusk?: boolean }).dusk} />
        <rect width={WIDTH} height={HEIGHT} fill={pal.tint} opacity={pal.tintOp} />
        <Atmosphere t={tg} warm={warm} id={i} />
        <Halation rig={rig} id={i} />
        <rect width={WIDTH} height={HEIGHT} fill={`url(#vg${i})`} />
        {out.overlay}
        <Texture />
      </svg>
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, mixBlendMode: 'soft-light', opacity: 0.2, pointerEvents: 'none' }}>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed={frame % 4} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={WIDTH} height={HEIGHT} filter="url(#grain)" />
    </svg>
  );
};

export const Film: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [DURATION_FRAMES - 20, DURATION_FRAMES - 1], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#0d0b0a' }}>
      <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
        {Array.from({ length: SCENE_COUNT }).map((_, i) => {
          const start = Math.round(sceneStart(i) * FPS);
          const end = i + 1 < SCENE_COUNT ? Math.round(sceneEnd(i) * FPS) : DURATION_FRAMES;
          const from = i === 0 ? 0 : start - PRE;
          return (
            <Sequence key={i} from={from} durationInFrames={end - from} layout="none">
              <SceneView i={i} from={from} />
            </Sequence>
          );
        })}
        <Grain />
      </AbsoluteFill>
      {audio && <Audio src={staticFile('narration.wav')} />}
    </AbsoluteFill>
  );
};
