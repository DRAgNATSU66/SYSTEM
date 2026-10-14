# SYSTEM v2 Redesign — Phases 1–2 (Demo Mode, Screenshot Gate, Token Migration) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app runnable without Supabase (dev-only demo mode), add a Playwright screenshot pixel-diff gate, then move every hard-coded colour and font onto CSS tokens **with zero visual change**.

**Architecture:**
- A pure, deterministic demo-data builder is seeded into the zustand stores when `VITE_DEMO_MODE=true` in dev.
- A Node script launches Vite programmatically, screenshots every route with system Chrome (via `playwright-core`), and diffs the screenshots against a stored legacy baseline with `pixelmatch`.
- Colours become RGB-channel tokens (`--accent-rgb: 0 191 255`) consumed as `rgb(var(--accent-rgb) / a)`, so alpha variants survive.
- CSS is rewritten by a tested codemod. JS/JSX colours go through `src/theme/palette.js`.

**Tech Stack:** React 19, Vite 8, zustand 5 (persist), Recharts 3, plain CSS modules, Node 24 (`node --test`), `playwright-core` + `/usr/bin/google-chrome`, `pixelmatch` + `pngjs`.

**Spec:** `docs/superpowers/specs/2026-10-14-system-redesign-design.md` (sections 3.2, 5, 6, 7 — phases 1 and 2)

## Global Constraints

- All work on branch `redesign/system-v2`. Legacy UI is tagged `ui-legacy` (`204b565`).
- Demo mode is honoured **only when `import.meta.env.DEV`** — never active in a production build.
- Phase 2 must be **pixel-identical** to the legacy baseline: per-route diff ≤ **0.1%** of pixels, at 1440×900 and 390×844, full-page.
- Baseline as measured on 2026-10-14:
  - `npm run lint` → **20 errors, 3 warnings**. No task may raise either number.
  - `npm run build` passes.
- No changes to store logic, services or sync code beyond the demo-mode branch in `AuthProvider.jsx`, `supabaseClient.js`, and null-`supabase` crash guards.
- Rank and AP-tier colour tokens (`--rank-*`, `--color-red|yellow|green|blue`) stay separate from the accent. Never rewrite them to `--accent-*`.
- Work from `frontend/` unless stated. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Bash on this machine needs `dangerouslyDisableSandbox: true` (seccomp/userns failure in the sandbox) — read-only and repo-local commands only.

## File structure

| File | Responsibility |
|---|---|
| `src/utils/demoSeed.js` (new) | Pure deterministic demo-state builder — no imports from stores/DOM |
| `src/utils/__tests__/demoSeed.test.js` (new) | `node --test` for the builder |
| `src/services/demoFlag.js` (new) | `IS_DEMO` constant only (no imports → no cycles) |
| `src/services/demoMode.js` (new) | `DEMO_USER`, `applyDemoState()` — writes builder output into stores |
| `src/services/supabaseClient.js` (modify) | Returns `null` client in demo mode |
| `src/components/auth/AuthProvider.jsx` (modify) | Demo branch before the `!supabase` branch |
| `scripts/shots.mjs` (new) | Start Vite (demo), screenshot all routes × 2 viewports, record page errors |
| `scripts/shotdiff.mjs` (new) | Pixel-diff two shot dirs, exit 1 over threshold |
| `src/theme/tokens.css` (new) | Theme tokens; `legacy` set = today's exact values |
| `src/theme/palette.js` (new) | `rgbVar()`, `toRgba()`, `cssVar()`, `useThemeColors()` |
| `src/theme/__tests__/palette.test.js` (new) | tests for pure helpers |
| `scripts/tokenize-css.mjs` (new) | CSS codemod (`tokenizeCss()` export + CLI) |
| `scripts/__tests__/tokenize-css.test.mjs` (new) | codemod tests |

---

### Task 1: Deterministic demo-state builder

