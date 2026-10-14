import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_MARKER_KEY, markDemoSeeded, purgeDemoResidue } from '../demoResidue.js';

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    keys: () => [...m.keys()],
  };
}

test('no marker: returns false and removes nothing', () => {
  const s = fakeStorage({ 'antigravity-aura-store': '{}', 'system-sync-queue': '[]' });
  assert.equal(purgeDemoResidue(s), false);
  assert.deepEqual(s.keys().sort(), ['antigravity-aura-store', 'system-sync-queue']);
});

test('marker present: purges marker, queue and antigravity-* keys, keeps others', () => {
  const s = fakeStorage({
    [DEMO_MARKER_KEY]: '1',
    'system-sync-queue': '[]',
    'antigravity-aura-store': '{}',
    'antigravity-user-store': '{}',
    'sb-xyz-auth-token': 't',
    theme: 'dark',
  });
  assert.equal(purgeDemoResidue(s), true);
  assert.deepEqual(s.keys().sort(), ['sb-xyz-auth-token', 'theme']);
});

test('markDemoSeeded sets the marker', () => {
  const s = fakeStorage();
  markDemoSeeded(s);
  assert.equal(s.getItem(DEMO_MARKER_KEY), '1');
});
