// Per-scene contact stills: node scripts/scenes.mjs [outDir] [sceneNumbers,..] [fractions,..] [scale]
import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';

// must match SCENE_STARTS in src/lib/story.ts
const STARTS = [0, 7.33, 41.11, 68.75, 82.96, 104, 138.06, 155.53, 176.92, 187.82, 217.15, 241.96, 260.73, 274.54, 303.63, 326.88, 339.89, 362.7, 382.98, 398.83, 429.29, 448.75, 475.28, 493.11, 523.91, 534.38, 558.13, 570.08, 578.72];
const END = 592.69;
const FPS = 24;
const outDir = process.argv[2] || '/tmp/s';
const which = (process.argv[3] ?? '').split(',').filter((s) => s.trim() !== '').map(Number);
const fr = (process.argv[4] ?? '').trim() ? process.argv[4].split(',').filter((s) => s.trim() !== '').map(Number) : [0.15, 0.5, 0.85];
const scale = Number(process.argv[5] || 0.7);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const inputProps = { audio: false };
const browser = await openBrowser('chrome');
try {
  const composition = await selectComposition({ serveUrl, id: 'Film', inputProps, puppeteerInstance: browser });
  for (let i = 0; i < STARTS.length; i++) {
    if (which.length && !which.includes(i + 1)) continue;
    const s = STARTS[i];
    const e = i + 1 < STARTS.length ? STARTS[i + 1] : END;
    for (const p of fr) {
      const f = Math.round((s + (e - s) * p) * FPS);
      if (!Number.isInteger(f) || f < 0 || f >= composition.durationInFrames) {
        console.warn(`skipping frame ${f}`);
        continue;
      }
      await renderStill({
        composition, serveUrl, frame: f, inputProps, imageFormat: 'jpeg', jpegQuality: 85, scale, puppeteerInstance: browser,
        output: `${outDir}/S${String(i + 1).padStart(2, '0')}_${String(Math.round(p * 100)).padStart(3, '0')}_f${f}.jpg`,
      });
    }
  }
} finally {
  await browser.close({ silent: true });
}