**Files:**
- Create: `src/utils/demoSeed.js`
- Test: `src/utils/__tests__/demoSeed.test.js`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Produces: `buildDemoState(now: Date = new Date(), days: number = 14) → { dates: string[], aura: object, score: object, dailyMetrics: object, workoutLogs: object, profile: { name: string, username: string } }`
  - Dates are UTC `YYYY-MM-DD`, matching the app's `toISOString().split('T')[0]`.
  - `aura` keys: `totalAuraPoints, todayEarned, todayLost, todayNet, multiplier, streakDays, maxStreak, penaltyLog, auraHistory, lastLoginDate, lastStreakDate`.
  - `score` keys: `dailyScores, todayScore, weeklyScores`.
  - `dailyMetrics[date] = { sleep, deepSleep, mood, macros: { pro, carb, fat, cal }, micros: { water, fiber } }`.
  - `workoutLogs[date][group][subGroup] = [{ sets, reps, weight }]`.

- [ ] **Step 1: Write the failing test**

```js
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
```

Add to `package.json` `scripts`: `"test": "node --test \"src/**/__tests__/*.test.js\" \"scripts/__tests__/*.test.mjs\""`

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test "src/**/__tests__/*.test.js"`
Expected: FAIL — `Cannot find module '.../demoSeed.js'`

- [ ] **Step 3: Write minimal implementation**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: 5 tests PASS (the `scripts/__tests__` glob matching nothing yet is fine; if Node errors on an empty glob, temporarily run `node --test "src/**/__tests__/*.test.js"`).

- [ ] **Step 5: Commit**

```bash
git add src/utils/demoSeed.js src/utils/__tests__/demoSeed.test.js package.json
git commit -m "feat(demo): deterministic demo-state builder"
```

---

### Task 2: Demo mode wiring

**Files:**
- Create: `src/services/demoFlag.js`, `src/services/demoMode.js`
- Modify: `src/services/supabaseClient.js`, `src/components/auth/AuthProvider.jsx:30-36`, `.env.example`

**Interfaces:**
- Consumes: `buildDemoState()` from Task 1.
- Produces:
  - `IS_DEMO: boolean`, from `src/services/demoFlag.js`
  - `DEMO_USER`, from `src/services/demoMode.js`
  - `applyDemoState(now?: Date): void`, from `src/services/demoMode.js`

- [ ] **Step 1: Create the flag (no imports, so no import cycles)**

```js
// src/services/demoFlag.js
// Dev-only demo mode: skips Supabase and seeds mock data. Never true in a production build.
export const IS_DEMO = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';
```

- [ ] **Step 2: Null the client in demo mode** — in `src/services/supabaseClient.js` replace the export:

```js
import { IS_DEMO } from './demoFlag';
// ...existing url/key lines unchanged...
export const supabase = (!IS_DEMO && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;
```

- [ ] **Step 3: Store seeding**

```js
// src/services/demoMode.js
import { buildDemoState } from '../utils/demoSeed';
import { useAuraStore } from '../store/auraStore';
import { useScoreStore } from '../store/scoreStore';
import { useMetricsStore } from '../store/metricsStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';

export const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'demo@system.local',
  user_metadata: { name: 'Demo Player' },
};

const isEmpty = (v) => !v || (Array.isArray(v) ? v.length === 0 : Object.keys(v).length === 0);

