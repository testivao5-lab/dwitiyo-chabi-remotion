import React from 'react';
import { Person, ActorSpec } from './Person';
import { isTalking } from '../lib/story';
import { visemeAt, loudness } from '../lib/lipsync';
import { clamp } from '../lib/anim';

/** A <Person> with narration-driven lip-sync, speaking head motion and gestures.
 *  `instanceId` must be unique per rendered actor / pass (scene + actor + part) – it scopes the SVG gradient and
 *  clipPath ids inside <Person>. */
export const Actor: React.FC<{
  a: ActorSpec;
  t: number;
  g: number;
  instanceId: string;
  part?: ActorSpec['part'];
  light?: number;
}> = ({ a, t, g, instanceId, part, light }) => {
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
  return <Person a={spec} t={t} instanceId={instanceId} />;
};
