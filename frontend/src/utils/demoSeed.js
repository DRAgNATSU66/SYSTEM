// src/utils/demoSeed.js
// Deterministic demo data for VITE_DEMO_MODE (dev only). Pure: no store or DOM access,
// so it runs under `node --test` and gives byte-stable screenshots for a pinned clock.

const DAY_MS = 86400000;
const isoDay = (ms) => new Date(ms).toISOString().split('T')[0];

// mulberry32 — tiny seeded PRNG; Math.random would make screenshots flaky
function prng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPLITS = [
  { chest: ['Upper Chest', 'Middle Chest'], shoulders: ['Front Delt'], triceps: ['Long Head'] },
  { back: ['Lats (Upper/Mid/Lower)', 'Rhomboids'], biceps: ['Long Head', 'Short Head'], forearms: ['Flexors'] },
  { legs: ['Rectus Femoris', 'Biceps Femoris'], calves: ['Gastrocnemius'], core: ['Upper Abs', 'Obliques'] },
];

export function buildDemoState(now = new Date(), days = 14) {
  const rand = prng(42);
  const between = (min, max) => min + Math.floor(rand() * (max - min + 1));
  const dates = Array.from({ length: days }, (_, i) => isoDay(now.getTime() - (days - 1 - i) * DAY_MS));
  const today = dates[days - 1];

  const dailyScores = {};
  const auraHistory = [];
  const penaltyLog = [];
  const dailyMetrics = {};
  const workoutLogs = {};
  let total = 50000;
  let streak = 0;
  let maxStreak = 0;
  let multiplier = 1.0;

  dates.forEach((date, i) => {
    const missed = i === 4 || i === 5;
    if (missed) {
      streak = 0;
      multiplier = 1.0;
      total -= 1000;
      dailyScores[date] = 0;
      penaltyLog.push({ date, reason: 'Inactivity', amount: -1000 });
      auraHistory.push({ date, net: -1000, multiplier: 1.0 });
    } else {
      const score = between(700, 999);
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
      if (streak >= 7) multiplier = Math.min(4.0, 1.0 + (streak - 6) * 0.1);
      const net = Math.floor((score + (score >= 900 ? 200 : 0)) * multiplier);
      total += net;
      dailyScores[date] = score;
      auraHistory.push({ date, net, multiplier });
    }

    dailyMetrics[date] = {
      sleep: between(55, 88) / 10,
      deepSleep: between(4, 9),
      mood: between(5, 9),
      macros: { pro: between(110, 190), carb: between(160, 280), fat: between(45, 85), cal: between(1800, 2700) },
      micros: { water: between(4, 13) * 250, fiber: between(14, 34) },
    };

    if (!missed && i % 2 === 0) {
      const split = SPLITS[(i / 2) % SPLITS.length];
      workoutLogs[date] = Object.fromEntries(
        Object.entries(split).map(([group, subs]) => [
          group,
          Object.fromEntries(subs.map((sub) => [sub, [{ sets: 3, reps: between(6, 12), weight: between(10, 90) }]])),
        ])
      );
    }
  });

  return {
    dates,
    aura: {
      totalAuraPoints: total, todayEarned: 0, todayLost: 0, todayNet: 0,
      multiplier, streakDays: streak, maxStreak, penaltyLog, auraHistory,
      lastLoginDate: today, lastStreakDate: today,
    },
    score: { dailyScores, todayScore: dailyScores[today], weeklyScores: [] },
    dailyMetrics,
    workoutLogs,
    profile: { name: 'Demo Player', username: 'demo' },
  };
}
