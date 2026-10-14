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
