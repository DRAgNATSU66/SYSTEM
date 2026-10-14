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
  ['tierGreen', rgba(34, 197, 94), (_, a) => `rgb(var(--tier-green-rgb) / ${a})`],
  ['tierRed', rgba(239, 68, 68), (_, a) => `rgb(var(--tier-red-rgb) / ${a})`],
  ['tierYellow', rgba(234, 179, 8), (_, a) => `rgb(var(--tier-yellow-rgb) / ${a})`],
  ['tierBlue', rgba(59, 130, 246), (_, a) => `rgb(var(--tier-blue-rgb) / ${a})`],
  ['rankSlacking', rgba(255, 49, 49), (_, a) => `rgb(var(--rank-slacking-rgb) / ${a})`],
  ['rankSigma', rgba(255, 230, 0), (_, a) => `rgb(var(--rank-sigma-rgb) / ${a})`],
  ['rankOmega', rgba(57, 255, 20), (_, a) => `rgb(var(--rank-omega-rgb) / ${a})`],
  ['rankOthers', rgba(144, 238, 144), (_, a) => `rgb(var(--rank-others-rgb) / ${a})`],
  ['rankBeta', rgba(158, 158, 158), (_, a) => `rgb(var(--rank-beta-rgb) / ${a})`],
  // rgba(0,207,255,a) is intentionally left to accentHi above; bare #9E9E9E is ambiguous (--text-secondary) so no rule.
  ['tierGreen', /#22c55e\b/gi, () => 'rgb(var(--tier-green-rgb))'],
  ['tierRed', /#ef4444\b/gi, () => 'rgb(var(--tier-red-rgb))'],
  ['tierYellow', /#eab308\b/gi, () => 'rgb(var(--tier-yellow-rgb))'],
  ['tierBlue', /#3b82f6\b/gi, () => 'rgb(var(--tier-blue-rgb))'],
  ['rankSlacking', /#ff3131\b/gi, () => 'rgb(var(--rank-slacking-rgb))'],
  ['rankSigma', /#ffe600\b/gi, () => 'rgb(var(--rank-sigma-rgb))'],
  ['rankOmega', /#39ff14\b/gi, () => 'rgb(var(--rank-omega-rgb))'],
  ['rankOthers', /#90ee90\b/gi, () => 'rgb(var(--rank-others-rgb))'],
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
