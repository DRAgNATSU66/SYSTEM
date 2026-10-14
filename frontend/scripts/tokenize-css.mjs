// Codemod: hard-coded colours/fonts → theme tokens with identical rendered values.
// Usage: node scripts/tokenize-css.mjs [--write]
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rgba = (r, g, b) => new RegExp(`rgba\\(\\s*${r}\\s*,\\s*${g}\\s*,\\s*${b}\\s*,\\s*([0-9.]+)\\s*\\)`, 'gi');
const RULES = [
  ['accent', rgba(0, 191, 255), (_, a) => `rgb(var(--accent-rgb) / ${a})`],
  ['accentHi', rgba(0, 207, 255), (_, a) => `rgb(var(--accent-hi-rgb) / ${a})`],
  ['fg', rgba(255, 255, 255), (_, a) => `rgb(var(--fg-rgb) / ${a})`],
  ['shade', rgba(0, 0, 0), (_, a) => `rgb(var(--shade-rgb) / ${a})`],
  ['accent', /#00bfff\b/gi, () => 'rgb(var(--accent-rgb))'],
  ['accentHi', /#00cfff\b/gi, () => 'rgb(var(--accent-hi-rgb))'],
  ['fg', /#(?:ffffff|fff)\b/gi, () => 'rgb(var(--fg-rgb))'],
  ['shade', /#(?:000000|000)\b/gi, () => 'rgb(var(--shade-rgb))'],
  ['fontDisplay', /font-family:\s*['"]?Outfit['"]?[^;}]*/g, () => 'font-family: var(--font-display)'],
  ['fontBody', /font-family:\s*['"]?Inter['"]?[^;}]*/g, () => 'font-family: var(--font-body)'],
];
// Semantic palettes (rank, AP tier) must stay independent of the accent
const PROTECTED_LINE = /^\s*--(rank|color|tier)-/;
const LEFTOVER = /#[0-9a-f]{3,8}\b|rgba?\(\s*\d[^)]*\)/gi;

export function tokenizeCss(src) {
  const counts = {};
  const unmapped = [];
  const out = src.split('\n').map((line, i) => {
    if (PROTECTED_LINE.test(line)) return line;
    let next = line;
    for (const [key, re, fn] of RULES) {
      next = next.replace(re, (...m) => { counts[key] = (counts[key] || 0) + 1; return fn(...m); });
    }
    for (const m of next.matchAll(LEFTOVER)) unmapped.push({ line: i + 1, value: m[0] });
    return next;
  }).join('\n');
  return { out, counts, unmapped };
}

async function* cssFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* cssFiles(p);
    else if (e.name.endsWith('.css') && !p.endsWith(path.join('theme', 'tokens.css'))) yield p;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const totals = {};
  const report = [];
  for await (const file of cssFiles(path.resolve('src'))) {
    const src = await readFile(file, 'utf8');
    const { out, counts, unmapped } = tokenizeCss(src);
    for (const [k, v] of Object.entries(counts)) totals[k] = (totals[k] || 0) + v;
    for (const u of unmapped) report.push(`${path.relative('.', file)}:${u.line}  ${u.value}`);
    if (write && out !== src) await writeFile(file, out);
  }
  console.log('replacements:', totals);
  console.log(`unmapped (${report.length}):\n${report.join('\n')}`);
}
