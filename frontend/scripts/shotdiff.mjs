// Pixel-diff two shot directories. Usage: node scripts/shotdiff.mjs <base> <new> [threshold]
/* global process */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [base, next, thr = '0.001'] = process.argv.slice(2);
const threshold = Number(thr);
let failed = 0;
await rm(path.join(next, '_diff'), { recursive: true, force: true });
const list = async (dir) => (await readdir(dir)).filter((f) => f.endsWith('.png'));

for (const vp of ['desktop', 'mobile']) {
  const diffDir = path.join(next, '_diff', vp);
  await mkdir(diffDir, { recursive: true });
  let baseFiles;
  try { baseFiles = await list(path.join(base, vp)); }
  catch { console.error(`ERROR   base directory missing: ${path.join(base, vp)}`); process.exit(2); }
  let nextFiles = [];
  try { nextFiles = await list(path.join(next, vp)); } catch { /* reported as MISSING per file below */ }
  for (const file of nextFiles.filter((f) => !baseFiles.includes(f))) { console.log(`EXTRA   ${vp}/${file}`); failed++; }
  for (const file of baseFiles) {
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
console.log(failed ? `${failed} failure(s) (threshold ${threshold * 100}%)` : 'all routes within threshold');
process.exit(failed ? 1 : 0);
