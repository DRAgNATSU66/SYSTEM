# SYSTEM "SYSTEM v2" redesign — design spec

- **Date:** 2026-10-14
- **Branch:** `redesign/system-v2` (off `main` @ `204b565`; legacy UI tagged `ui-legacy`)
- **Status:** approach A and the foundation/shell section approved in chat. Section 4 (charts + new cards) uses the user's chosen features and references; the user reviews it in this document.
- **Scope:** frontend only. The backend move to self-hosted Supabase is deferred.

## 1. Goal

Re-skin SYSTEM in the visual language of *SerenIQ* (George Railean, Dribbble shot 25939172) while keeping every existing feature and some of SYSTEM's own identity. Add three new data cards. Any new data that has no store yet uses mock values; backend wiring comes later.

## 2. Decisions taken

| Topic | Decision |
|---|---|
| Visual scope | All four: palette + surfaces, framed 3-column shell, chart style, pill nav + typography. Mixed with elements of the current UI. |
| Keep old UI | The legacy look stays available three ways: git tag `ui-legacy`; a `data-theme="legacy"` token set selectable in Settings; optionally a git worktree of `ui-legacy` on a second dev port for side-by-side comparison. |
| Approach | **A — tokens first.** Migrate hard-coded colours and fonts to semantic tokens with zero visual change, then add the new theme as a second token set. Rejected: B (rewrite each module directly — 356 cyan literals edited by hand, no legacy switch); C (Tailwind/shadcn — a rewrite of all 36 modules). |
| Rank colours | Keep rank identity (Alpha cyan, Omega green, Sigma yellow, Slacking red…) but **desaturate** to sit with the mint/orchid palette. Used only on rank badges, rank cards and the leaderboard. |
| Right panel | **Command agent dock** — a compact version of the existing Command page. |
| New features | Hydration card; a food card styled like the hydration card; a muscle body map for workouts (reference: front/back "BodyMap — Your workout focus" screenshot from the user). |

## 3. Foundation and shell

### 3.1 Reference palette (sampled from the shot at 1600×1200)

| Role | Value |
|---|---|
| Frame backdrop | deep blue `#04419E` → near-black gradient |
| Surfaces | `#202020` idle pill, `#242425` main panel, `#2F3132` chart track, `#39393A` tooltip |
| Accent | `#3988FF`; active/deep `#0C49A4` |
| Secondary series | mint `#7CCEA7`, orchid `#E79DEB` |
| Muted text | `#888A95` |

### 3.2 Token layer (`frontend/src/index.css` + `frontend/src/theme/`)

