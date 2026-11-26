# দ্বিতীয় চাবি — Remotion animation

100% code-based (SVG + React + Remotion) 2D cinematic animation, timed to the narration audio.

* `src/data/timeline.ts` — narration alignment (silence detection + script alignment) and loudness envelope for lip-sync
* `src/art/*` — character rig (IK arms/legs, expressions), environments, props
* `src/scenes/*` — 29 scenes mapped to the script lines
* `.github/workflows/stills.yml` — QA stills / contact sheets on GitHub Actions
* `.github/workflows/render.yml` — full render in 10 parallel chunks + audio mux → Release `latest`

All heavy work (npm install, Chrome, rendering) runs on GitHub Actions.

## v2 — living characters + cinematic lighting

* `src/lib/life.ts` — deterministic "life layer": asymmetric breathing, held weight shifts, eased eye saccades, overshoot curves (pure functions of time → safe for parallel rendering)
* `src/art/Person.tsx` — 12 principles: squash & stretch (volume kept), anticipation (look-ahead of vocal stress), follow-through (hair / head / hands lag), slow-in/out, arcs (gestures from joint angles; forearm rises *in front* of the body), secondary action (breath, blink, brows, saccades), exaggeration on stress, planted feet during weight shift
* `src/art/Lighting.tsx` — per-scene lighting rig: key-light rim + bounce on characters, volumetric light shafts with dust lit only inside beams, cast + contact shadows, ceiling/floor occlusion, colour bounce, halation, baked plaster texture
* Fixes: S18 / S27 / S28 / S29 close-ups no longer crop heads; gesture arms no longer fly out like wings; bow-legged knees removed
