import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { ActorSpec } from './art/Person';
import { Actor } from './art/Actor';
import { PAL } from './art/palette';
import { HomeRoom, MahinRoom, Shop, ShopCounter, Street, DiningTable } from './art/Envs';
import { FPS, HEIGHT, WIDTH, SCENE_COUNT, sceneDur, sceneEnd, sceneStart, DURATION_FRAMES } from './lib/story';
import { clamp, rng, V2 } from './lib/anim';
import { SceneOut, makeCtx, headroom, COUNTER_Y } from './scenes/kit';
import { SCENES } from './scenes';
import { smoothEmotion } from './lib/emotion';
import { Halation, LightLayer, RimDefs, ShadeLayer, Texture, TextureDefs, rigFor } from './art/Lighting';

const PRE = 10; // dissolve frames before each scene boundary

export { Actor };

const Atmosphere: React.FC<{ t: number; warm: boolean; id: number }> = ({ t, warm, id }) => {
  const r = rng(300 + id);
  const motes = Array.from({ length: 22 }).map(() => ({ x: r() * WIDTH, y: r() * HEIGHT, s: 1 + r() * 2.6, sp: 4 + r() * 8, ph: r() * 10 }));
  return (
    <g>
      <defs>
        <radialGradient id={`bloom${id}`} cx="22%" cy="14%" r="70%">
          <stop offset="0" stopColor={warm ? '#ffd9a0' : '#e6f2ff'} stopOpacity={0.12} />
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
          // wrap with a positive modulo: after a few minutes `t * sp` exceeds the offset and plain `%`
          // would push motes to negative coordinates (invisible / stuck outside the frame)
          cx={(((m.x + t * m.sp * 3 + Math.sin(t * 0.4 + m.ph) * 24) % WIDTH) + WIDTH) % WIDTH}
          cy={(((m.y - t * m.sp) % HEIGHT) + HEIGHT) % HEIGHT}
          r={m.s}
          fill="#fff6dc"
          opacity={0.05 + 0.05 * Math.sin(t * 0.8 + m.ph)}
        />
      ))}
    </g>
  );
};

