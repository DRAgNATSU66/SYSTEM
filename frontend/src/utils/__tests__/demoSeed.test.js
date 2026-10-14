// src/utils/__tests__/demoSeed.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoState } from '../demoSeed.js';

const NOW = new Date('2026-10-14T10:30:00Z');
const GROUPS = ['chest','shoulders','biceps','triceps','back','core','legs','calves','forearms','mobility'];

test('14 UTC dates ending today', () => {
  const s = buildDemoState(NOW);
  assert.equal(s.dates.length, 14);
  assert.equal(s.dates.at(-1), '2026-10-14');
  assert.equal(s.dates[0], '2026-10-01');
});

test('deterministic for the same clock', () => {
  assert.deepEqual(buildDemoState(NOW), buildDemoState(NOW));
});

test('days 4 and 5 are missed with penalties', () => {
  const s = buildDemoState(NOW);
  assert.equal(s.score.dailyScores[s.dates[4]], 0);
  assert.equal(s.score.dailyScores[s.dates[5]], 0);
  assert.equal(s.aura.penaltyLog.length, 2);
  assert.equal(s.aura.lastLoginDate, '2026-10-14');
});

test('metrics in app ranges', () => {
  const s = buildDemoState(NOW);
  for (const d of s.dates) {
    const m = s.dailyMetrics[d];
    assert.ok(m.mood >= 1 && m.mood <= 10, 'mood 1-10');
    assert.ok(m.sleep >= 5 && m.sleep <= 9, 'sleep hours');
    assert.ok(m.deepSleep >= 1 && m.deepSleep <= 10, 'deep sleep rating');
    assert.ok(m.micros.water >= 0 && m.micros.water % 250 === 0, 'water in 250ml glasses');
    assert.ok(m.macros.cal > 0 && m.macros.pro > 0);
  }
});

test('workout logs use real muscle groups', () => {
  const s = buildDemoState(NOW);
  const days = Object.keys(s.workoutLogs);
  assert.ok(days.length >= 4);
  for (const d of days) for (const g of Object.keys(s.workoutLogs[d])) assert.ok(GROUPS.includes(g), g);
});
