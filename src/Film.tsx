import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Person, ActorSpec } from './art/Person';
import { PAL } from './art/palette';
import { HomeRoom, MahinRoom, Shop, ShopCounter, Street, DiningTable } from './art/Envs';
import { FPS, HEIGHT, WIDTH, SCENE_COUNT, sceneDur, sceneEnd, sceneStart, mouth, isTalking, DURATION_FRAMES } from './lib/story';
import { SceneOut, makeCtx } from './scenes/kit';
import { SCENES } from './scenes';

const PRE = 10; // dissolve frames before each scene boundary

const Actor: React.FC<{ a: ActorSpec; t: number; g: number }> = ({ a, t, g }) => {
  const m = a.mouth ?? mouth(a.id, g);
  const talking = isTalking(a.id, g);
  const spec: ActorSpec = {
    ...a,
    mouth: m,
    tilt: (a.tilt ?? 0) + (talking ? Math.sin(g * 6.3) * 1.4 : 0),
    lean: (a.lean ?? 0) + (talking ? Math.sin(g * 3.9) * 0.9 : 0),
  };
  return <Person a={spec} t={t} />;
};

const SceneView: React.FC<{ i: number; from: number }> = ({ i, from }) => {
  const local = useCurrentFrame();
  const gFrame = local + from;
  const s0 = sceneStart(i);
  const g = Math.max(gFrame / FPS, s0);
  const c = makeCtx(i, sceneDur(i), g);
  const out: SceneOut = SCENES[i](c);
  const [cx, cy, z] = out.cam;
  const pal = out.bg === 'home' && !out.pal ? PAL.home : out.pal;
  const tg = gFrame / FPS;
  const bgProps = out.bgProps ?? {};
  const back = out.actors.filter((a) => a.z !== 'front');
  const front = out.actors.filter((a) => a.z === 'front');
  const fade = i === 0 ? 1 : interpolate(local, [0, PRE], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <g transform={`translate(960 540) scale(${z}) translate(${-cx} ${-cy})`}>
          {out.bg === 'shop' && <Shop pal={pal} t={tg} {...bgProps} />}
          {out.bg === 'home' && <HomeRoom pal={pal} t={tg} />}
          {out.bg === 'room' && <MahinRoom pal={pal} t={tg} />}
          {out.bg === 'street' && <Street pal={pal} t={tg} {...bgProps} />}
          {back.map((a, k) => (
            <Actor key={`b${k}${a.id}`} a={a} t={tg} g={g} />
          ))}
          {out.bg === 'shop' && out.counter !== false && <ShopCounter pal={pal} />}
          {out.bg === 'home' && out.table !== false && <DiningTable pal={pal} />}
          {out.props}
          {front.map((a, k) => (
            <Actor key={`f${k}${a.id}`} a={a} t={tg} g={g} />
          ))}
          {out.front}
        </g>
        {/* colour grade: mood tint + vignette */}
        <defs>
          <radialGradient id={`vg${i}`} cx="50%" cy="48%" r="75%">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={pal.vig} />
          </radialGradient>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill={pal.tint} opacity={pal.tintOp} />
        <rect width={WIDTH} height={HEIGHT} fill={`url(#vg${i})`} />
        {out.overlay}
      </svg>
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, mixBlendMode: 'soft-light', opacity: 0.22, pointerEvents: 'none' }}>
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
