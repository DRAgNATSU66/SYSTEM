// Pixel-diff two shot directories. Usage: node scripts/shotdiff.mjs <base> <new> [threshold]
/* global process */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [base, next, thr = '0.001'] = process.argv.slice(2);
const threshold = Number(thr);
let failed = 0;

for (const vp of ['desktop', 'mobile']) {
  const diffDir = path.join(next, '_diff', vp);
  await mkdir(diffDir, { recursive: true });
  for (const file of (await readdir(path.join(base, vp))).filter((f) => f.endsWith('.png'))) {
    const a = PNG.sync.read(await readFile(path.join(base, vp, file)));
    let b;
    try { b = PNG.sync.read(await readFile(path.join(next, vp, file))); }
    catch { console.log(`MISSING ${vp}/${file}`); failed++; continue; }
    if (a.width !== b.width || a.height !== b.height) {
      console.log(`SIZE    ${vp}/${file} ${a.width}x${a.height} → ${b.width}x${b.height}`); failed++; continue;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const px = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
    const ratio = px / (a.width * a.height);
    const bad = ratio > threshold;
    if (bad) { failed++; await writeFile(path.join(diffDir, file), PNG.sync.write(diff)); }
    console.log(`${bad ? 'FAIL' : 'ok  '}    ${vp}/${file} ${(ratio * 100).toFixed(3)}%`);
  }
}
console.log(failed ? `${failed} route(s) over ${threshold * 100}%` : 'all routes within threshold');
process.exit(failed ? 1 : 0);