- **Semantic tokens:** `--surface-0…3`, `--border-1/2`, `--text-1…3`, `--accent`, `--accent-deep`, `--accent-soft` (a translucent accent replacing the 356 `rgba(0,191,255,…)` literals at their alpha steps), `--series-1…5`, `--success/--warning/--danger`, `--radius-*`, `--font-display`, `--font-body`.
- **Rank and AP-tier tokens** stay separate: `--rank-*` and `--tier-*`.
- **One JS source for colours used in code:** `src/theme/palette.js` reads CSS variables at runtime through a `useThemeColors()` hook, for Recharts and inline styles. It replaces the four duplicate palettes (`constants/colors.js`, `constants/ranks.js`, `hooks/useRankResolver.js`, `utils/apColorLogic.js`) and `CalendarHeatmap`'s inline hex values.
- **Two token sets** on `<html data-theme>`: `legacy` (today's values, pixel-identical) and `system` (new, the default once shipped). The choice is stored in `uiStore`; the existing unused `theme` field gets repurposed.
- **Global-rule clean-up:**
  - Scope the forced `nowrap` + ellipsis on all `button` and `h1`–`h6` to opt-in classes, so new components don't inherit truncation.
  - Remove dead `App.css` and the unused `components/three/*`.
  - *(Correction, 2026-10-14: the `.app-layout aside { width: 260px }` rule is not stale. Removing it broke all 17 desktop routes by 0.29–1.57%, so it stays until the phase-4 shell rebuild replaces the layout. See QNA-004.)*

### 3.3 Framed shell

```
┌ backdrop (blue gradient) ───────────────────────────────────────────┐
│ ┌ frame (rounded 28px, glass edge) ─────────────────────────────────┐ │
│ │ [logo]  ‹   Hello, {name}  (🕐 5:30 PM)       [rank][AP][🔔][👤] │ │
│ │ ┌ sidebar ┐ ┌ main panel (Outlet) ─────────┐ ┌ Command dock ────┐ │ │
│ │ │ DAILY   │ │ page title       [actions]   │ │ SYSTEM  Chat|Log │ │ │
│ │ │ (pill)  │ │ ┌ card ┐ ┌ card ┐             │ │  PulseCore orb   │ │ │
│ │ │ ...     │ │ └──────┘ └──────┘             │ │  quick chips     │ │ │
│ │ └─────────┘ └──────────────────────────────┘ │ [input …  🎤]    │ │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

- **Sidebar:** pill items (`--surface-1` idle, `--accent` active), uppercase section labels, existing sections and progress bars kept. Collapse chevron. Becomes a drawer at ≤768px, as today.
- **Top bar:** "Hello, {name}" (from `greetingEngine`), clock pill, then the existing rank badge, score and AP readouts restyled as pills.
- **Command dock:** shares `commandStore` with `/command`; quick chips `status`, `critique`, `commend`, `timer`; input bar. **Replies are mocked for now** — the HF agent call stays only on the full Command page. Collapses to a floating button below 1280px; hidden on `/command` itself.
- **Fonts:** display font chosen from rendered previews of Manrope vs Plus Jakarta Sans (both Google Fonts, rounded geometric, close to the shot); Inter stays for body text. About 180 literal `'Outfit'` declarations become `var(--font-display)`; the legacy theme maps that token back to Outfit.

## 4. Charts and new cards

### 4.1 Chart style (`src/theme/chartTheme.js`)

Shared Recharts props and components:
- grid `--border-1` at low alpha; ticks `--text-3`
- dark rounded "track" bars, with the active bar filled in an `--accent` → `--accent-deep` gradient
- white ring dot markers; dashed "Average" reference line with a pill label
- tooltip card (`--surface-3`, label/value rows, delta badge)
- smooth two-series lines (accent + mint)
- thin segmented progress bars (`SegmentedBar` component)

Applied to RadarChart, SubRadar, DomainPieChart, APTrendChart and WeeklyBarChart. CalendarHeatmap takes its tier colours from tokens.

### 4.2 BodyMap card (Workout page + Dashboard)

- **Source data is real:** `workoutStore.logs[date][muscleGroup][subGroup] = [{sets,reps,weight}]`. Volume = Σ sets×reps×weight per group over 7 or 30 days, toggled by a pill.
- **Rendering:** front and back silhouettes; trained groups shaded in three accent intensities by volume tercile; untrained groups shown as `--surface-2`.
- **Library:** `react-muscle-highlighter@1.2.0` (MIT, React 18/19 peer, updated 2026-01). Phase 6 starts with a short spike to confirm it can match the reference look. Fallback: a hand-built SVG.
- **Group mapping:**

  | SYSTEM group | Body-map regions |
  |---|---|
  | chest | chest |
  | shoulders | front + rear deltoids |
  | biceps | biceps |
  | triceps | triceps |
  | back | trapezius, upper back, lower back |
  | core | abs, obliques |
  | legs | quadriceps, hamstrings, adductors |
  | calves | calves |
  | forearms | forearms |
  | mobility → Glutes subgroup | gluteal |

- **Interaction:** tapping a region shows that group's volume, sets and last-trained date.

### 4.3 Hydration card (Nutrition page + Dashboard)

- **Layout:** like the reference — left column with today's intake (large number + "ml"), today's remaining, yesterday, goal, and a "Drink glasses" row; right side a body silhouette filled from the feet up to intake/goal, with a soft wave edge.
- **Data:** intake and goal come from `metricsStore` micro `water` (goal = `minLimit` 3000 ml); yesterday from the same store.
- **New mock-only fields:** glass size (250 ml) and the delta badge. "+ glass" adds 250 ml through the existing store action, so it is real data.

### 4.4 Food card (Nutrition page + Dashboard)

- **Same card layout as hydration:**
  - left column: today's kcal (large), remaining, yesterday, goal (`cal` macro, `minLimit` 2500), and a "Meals" row of slot icons (breakfast/lunch/snack/dinner) in place of glasses
  - right side: a plate ring visual — concentric rings for protein (`pro`), carbs (`carb`) and fat (`fat`), each filled to intake/target in accent, mint and orchid
- **Data:** macros are real (`metricsStore`).
- **Mock for now:** the meal list and meal-slot assignment, held in a new `mealStore` seeded with mock data. That store becomes the backend hook later.

## 5. Development demo mode

Supabase cloud is paused, so the app can't currently be entered.

- **Switch:** `VITE_DEMO_MODE=true` in `frontend/.env.local`, honoured **only when `import.meta.env.DEV`**, so it is never active in a production build.
- **What it does:** `AuthProvider` sets a fake demo user, skips Supabase calls, and runs `utils/mockSeed.js` plus the new seeds (workout logs, water, macros, meals) into empty stores.
- **Scope:** it is used for the Playwright baselines and for reviewing the redesign.

## 6. Verification

There is no unit-test framework in `frontend/package.json`. Verification is:

1. `npm run build` and `npm run lint` pass after every phase. Lint has no new errors compared with the baseline count recorded in phase 1.
2. A **Playwright screenshot harness** (`frontend/scripts/shots.mjs`): it visits every route in demo mode at 1440×900 and 390×844 and saves the screenshots.
   - The **token migration (phase 2) must be pixel-identical** to the phase-1 legacy baseline, with a per-route diff threshold of ≤0.1% pixels changed. Deviations are listed, not waved through.
3. The SYSTEM v2 screens are reviewed by the user from the screenshots, with side-by-side legacy versus system pairs.
4. New cards use pure helpers for volume aggregation, the tercile split and macro→ring progress, in `src/utils/bodyMap.js` and `src/utils/nutritionViz.js`. Each is checked with a small `node --test` file, so no new framework is needed.

## 7. Phases

| # | Phase | Notes |
|---|---|---|
| 0 | Branch, legacy tag, LF normalisation | done: `f10d240` |
| 1 | Demo mode + Playwright harness + legacy baseline screenshots | |
| 2 | Token migration with zero visual change | parallel subagents by page group; pixel-diff gate |
| 3 | SYSTEM v2 token set, theme switch in Settings, fonts | |
| 4 | Framed shell: frame, sidebar, top bar, Command dock | |
| 5 | Chart theme + restyle of existing charts | |
| 6 | New cards: BodyMap, Hydration, Food (+ `mealStore` mock) | |
| 7 | Per-page polish pass + review screenshots | |

## 8. Out of scope

- Supabase migration and self-hosting
- fixing `syncEngine` bugs
- new backend tables (meals, glasses)
- a light theme (the token structure allows one later)
