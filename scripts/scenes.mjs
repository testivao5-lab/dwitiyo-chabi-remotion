import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
const STARTS = [0, 7.73, 41.51, 68.91, 83.05, 104.4, 138.46, 155.93, 177.32, 188.22, 217.55, 242.36, 261.13, 274.94, 304.03, 327.28, 340.29, 363.1, 383.38, 399.23, 429.69, 449.15, 475.45, 493.3, 524.11, 534.78, 558.53, 570.48, 579.12];
const END = 592.69, FPS = 24;
const outDir = process.argv[2] || '/tmp/s';
const which = (process.argv[3] || '').split(',').filter(Boolean).map(Number);
const fr = process.argv[4] ? process.argv[4].split(',').map(Number) : [0.15, 0.5, 0.85];
const scale = Number(process.argv[5] || 0.7);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const inputProps = { audio: false };
const composition = await selectComposition({ serveUrl, id: 'Film', inputProps });
STARTS.forEach(()=>{});
for (let i = 0; i < STARTS.length; i++) {
  if (which.length && !which.includes(i + 1)) continue;
  const s = STARTS[i], e = i + 1 < STARTS.length ? STARTS[i + 1] : END;
  for (const p of fr) {
    const f = Math.round((s + (e - s) * p) * FPS);
    await renderStill({ composition, serveUrl, frame: f, output: `${outDir}/S${String(i + 1).padStart(2, '0')}_${String(Math.round(p*100)).padStart(3,'0')}_f${f}.jpg`, inputProps, imageFormat: 'jpeg', jpegQuality: 85, scale });
  }
}