const SceneView: React.FC<{ i: number; from: number }> = ({ i, from }) => {
  const local = useCurrentFrame();
  const gFrame = local + from;
  const s0 = sceneStart(i);
  // NOT clamped to s0: during the PRE pre-roll frames (t = -PRE/FPS .. 0) motion and lip-sync keep advancing smoothly
  const g = gFrame / FPS;
  const sid = `s${i}`;
  const c = makeCtx(i, sceneDur(i), g);
  const out: SceneOut = SCENES[i](c);
  // dialogue-driven expressions: the speaker's line emotion takes over from the scene's
  // authored expr, holds after the line, and cross-fades over 0.5 s (no pops)
  const actors: ActorSpec[] = out.actors.map((a) => {
    const sm = smoothEmotion(a.id, g, a.expr ?? 'neutral');
    return { ...a, expr: sm.expr, expr2: sm.expr2, exprK: sm.exprK };
  });
  const [cx0, cy0, z0] = out.cam;
  // staging: very slow push-in over each scene (eased) draws the eye to the characters
  const prog = clamp((g - s0) / sceneDur(i));
  const zp = z0 * (1 + 0.028 * prog * prog * (3 - 2 * prog));
  // keep every visible head inside the frame (see headroom in scenes/kit.tsx)
  const [cxg, cyg, z] = headroom([cx0, cy0, zp], actors);
  const pal = out.bg === 'home' && !out.pal ? PAL.home : out.pal;
  const tg = gFrame / FPS;
  // handheld camera: very small breathing drift (keeps the frame alive without looking shaky)
  const cx = cxg + Math.sin(tg * 0.9 + i) * 1.6 + Math.sin(tg * 2.3) * 0.5;
  const cy = cyg + Math.sin(tg * 0.7 + 2 + i) * 1.4;
  const roll = Math.sin(tg * 0.5 + i) * 0.12;
  const bgProps = out.bgProps ?? {};
  const { dusk, ...envProps } = bgProps as { dusk?: boolean } & Record<string, unknown>;
  const rig = rigFor(out.bg, pal, dusk);

  // actors sitting / standing behind a counter or table: their arms are drawn AFTER props so that
  // hands rest ON the ledger/counter instead of disappearing underneath it.
  const behindCounter = out.bg === 'shop' && out.counter !== false;
  const atTable = out.bg === 'home' && out.table !== false;
  // The hand resting ON the counter / table is drawn after the props (so it is visible on the ledger) and clipped at the
  // front lip of the counter (y = 628 + 26) / table (y = 698 - 3). Only an arm that has an explicit target on/above the
  // surface is drawn in that pass; idle arms and low (hip level) arms stay in the body pass, behind the counter.
  const clipY = behindCounter ? COUNTER_Y + 26 : 695;
  const surfaceMaxY = clipY;
  const onSurface = (pt: V2 | null | undefined) => !!pt && pt[1] >= 520 && pt[1] <= surfaceMaxY;
  const eligible = (a: ActorSpec) =>
    a.z !== 'front' && a.walk == null && ((behindCounter && a.x > 1000) || (atTable && a.x > 560 && a.x < 1540));
  const maskOf = (a: ActorSpec) => ({ front: onSurface(a.hf), rear: onSurface(a.hr) });
  const armsOver = (a: ActorSpec) => {
    if (!eligible(a)) return false;
    const m = maskOf(a);
    return m.front || m.rear;
  };
  const back = actors.filter((a) => a.z !== 'front');
  const front = actors.filter((a) => a.z === 'front');
  const over = back.filter(armsOver);
  const fade = i === 0 ? 1 : interpolate(local, [0, PRE], [0, 1], { extrapolateRight: 'clamp' });
  const warm = parseInt(pal.tint.slice(1, 3), 16) > parseInt(pal.tint.slice(5, 7), 16);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <RimDefs id={String(i)} rig={rig} />
        <defs>
          <filter id={`dof${i}`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={0.9} />
          </filter>
          {/* final look: a touch more contrast + saturation for a crisp, non-hazy image */}
          <filter id={`grade${i}`} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="1.12" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.07" intercept="-0.035" />
              <feFuncG type="linear" slope="1.07" intercept="-0.035" />
              <feFuncB type="linear" slope="1.07" intercept="-0.035" />
            </feComponentTransfer>
          </filter>
          <clipPath id={`armclip${i}`}>
            <rect x={-600} y={-600} width={3400} height={clipY + 600} />
          </clipPath>
        </defs>
        <g transform={`translate(960 540) rotate(${roll}) scale(${z}) translate(${-cx} ${-cy})`} filter={`url(#grade${i})`}>
          <g filter={`url(#dof${i})`}>
            {out.bg === 'shop' && <Shop pal={pal} t={tg} sid={sid} {...envProps} />}
            {out.bg === 'home' && <HomeRoom pal={pal} t={tg} sid={sid} chairs={out.table !== false} />}
            {out.bg === 'room' && <MahinRoom pal={pal} t={tg} sid={sid} />}
            {out.bg === 'street' && <Street pal={pal} t={tg} sid={sid} {...envProps} />}
          </g>
          {out.bgFront}
          {back.map((a, k) => (
            <g key={`b${k}${a.id}`} filter={`url(#rim${i})`}>
              <Actor
                a={armsOver(a) ? { ...a, armsMask: maskOf(a) } : a}
                t={tg}
                g={g}
                instanceId={`${sid}-${a.id}-${armsOver(a) ? 'body' : 'all'}`}
                part={armsOver(a) ? 'body' : 'all'}
                light={rig.dir}
              />
            </g>
          ))}
          {out.bg === 'shop' && out.counter !== false && <ShopCounter pal={pal} sid={sid} />}
          {out.bg === 'home' && out.table !== false && <DiningTable pal={pal} sid={sid} plates={(bgProps as { plates?: boolean }).plates !== false} />}
          {out.props}
          {over.length > 0 && (
            <g clipPath={`url(#armclip${i})`}>
              {over.map((a, k) => (
                <g key={`o${k}${a.id}`} filter={`url(#rim${i})`}>
                  <Actor a={{ ...a, armsMask: maskOf(a) }} t={tg} g={g} instanceId={`${sid}-${a.id}-arms`} part="arms" light={rig.dir} />
                </g>
              ))}
            </g>
          )}
          {front.map((a, k) => (
            <g key={`f${k}${a.id}`} filter={`url(#rim${i})`}>
              <Actor a={a} t={tg} g={g} instanceId={`${sid}-${a.id}-all`} light={rig.dir} />
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
        <LightLayer id={i} t={tg} rig={rig} lamp={!!dusk} />
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
    <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, mixBlendMode: 'soft-light', opacity: 0.1, pointerEvents: 'none' }}>
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
      {/* shared, scene-independent defs (paper-texture filter) – mounted ONCE instead of inside every SceneView */}
      <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
        <TextureDefs />
      </svg>
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
