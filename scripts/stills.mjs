// Renders preview stills (QA). Heavy work happens on GitHub Actions, not on the author's machine.
import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const FPS = 24;
const STARTS = [0, 7.73, 41.51, 68.91, 83.05, 104.4, 138.46, 155.93, 177.32, 188.22, 217.55, 242.36, 261.13, 274.94, 304.03, 327.28, 340.29, 363.1, 383.38, 399.23, 429.69, 449.15, 475.45, 493.3, 524.11, 534.78, 558.53, 570.48, 579.12];
const END = 592.69;
const arg = process.argv[2] || 'auto';
let frames = [];
if (arg === 'auto') {
  STARTS.forEach((s, i) => {
    const e = i + 1 < STARTS.length ? STARTS[i + 1] : END;
    frames.push(Math.round((s + 1.2) * FPS), Math.round((s + (e - s) * 0.62) * FPS));
  });
} else {
  frames = arg.split(',').map((x) => Number(x.trim())).filter((x) => !Number.isNaN(x));
}
fs.mkdirSync('out/stills', { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const inputProps = { audio: false };
const composition = await selectComposition({ serveUrl, id: 'Film', inputProps });
for (const f of frames) {
  const out = `out/stills/f${String(f).padStart(5, '0')}.png`;
  await renderStill({ composition, serveUrl, frame: f, output: out, inputProps, imageFormat: 'png' });
  console.log('rendered', out);
}
