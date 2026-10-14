import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeCss } from '../tokenize-css.mjs';

test('accent rgba keeps alpha', () => {
  assert.equal(tokenizeCss('a{color:rgba(0, 191, 255, 0.25)}').out, 'a{color:rgb(var(--accent-rgb) / 0.25)}');
});
test('leading-dot alpha and no spaces', () => {
  assert.equal(tokenizeCss('a{color:rgba(0,191,255,.5)}').out, 'a{color:rgb(var(--accent-rgb) / .5)}');
});
test('white/black alphas', () => {
  const { out } = tokenizeCss('a{background:rgba(255,255,255,0.06);box-shadow:0 0 4px rgba(0,0,0,0.4)}');
  assert.equal(out, 'a{background:rgb(var(--fg-rgb) / 0.06);box-shadow:0 0 4px rgb(var(--shade-rgb) / 0.4)}');
});
test('hex accents and white, case-insensitive, not partial matches', () => {
  const { out } = tokenizeCss('a{color:#00BFFF;border-color:#00cfff;background:#fff;fill:#fffaaa;stroke:#000000}');
  assert.equal(out, 'a{color:rgb(var(--accent-rgb));border-color:rgb(var(--accent-hi-rgb));background:rgb(var(--fg-rgb));fill:#fffaaa;stroke:rgb(var(--shade-rgb))}');
});
test('8-digit hex is left alone and reported', () => {
  const r = tokenizeCss('a{color:#00000080}');
  assert.equal(r.out, 'a{color:#00000080}');
  assert.deepEqual(r.unmapped, [{ line: 1, value: '#00000080' }]);
});
test('fonts', () => {
  const { out } = tokenizeCss("h1{font-family:'Outfit', sans-serif;}\np{font-family: \"Inter\", system-ui}");
  assert.equal(out, 'h1{font-family: var(--font-display);}\np{font-family: var(--font-body)}');
});
test('rank and tier token definitions are never rewritten', () => {
  const src = '  --rank-alpha: #00CFFF;\n  --color-blue: #3B82F6;';
  assert.equal(tokenizeCss(src).out, src);
});

test('tier/rank rgba alphas map to channel tokens', () => {
  const cases = [
    ['rgba(34, 197, 94, 0.12)', 'rgb(var(--tier-green-rgb) / 0.12)'],
    ['rgba(239,68,68,0.3)', 'rgb(var(--tier-red-rgb) / 0.3)'],
    ['rgba(234,179,8,.2)', 'rgb(var(--tier-yellow-rgb) / .2)'],
    ['rgba(59,130,246,0.1)', 'rgb(var(--tier-blue-rgb) / 0.1)'],
    ['rgba(255,49,49,.08)', 'rgb(var(--rank-slacking-rgb) / .08)'],
    ['rgba(255,230,0,0.22)', 'rgb(var(--rank-sigma-rgb) / 0.22)'],
    ['rgba(57,255,20,0.06)', 'rgb(var(--rank-omega-rgb) / 0.06)'],
    ['rgba(144,238,144,0.5)', 'rgb(var(--rank-others-rgb) / 0.5)'],
    ['rgba(158,158,158,0.4)', 'rgb(var(--rank-beta-rgb) / 0.4)'],
  ];
  for (const [i, o] of cases) assert.equal(tokenizeCss(`a{color:${i}}`).out, `a{color:${o}}`);
});
test('rank-alpha cyan rgba stays on accent-hi (no rank-alpha rgba rule)', () => {
  assert.equal(tokenizeCss('a{color:rgba(0,207,255,0.3)}').out, 'a{color:rgb(var(--accent-hi-rgb) / 0.3)}');
});
test('tier/rank bare hex maps to channel tokens, case-insensitive', () => {
  const cases = [
    ['#ff3131', '--rank-slacking-rgb'], ['#FF3131', '--rank-slacking-rgb'],
    ['#FFE600', '--rank-sigma-rgb'], ['#39ff14', '--rank-omega-rgb'],
    ['#90EE90', '--rank-others-rgb'], ['#22c55e', '--tier-green-rgb'],
    ['#EF4444', '--tier-red-rgb'], ['#eab308', '--tier-yellow-rgb'], ['#3B82F6', '--tier-blue-rgb'],
  ];
  for (const [h, t] of cases) assert.equal(tokenizeCss(`a{color:${h}}`).out, `a{color:rgb(var(${t}))}`);
});
test('bare #9E9E9E is ambiguous and left alone (reported unmapped)', () => {
  const r = tokenizeCss('a{color:#9e9e9e}');
  assert.equal(r.out, 'a{color:#9e9e9e}');
  assert.equal(r.unmapped.length, 1);
});
test('--tier- definitions stay protected', () => {
  const src = '  --tier-green-rgb: 34 197 94;';
  assert.equal(tokenizeCss(src).out, src);
});
