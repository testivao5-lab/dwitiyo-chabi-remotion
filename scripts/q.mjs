// Quick QA stills: node scripts/q.mjs <frame[,frame,...]> [outDir]
import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';

const requested = (process.argv[2] ?? '')
  .split(',')
  .filter((s) => s.trim() !== '')
  .map((s) => Number(s.trim()));
const outDir = process.argv[3] || 'out/q';
if (requested.length === 0 || requested.some((f) => Number.isNaN(f))) {
  console.error('usage: node scripts/q.mjs <frame[,frame,...]> [outDir]');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const inputProps = { audio: false };
// one headless Chrome for every frame (instead of relaunching it per still)
const browser = await openBrowser('chrome');
try {
  const composition = await selectComposition({ serveUrl, id: 'Film', inputProps, puppeteerInstance: browser });
  const frames = requested.filter((f) => {
    const ok = Number.isInteger(f) && f >= 0 && f < composition.durationInFrames;
    if (!ok) console.warn(`skipping frame ${f} (valid range 0..${composition.durationInFrames - 1})`);
    return ok;
  });
  for (const f of frames) {
    const output = `${outDir}/f${String(f).padStart(5, '0')}.jpg`;
    await renderStill({ composition, serveUrl, frame: f, output, inputProps, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.6, puppeteerInstance: browser });
    console.log('rendered', output);
  }
} finally {
  await browser.close({ silent: true });
}
