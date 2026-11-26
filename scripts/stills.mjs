// Renders preview stills (QA). Heavy work happens on GitHub Actions, not on the author's machine.
// usage: node scripts/stills.mjs [auto | frame,frame,...]
import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';

const FPS = 24;
// must match SCENE_STARTS in src/lib/story.ts
const STARTS = [0, 7.33, 41.11, 68.75, 82.96, 104, 138.06, 155.53, 176.92, 187.82, 217.15, 241.96, 260.73, 274.54, 303.63, 326.88, 339.89, 362.7, 382.98, 398.83, 429.29, 448.75, 475.28, 493.11, 523.91, 534.38, 558.13, 570.08, 578.72];
const END = 592.69;
const arg = (process.argv[2] ?? '').trim() || 'auto';
let frames = [];
if (arg === 'auto') {
  STARTS.forEach((s, i) => {
    const e = i + 1 < STARTS.length ? STARTS[i + 1] : END;
    frames.push(Math.round((s + 1.2) * FPS), Math.round((s + (e - s) * 0.62) * FPS));
  });
} else {
  frames = arg
    .split(',')
    .filter((x) => x.trim() !== '')
    .map((x) => Number(x.trim()))
    .filter((x) => !Number.isNaN(x));
}
fs.mkdirSync('out/stills', { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const inputProps = { audio: false };
const browser = await openBrowser('chrome');
try {
  const composition = await selectComposition({ serveUrl, id: 'Film', inputProps, puppeteerInstance: browser });
  frames = frames.filter((f) => {
    const ok = Number.isInteger(f) && f >= 0 && f < composition.durationInFrames;
    if (!ok) console.warn(`skipping frame ${f} (valid range 0..${composition.durationInFrames - 1})`);
    return ok;
  });
  if (frames.length === 0) throw new Error('no valid frames to render');
  for (const f of frames) {
    const out = `out/stills/f${String(f).padStart(5, '0')}.png`;
    await renderStill({ composition, serveUrl, frame: f, output: out, inputProps, imageFormat: 'png', puppeteerInstance: browser });
    console.log('rendered', out);
  }
} finally {
  await browser.close({ silent: true });
}
