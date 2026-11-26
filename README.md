# দ্বিতীয় চাবি — Remotion animation

100% code-based (SVG + React + Remotion) 2D cinematic animation, timed to the narration audio.

* `src/data/timeline.ts` — narration alignment (silence detection + script alignment) and loudness envelope for lip-sync
* `src/art/*` — character rig (IK arms/legs, expressions), environments, props
* `src/scenes/*` — 29 scenes mapped to the script lines
* `.github/workflows/stills.yml` — QA stills / contact sheets on GitHub Actions
* `.github/workflows/render.yml` — full render in 10 parallel chunks + audio mux → Release `latest`

All heavy work (npm install, Chrome, rendering) runs on GitHub Actions.