// Seeds only empty stores, so edits made during a demo session survive reloads
export function applyDemoState(now = new Date()) {
  const s = buildDemoState(now);
  if (isEmpty(useAuraStore.getState().auraHistory)) useAuraStore.setState(s.aura);
  if (isEmpty(useScoreStore.getState().dailyScores)) useScoreStore.setState(s.score);
  if (isEmpty(useMetricsStore.getState().dailyMetrics)) useMetricsStore.setState({ dailyMetrics: s.dailyMetrics });
  if (isEmpty(useWorkoutStore.getState().logs)) useWorkoutStore.setState({ logs: s.workoutLogs });
  useUserStore.setState((st) => ({ profile: { ...st.profile, ...s.profile } }));
}
```

- [ ] **Step 4: Demo branch in `AuthProvider.jsx`** — add imports at the top and the branch as the first thing in the auth `useEffect`, before `if (!supabase) {`:

```js
import { IS_DEMO } from '../../services/demoFlag';
import { DEMO_USER, applyDemoState } from '../../services/demoMode';
// ...
  useEffect(() => {
    if (IS_DEMO) {
      applyDemoState();
      setUser(DEMO_USER);
      setAuthLoading(false);
      return;
    }
    if (!supabase) {
```

- [ ] **Step 5: Document the flag** — append to `.env.example`:

```
# Dev-only: skip Supabase, log in as a demo user with seeded mock data (ignored in production builds)
# VITE_DEMO_MODE=true
```

- [ ] **Step 6: Verify manually**

Run: `VITE_DEMO_MODE=true npx vite --port 5199 --strictPort` (background), then `curl -s localhost:5199 | grep -c '<div id="root">'`.
Expected: `1`. Full in-browser verification happens in Task 3's harness.

Then run `npm run build && grep -c "demo@system.local" dist/assets/*.js`.
Expected: build passes. A count ≥1 is acceptable — the constant is bundled, but `IS_DEMO` is statically `false` in production, so the branch is dead.

Run `npm run lint 2>&1 | tail -2`.
Expected: still `20 errors, 3 warnings` or fewer.

- [ ] **Step 7: Commit**

```bash
git add src/services/demoFlag.js src/services/demoMode.js src/services/supabaseClient.js src/components/auth/AuthProvider.jsx .env.example
git commit -m "feat(demo): dev-only demo mode that skips Supabase and seeds mock data"
```

---

### Task 3: Screenshot harness, pixel diff, crash guards, legacy baseline

**Files:**
- Create: `scripts/shots.mjs`, `scripts/shotdiff.mjs`
- Modify: `package.json` (devDependencies + scripts), `../.gitignore` (add `frontend/.shots/`)
- Modify, only if the harness reports page errors: the offending page files. These get null-`supabase` guards and nothing else.

**Interfaces:**
- Consumes: demo mode from Task 2.
- Produces:
  - `npm run shots -- <outDir>` writes `<outDir>/<viewport>/<route-slug>.png` and `<outDir>/errors.json`. Exit code 1 if any route logged a `pageerror`.
  - `npm run shotdiff -- <baseDir> <newDir> [threshold=0.001]` prints a per-route ratio and exits 1 if any ratio is over the threshold or any dimensions differ.
  - Env: `SHOTS_PORT` (default `5199`).

- [ ] **Step 1: Install dev dependencies**

Run: `npm i -D playwright-core pixelmatch pngjs`
Expected: added to `devDependencies`. Do **not** run `playwright install` — the harness uses `/usr/bin/google-chrome`.

- [ ] **Step 2: Write `scripts/shots.mjs`**

```js
// Screenshot every route in demo mode for the pixel-diff gate.
// Usage: node scripts/shots.mjs <outDir>
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || '.shots/current');
const PORT = Number(process.env.SHOTS_PORT || 5199);
const ROUTES = ['/', '/command', '/habits', '/workout', '/study', '/nutrition', '/sleep', '/mood', '/goals',
  '/sidehustles', '/social', '/duels', '/leaderboard', '/history', '/calendar', '/shop', '/settings'];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const FROZEN = new Date('2026-10-14T10:30:00Z');
const FREEZE_CSS = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';

process.env.VITE_DEMO_MODE = 'true';
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--font-render-hinting=none'] });
const errors = {};

try {
  for (const [vp, viewport] of Object.entries(VIEWPORTS)) {
    await mkdir(path.join(OUT, vp), { recursive: true });
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(FROZEN);
    let current = '';
    page.on('pageerror', (e) => (errors[`${vp}${current}`] ??= []).push(String(e.message || e)));
    for (const route of ROUTES) {
      current = route;
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: FREEZE_CSS });
      await page.waitForTimeout(500);
      const slug = route === '/' ? 'dashboard' : route.slice(1);
      await page.screenshot({ path: path.join(OUT, vp, `${slug}.png`), fullPage: true });
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.close();
}

await writeFile(path.join(OUT, 'errors.json'), JSON.stringify(errors, null, 2));
const n = Object.keys(errors).length;
console.log(`shots → ${OUT} (${n} route(s) with page errors)`);
process.exit(n ? 1 : 0);
```

- [ ] **Step 3: Write `scripts/shotdiff.mjs`**

```js
// Pixel-diff two shot directories. Usage: node scripts/shotdiff.mjs <base> <new> [threshold]
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
```

Add `package.json` scripts: `"shots": "node scripts/shots.mjs"`, `"shotdiff": "node scripts/shotdiff.mjs"`. Add `frontend/.shots/` to the repo-root `.gitignore`.

- [ ] **Step 4: Run the harness and read `errors.json`**

Run: `npm run shots -- .shots/legacy; cat .shots/legacy/errors.json`
Expected on the first run: most likely a non-zero exit, with errors on routes that call `supabase.from(...)` unguarded (for example `src/pages/Social/FriendsPage.jsx:32`).

- [ ] **Step 5: Add null-`supabase` guards to each failing call site**

These are bug fixes: the app already crashes the same way when Supabase isn't configured. Pattern — return early in the effect or handler:

```js
// inside the useEffect / async handler that calls supabase
if (!supabase) return;
```

Keep each guard to the single line at the top of the function. Re-run Step 4 until `errors.json` is `{}`.

- [ ] **Step 6: Confirm the harness is deterministic** (otherwise the gate is meaningless)

Run: `npm run shots -- .shots/legacy && npm run shots -- .shots/check && npm run shotdiff -- .shots/legacy .shots/check`
Expected: `all routes within threshold`, with every route at `0.000%`. If a route varies, find the source and pin it: unseeded randomness, `Date.now()` in render, or a live clock. Allowed fixes: harness-side CSS hiding via `addStyleTag`, or a seeded value in demo mode. Never alter the page's production behaviour.

- [ ] **Step 7: Look at the baseline**

Open 3 screenshots (`desktop/dashboard.png`, `desktop/workout.png`, `mobile/dashboard.png`) with the Read tool and confirm they show the real app with demo data — not a blank page or the `/auth` screen.

- [ ] **Step 8: Commit**

```bash
git add scripts/shots.mjs scripts/shotdiff.mjs package.json package-lock.json ../.gitignore src/pages
git commit -m "test: Playwright screenshot harness + pixel-diff gate; guard null supabase in pages"
```

---

### Task 4: Token file and palette helpers (no visual change)

**Files:**
- Create: `src/theme/tokens.css`, `src/theme/palette.js`, `src/theme/__tests__/palette.test.js`
- Modify: `src/index.css:1` (add the import), `index.html` (`<html data-theme="legacy">`)

**Interfaces:**
- Produces CSS tokens:
  - `--accent-rgb`, `--accent-hi-rgb`, `--fg-rgb`, `--shade-rgb` (space-separated channels)
  - `--font-display`, `--font-body`
- Produces JS helpers:
  - `rgbVar(name: string, alpha?: number|string) → string` — for example `'rgb(var(--accent-rgb) / 0.2)'`, for inline styles
  - `toRgba(channels: string, alpha?: number) → string` — `'0 191 255', 0.2` → `'rgba(0, 191, 255, 0.2)'`
  - `cssVar(name: string) → string` — reads the computed value from `<html>`
  - `useThemeColors() → { accent, accentHi, fg, shade, rankAlpha, rankOmega, rankSigma, rankOthers, rankSlacking, rankBeta, red, yellow, green, blue, alpha(name, a) }` — resolved strings for SVG and Recharts props. It re-reads when `useUiStore(s => s.theme)` changes.

- [ ] **Step 1: Write the failing test**

```js
// src/theme/__tests__/palette.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rgbVar, toRgba } from '../paletteCore.js';

test('rgbVar without alpha', () => assert.equal(rgbVar('--accent-rgb'), 'rgb(var(--accent-rgb))'));
test('rgbVar with alpha', () => assert.equal(rgbVar('--accent-rgb', 0.2), 'rgb(var(--accent-rgb) / 0.2)'));
test('toRgba converts channels', () => assert.equal(toRgba('0 191 255', 0.2), 'rgba(0, 191, 255, 0.2)'));
test('toRgba defaults alpha 1', () => assert.equal(toRgba(' 255 255 255 '), 'rgba(255, 255, 255, 1)'));
```

Pure helpers live in `paletteCore.js` so the test doesn't import React or zustand.

- [ ] **Step 2: Run it to verify it fails** — `npm test` → FAIL, module not found.

- [ ] **Step 3: Implement**

```js
// src/theme/paletteCore.js
// Pure colour helpers — no React/DOM so they run under node --test.
export const rgbVar = (name, alpha) => (alpha == null ? `rgb(var(${name}))` : `rgb(var(${name}) / ${alpha})`);

export function toRgba(channels, alpha = 1) {
  const [r, g, b] = channels.trim().split(/\s+/);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

```js
// src/theme/palette.js
// Single source for colours used from JS. Inline styles: rgbVar(); SVG/Recharts props: useThemeColors().
import { useMemo } from 'react';
import { useUiStore } from '../store/uiStore';
import { rgbVar, toRgba } from './paletteCore';

export { rgbVar, toRgba };

export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function useThemeColors() {
  const theme = useUiStore((s) => s.theme);
  return useMemo(() => {
    const ch = (n) => cssVar(n);
    return {
      accent: toRgba(ch('--accent-rgb')),
      accentHi: toRgba(ch('--accent-hi-rgb')),
      fg: toRgba(ch('--fg-rgb')),
      shade: toRgba(ch('--shade-rgb')),
      rankAlpha: cssVar('--rank-alpha'), rankOmega: cssVar('--rank-omega'), rankSigma: cssVar('--rank-sigma'),
      rankOthers: cssVar('--rank-others'), rankSlacking: cssVar('--rank-slacking'), rankBeta: cssVar('--rank-beta'),
      red: cssVar('--color-red'), yellow: cssVar('--color-yellow'), green: cssVar('--color-green'), blue: cssVar('--color-blue'),
      alpha: (name, a) => toRgba(ch(name), a),
    };
  }, [theme]); // eslint-disable-line react-hooks/exhaustive-deps
}
```

```css
/* src/theme/tokens.css — theme tokens. `legacy` reproduces the pre-redesign look exactly. */
:root,
[data-theme="legacy"] {
  --accent-rgb: 0 191 255;     /* #00BFFF */
  --accent-hi-rgb: 0 207 255;  /* #00CFFF */
  --fg-rgb: 255 255 255;
  --shade-rgb: 0 0 0;
  --font-display: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;  /* verbatim from src/index.css:104 */
}
```

Add `@import './theme/tokens.css';` as line 2 of `src/index.css`, directly after the Google Fonts `@import`. Set `<html lang="en" data-theme="legacy">` in `index.html`.

- [ ] **Step 4: Run tests, build and the gate**

```bash
npm test && npm run build && npm run shots -- .shots/current && npm run shotdiff -- .shots/legacy .shots/current
```

Expected: tests PASS, build OK, `all routes within threshold`.

- [ ] **Step 5: Commit**

```bash
git add src/theme index.html src/index.css
git commit -m "feat(theme): legacy token set + palette helpers (no visual change)"
```

---

### Task 5: CSS codemod

**Files:**
- Create: `scripts/tokenize-css.mjs`, `scripts/__tests__/tokenize-css.test.mjs`
- Modify (by running the codemod): every `src/**/*.css` except `src/theme/tokens.css`

**Interfaces:**
- Consumes: the tokens from Task 4.
- Produces:
  - `tokenizeCss(src: string) → { out: string, counts: Record<string, number>, unmapped: Array<{ line: number, value: string }> }`
  - CLI `node scripts/tokenize-css.mjs [--write]` prints totals and the unmapped list, and rewrites files only with `--write`.

- [ ] **Step 1: Write the failing test**

```js
// scripts/__tests__/tokenize-css.test.mjs
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
```

- [ ] **Step 2: Run it to verify it fails** — `npm test` → FAIL, module not found.

- [ ] **Step 3: Implement**

```js
// scripts/tokenize-css.mjs
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
```

- [ ] **Step 4: Run tests** — `npm test` → all PASS.

- [ ] **Step 5: Dry run, then write**

Run: `node scripts/tokenize-css.mjs > /tmp/tokenize-dry.txt; head -3 /tmp/tokenize-dry.txt`
Expected: `replacements:` shows `accent` in the hundreds (the audit counted 356 `rgba(0,191,255…)`; some of those are in JSX, so CSS will be lower), plus `fg`, `shade`, `fontDisplay` and others.

Run: `node scripts/tokenize-css.mjs --write`

- [ ] **Step 6: Gate**

```bash
npm run build && npm run shots -- .shots/current && npm run shotdiff -- .shots/legacy .shots/current
```

Expected: `all routes within threshold`. If a route fails:
1. Open `.shots/current/_diff/<vp>/<route>.png`.
2. Find the rule with `git diff -- 'src/**/*.css'`.
3. Fix the codemod (add a test reproducing the case first), `git checkout -- src` to reset the CSS, and re-run Step 5.

Never hand-patch CSS around a codemod bug.

- [ ] **Step 7: Commit, saving the unmapped list for Tasks 7–9**

```bash
node scripts/tokenize-css.mjs | sed -n '/^unmapped/,$p' > scripts/unmapped-css.txt
git add scripts/tokenize-css.mjs scripts/__tests__ scripts/unmapped-css.txt src
git commit -m "refactor(theme): codemod CSS colours/fonts onto tokens (pixel-identical)"
```

---

### Task 6: Consolidate JS palettes and chart colours

**Files:**
- Modify: `src/constants/colors.js`, `src/constants/ranks.js:2-5`, `src/hooks/useRankResolver.js:8,21,30-34,59,67`, `src/utils/apColorLogic.js`, `src/components/charts/CalendarHeatmap/CalendarHeatmap.jsx:78-81`, `src/components/charts/RadarChart/RadarChart.jsx:126-148`, `src/pages/Dashboard/APTrendChart.jsx:123-156`, `src/pages/Dashboard/WeeklyBarChart.jsx`, `src/components/charts/SubRadar/SubRadar.jsx`, `src/components/charts/DomainPieChart/DomainPieChart.jsx`

**Interfaces:**
- Consumes: `rgbVar`, `useThemeColors`, `toRgba` from Task 4.
- Produces: no new exports. Existing exports in `constants/*`, `useRankResolver`, `apColorLogic` keep the **same names and signatures**, so pages don't change in this task.

Rules for each literal (apply in this order):

1. **Consumed as CSS** (inline `style`, CSS class string): replace with `rgbVar('--accent-rgb', a)` / `var(--rank-alpha)` / `var(--color-green)` etc. — use whichever token has the identical value.
2. **Consumed as an SVG/Recharts attribute** (`stroke`, `fill`, `stopColor`, `<Cell fill>`, tick `fill`): the component calls `const c = useThemeColors();` and uses `c.accent`, `c.alpha('--fg-rgb', 0.1)`, `c.rankAlpha`, etc. SVG presentation attributes don't reliably resolve `var()`, so pass resolved strings.
3. **Constants consumed in both ways** (for example `getAPColorHex`): keep the function and signature. Make it return a `var(...)`/`rgbVar` string when callers use it as CSS. If a caller feeds it to an SVG attribute, change that caller to `useThemeColors()`. Check every caller with `grep -rn "<name>" src`.
4. `fontFamily: 'Outfit'` in JS → `fontFamily: 'var(--font-display)'`. Recharts tick `style` objects are CSS, so `var()` works there.
5. A colour with no identical token (for example `#FFD700`) → **leave it** and append it to `scripts/unmapped-js.txt` as `file:line value`. New tokens are added once, by the controller, after Tasks 7–9.

- [ ] **Step 1:** List every literal in the files above.
  Run: `grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(|'Outfit'|\"Outfit\"" <files>`.
- [ ] **Step 2:** Apply the rules file by file. Keep export names and signatures unchanged.
- [ ] **Step 3:** `npm test && npm run lint 2>&1 | tail -2 && npm run build`
  Expected: tests pass, lint ≤ 20 errors / 3 warnings, build OK.
- [ ] **Step 4:** Gate: `npm run shots -- .shots/current && npm run shotdiff -- .shots/legacy .shots/current`
  Expected: within threshold.
- [ ] **Step 5:** Commit:

```bash
git add src scripts/unmapped-js.txt
git commit -m "refactor(theme): route JS palettes and chart colours through tokens"
```

---

### Tasks 7–9: Inline-style colour migration by page group (parallel, in isolated worktrees)

These run **in parallel**, each in its own git worktree on its own branch off the Task 6 commit, so the gates don't interfere.

**Setup for each worktree:**
1. `cd frontend && npm ci`.
2. Use the baseline at the absolute path `/home/ushnik/dev/system/frontend/.shots/legacy`.
3. Set `SHOTS_PORT`: 5201 (Task 7), 5202 (Task 8), 5203 (Task 9).

| Task | Files (only these — do not touch others) |
|---|---|
| 7 | `src/pages/{Dashboard,Command,Habits,Workout,Study,Nutrition,Sleep,Mood}/**`, `src/components/**` except `charts/**` (done in Task 6) |
| 8 | `src/pages/{Goals,SideHustles,Calendar,History,Shop,Auth}/**`, `src/main.jsx`, `src/App.jsx`, `src/components/layout/Sidebar/Sidebar.jsx` progress colours |
| 9 | `src/pages/{Social,Duels,Leaderboard,Settings}/**` (heaviest: Duels has 31 inline `style={{` blocks, Friends 23, Leaderboard 22, Settings 15) |

**Interfaces:**
- Consumes: `rgbVar`, `useThemeColors` (Task 4) and the conventions from Task 6.
- Produces: no new exports. **Do not edit** `src/theme/tokens.css`, `src/index.css`, or any file outside your row.

- [ ] **Step 1:** Inventory your files.
  Run: `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d|'Outfit'|\"Outfit\"" <your files>`. Include any `*.module.css` lines listed for your files in `scripts/unmapped-css.txt`.
- [ ] **Step 2:** Apply Task 6's rules 1–5. Unmapped values go into `scripts/unmapped-<task>.txt`, not into new tokens.
- [ ] **Step 3:** `npm test && npm run lint 2>&1 | tail -2 && npm run build`
  Expected: pass, lint not above baseline.
- [ ] **Step 4:** Gate:

```bash
SHOTS_PORT=<port> npm run shots -- .shots/current && npm run shotdiff -- /home/ushnik/dev/system/frontend/.shots/legacy .shots/current
```

  Expected: within threshold.
- [ ] **Step 5:** Commit on the worktree branch:

```bash
git commit -am "refactor(theme): tokenise inline colours — <group>"
```

**Controller, after all three are done:**
1. Merge the three branches into `redesign/system-v2`. They should not conflict, since the file sets are disjoint.
2. Add tokens for recurring unmapped values to `tokens.css`, with exact legacy values. Leave one-off values (brand GIF colours and similar) as literals.
3. Run the full gate once more.

---

### Task 10: Dead code removal, final gate, transcript entry

**Files:**
- Delete: `src/App.css` (no importer); `src/components/three/**` (no importer). Before deleting each, confirm with `grep -rn "App.css\|components/three" src` that there are no references.
- Modify: `src/index.css:416` — remove the stale `.app-layout aside { width: 260px }` rule **only if the gate stays identical**. Otherwise leave it and note why in the transcript entry.
- Modify: `package.json` — remove `three`, `@react-three/fiber` and `@react-three/drei` if present and no longer imported (`grep -rn "three" src`).
- Modify: `../qna.md` — append QNA-003.

- [ ] **Step 1:** Delete, then run `npm i` to update the lockfile, then `npm run build`.
  Expected: build OK, and a smaller bundle (record the `dist` size before and after).
- [ ] **Step 2:** Final gate:
  1. `npm test && npm run lint 2>&1 | tail -2`
  2. `npm run shots -- .shots/current && npm run shotdiff -- .shots/legacy .shots/current`
  Expected: pass, lint ≤ baseline, all routes within threshold.
- [ ] **Step 3:** Measure how many literals remain:
  `grep -rnoE "rgba\(\s*0\s*,\s*191\s*,\s*255" src | wc -l` (was 356) and `grep -rno "'Outfit'" src | wc -l` (was ~180).
  Record both numbers verbatim.
- [ ] **Step 4:** Append QNA-003 to `qna.md`. Cover:
  - **mechanism:** codemod rules and the palette helpers
  - **rationale:** channel tokens versus plain hex tokens (alpha variants)
  - **blast radius**
  - **verification:** gate numbers per route, the literal counts before and after, lint before and after
  - **defence:** "how do you know nothing changed visually?"
  Use the measured numbers.
- [ ] **Step 5:** Commit:

```bash
git add -A src package.json package-lock.json ../qna.md
git commit -m "chore: remove dead three.js/App.css; QNA-003 token migration record"
```
