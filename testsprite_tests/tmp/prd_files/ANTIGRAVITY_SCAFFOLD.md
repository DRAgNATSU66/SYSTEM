# ⚡ ANTIGRAVITY — Project Scaffold
> Gamified Life OS | PWA | Vite + React + Three.js + FastAPI + Supabase

---

## 🧠 Core Concept Summary

A personal performance OS that scores your day across permanent habits, study, fitness, nutrition, sleep, content, and side hustles. Each day gets a **score (0–1000)** that resolves into a **rank**. Everything is visualized with charts, radar stats, heatmap calendars, and circular progress rings — no fluff, pure data.

---

## 🏆 Rank & Score System

| Score | Rank Title | Color | Glow |
|-------|-----------|-------|------|
| 1000–900 | **IM HIM** / Alpha | Electric Blue `#00BFFF` | ✅ |
| 899–700 | **Grinder** / Sigma | Electric Green `#39FF14` | ✅ |
| 699–500 | **Dreamer** | Electric Yellow `#FFD700` | ✅ |
| 499–300 | **Caught Lacking** / Slacking | Electric Red `#FF3131` | ✅ |
| <300 | **Normie** / Beta | Pale Gray `#9E9E9E` | ❌ |

---

## 📊 Chart Registry

| Chart | Usage | Library |
|-------|-------|---------|
| `BarLineChart` | Task completion bars + midpoint line | Recharts / D3 |
| `RadarChart` | Pentagram — Muscle, IQ, Mobility, Mood, Intelligence, Smartness | Recharts |
| `PieChart` | Per-task share of permanent habits | Recharts |
| `WaveChart` | Stress ↔ Effectiveness ratio over time | D3 / custom SVG |
| `CircularProgress` | Goal % ring (like iOS fitness ring) | Custom SVG |
| `CalendarHeatmap` | GitHub-style 5-tier color heatmap | Custom React |

---

## 🗂️ Task Type System

```
PERMANENT_DAILY   → shown every day, always contributes to score
SIDE_HUSTLE       → recurring projects (content, scripting, etc.)
MONTHLY           → active for current month, has monthly target
TEMPORARY         → custom start/end date
SINGLE_DAY        → one-off, disappears after done
```

Each task type has:
- `weight` (score contribution, configurable)
- `subcategories` (e.g. Workout → Chest, Biceps, Shoulders)
- `completion_method` (checkbox / numeric / duration / rating)

---

## 📁 Folder Structure

```
antigravity/
│
├── public/
│   ├── manifest.json              ← PWA manifest
│   ├── sw.js                      ← Service Worker
│   └── icons/                     ← PWA icons (192, 512)
│
├── src/
│   │
│   ├── main.jsx                   ← Entry point
│   ├── App.jsx                    ← Router + Layout wrapper
│   ├── index.css                  ← Global styles + CSS vars
│   │
│   ├── router/
│   │   └── routes.jsx             ← React Router v6 route config
│   │
│   ├── assets/
│   │   ├── fonts/                 ← Custom fonts
│   │   └── icons/                 ← SVG icons
│   │
│   ├── constants/
│   │   ├── ranks.js               ← Rank thresholds, colors, titles
│   │   ├── taskTypes.js           ← Enum: PERMANENT_DAILY, MONTHLY etc.
│   │   ├── colors.js              ← All color tokens, glow values
│   │   └── scoreWeights.js        ← Default weight per task category
│   │
│   ├── utils/
│   │   ├── scoreCalculator.js     ← Daily score computation logic
│   │   ├── rankResolver.js        ← Score → Rank mapping
│   │   ├── dateUtils.js           ← Week/month/streak helpers
│   │   └── chartHelpers.js        ← Data transformation for charts
│   │
│   ├── hooks/
│   │   ├── useTasks.js            ← CRUD for tasks
│   │   ├── useScore.js            ← Live daily score computation
│   │   ├── useRank.js             ← Current rank derived from score
│   │   ├── useStreak.js           ← Streak logic
│   │   ├── useHeatmap.js          ← Calendar heatmap data builder
│   │   └── useLocalStorage.js     ← Offline-first local persistence
│   │
│   ├── store/                     ← Zustand stores
│   │   ├── taskStore.js           ← All tasks, completions state
│   │   ├── userStore.js           ← Profile, preferences
│   │   ├── scoreStore.js          ← Daily/weekly/monthly scores
│   │   └── uiStore.js             ← Sidebar open, modal state, theme
│   │
│   ├── services/                  ← API layer (stubbed now, real with FastAPI later)
│   │   ├── supabaseClient.js      ← Supabase init
│   │   ├── taskService.js         ← Task CRUD API calls
│   │   ├── scoreService.js        ← Score log API calls
│   │   └── userService.js         ← Profile API calls
│   │
│   ├── components/
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.jsx             ← Left nav container
│   │   │   │   ├── SidebarItem.jsx         ← Nav link with icon + label
│   │   │   │   ├── SidebarSection.jsx      ← Group header (e.g. "DAILY", "GOALS")
│   │   │   │   └── Sidebar.module.css
│   │   │   │
│   │   │   ├── Header/
│   │   │   │   ├── Header.jsx              ← Top bar: date, rank badge, score
│   │   │   │   ├── RankBadge.jsx           ← Glowing rank chip
│   │   │   │   └── Header.module.css
│   │   │   │
│   │   │   ├── PageWrapper/
│   │   │   │   ├── PageWrapper.jsx         ← Content area padding/scroll
│   │   │   │   └── PageWrapper.module.css
│   │   │   │
│   │   │   └── BottomNav/                  ← Mobile-only nav
│   │   │       ├── BottomNav.jsx
│   │   │       └── BottomNav.module.css
│   │   │
│   │   ├── charts/
│   │   │   ├── BarLineChart/
│   │   │   │   ├── BarLineChart.jsx        ← Bar + midpoint connector line
│   │   │   │   └── BarLineChart.module.css
│   │   │   │
│   │   │   ├── RadarChart/
│   │   │   │   ├── RadarChart.jsx          ← Pentagram: 6 axes stat spider
│   │   │   │   ├── RadarAxis.jsx           ← Individual axis renderer
│   │   │   │   └── RadarChart.module.css
│   │   │   │
│   │   │   ├── PieChart/
│   │   │   │   ├── PieChart.jsx            ← Donut/pie per permanent task
│   │   │   │   └── PieChart.module.css
│   │   │   │
│   │   │   ├── WaveChart/
│   │   │   │   ├── WaveChart.jsx           ← Dual sine wave: stress vs effectiveness
│   │   │   │   └── WaveChart.module.css
│   │   │   │
│   │   │   ├── CircularProgress/
│   │   │   │   ├── CircularProgress.jsx    ← SVG ring with % fill + glow
│   │   │   │   ├── CircularLabel.jsx       ← Center text: title + value
│   │   │   │   └── CircularProgress.module.css
│   │   │   │
│   │   │   └── CalendarHeatmap/
│   │   │       ├── CalendarHeatmap.jsx     ← Full year grid
│   │   │       ├── HeatmapCell.jsx         ← Single day cell with color/glow tier
│   │   │       ├── HeatmapLegend.jsx       ← Rank color legend row
│   │   │       └── CalendarHeatmap.module.css
│   │   │
│   │   ├── tasks/
│   │   │   ├── TaskCard/
│   │   │   │   ├── TaskCard.jsx            ← Single task tile: name, score, check
│   │   │   │   ├── TaskCardMeta.jsx        ← Type badge, weight, streak
│   │   │   │   └── TaskCard.module.css
│   │   │   │
│   │   │   ├── TaskList/
│   │   │   │   ├── TaskList.jsx            ← Filtered task list renderer
│   │   │   │   └── TaskList.module.css
│   │   │   │
│   │   │   ├── TaskModal/
│   │   │   │   ├── TaskModal.jsx           ← Full detail overlay for a task
│   │   │   │   ├── TaskModalHeader.jsx     ← Title, type, streak, score
│   │   │   │   ├── TaskModalCharts.jsx     ← Mini charts inside modal
│   │   │   │   └── TaskModal.module.css
│   │   │   │
│   │   │   ├── TaskForm/
│   │   │   │   ├── TaskForm.jsx            ← Add/edit task form
│   │   │   │   ├── TaskTypeSelector.jsx    ← Dropdown: task type
│   │   │   │   ├── SubcategoryEditor.jsx   ← Add sub-items (e.g. chest, DSA)
│   │   │   │   └── TaskForm.module.css
│   │   │   │
│   │   │   ├── SubTaskPanel/
│   │   │   │   ├── SubTaskPanel.jsx        ← Expandable subcategory breakdown
│   │   │   │   ├── SubTaskItem.jsx         ← e.g. "Chest Upper" checkbox + input
│   │   │   │   └── SubTaskPanel.module.css
│   │   │   │
│   │   │   └── TaskBadge/
│   │   │       ├── TaskBadge.jsx           ← Type color chip
│   │   │       └── TaskBadge.module.css
│   │   │
│   │   ├── gamification/
│   │   │   ├── RankCard/
│   │   │   │   ├── RankCard.jsx            ← Big rank display: title + glow aura
│   │   │   │   └── RankCard.module.css
│   │   │   │
│   │   │   ├── ScoreDisplay/
│   │   │   │   ├── ScoreDisplay.jsx        ← Animated score number
│   │   │   │   └── ScoreDisplay.module.css
│   │   │   │
│   │   │   ├── StreakCounter/
│   │   │   │   ├── StreakCounter.jsx        ← Fire streak days
│   │   │   │   └── StreakCounter.module.css
│   │   │   │
│   │   │   ├── XPBar/
│   │   │   │   ├── XPBar.jsx               ← Progress to next rank
│   │   │   │   └── XPBar.module.css
│   │   │   │
│   │   │   └── AchievementBadge/
│   │   │       ├── AchievementBadge.jsx    ← Unlocked milestone badges
│   │   │       └── AchievementBadge.module.css
│   │   │
│   │   ├── ui/                            ← Reusable primitives
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   ├── Badge/
│   │   │   ├── Tooltip/
│   │   │   ├── Toggle/
│   │   │   ├── Loader/
│   │   │   └── Divider/
│   │   │
│   │   └── three/                         ← Three.js visual accents
│   │       ├── ParticleBackground/
│   │       │   └── ParticleBackground.jsx  ← Floating particles on Dashboard
│   │       ├── GlobeStats/
│   │       │   └── GlobeStats.jsx          ← Optional 3D stat globe
│   │       └── FloatingOrbs/
│   │           └── FloatingOrbs.jsx        ← Ambient rank-colored orb blobs
│   │
│   └── pages/
│       │
│       ├── Dashboard/                     ← LANDING PAGE
│       │   ├── DashboardPage.jsx          ← Grid: rank, score, calendar, radar
│       │   ├── OverviewStats.jsx          ← Top stat cards row
│       │   ├── DailyProgress.jsx          ← Today's task completion ring cluster
│       │   ├── WeeklyBarChart.jsx         ← This week score bar+line
│       │   └── Dashboard.module.css
│       │
│       ├── Workout/
│       │   ├── WorkoutPage.jsx            ← Muscle group grid + weekly bar
│       │   ├── MuscleGroupCard.jsx        ← Card per group: Chest, Biceps, etc.
│       │   ├── MuscleSubGroup.jsx         ← e.g. Chest → Upper / Lower pie
│       │   ├── WorkoutLog.jsx             ← Exercise input log
│       │   └── Workout.module.css
│       │   ── subgroups/
│       │       ├── ChestPanel.jsx         ← Upper / Lower breakdown
│       │       ├── BicepsPanel.jsx        ← Long head / Short head / Brachialis
│       │       ├── ShoulderPanel.jsx      ← Anterior / Lateral / Posterior
│       │       ├── BackPanel.jsx
│       │       ├── TricepsPanel.jsx
│       │       ├── LegsPanel.jsx
│       │       └── CorePanel.jsx
│       │
│       ├── Study/
│       │   ├── StudyPage.jsx              ← Subject grid + time breakdown
│       │   ├── SubjectCard.jsx            ← Card per subject with progress ring
│       │   ├── TopicProgress.jsx          ← Topic-level completion checklist
│       │   └── Study.module.css
│       │   └── subjects/
│       │       ├── DSAPanel.jsx
│       │       ├── DAAPanel.jsx
│       │       ├── COAPanel.jsx
│       │       └── [DynamicSubject].jsx   ← User-added subjects
│       │
│       ├── Nutrition/
│       │   ├── NutritionPage.jsx          ← Daily macro/micro dashboard
│       │   ├── MacroRings.jsx             ← Protein / Carbs / Fat circular rings
│       │   ├── MealLog.jsx                ← Meal entry list
│       │   ├── CalorieBar.jsx             ← Progress bar: consumed vs target
│       │   └── Nutrition.module.css
│       │
│       ├── Sleep/
│       │   ├── SleepPage.jsx              ← Sleep schedule tracker
│       │   ├── SleepChart.jsx             ← Duration + quality wave chart
│       │   ├── SleepSchedule.jsx          ← Target bedtime/wake display
│       │   └── Sleep.module.css
│       │
│       ├── Habits/
│       │   ├── HabitsPage.jsx             ← All permanent daily tasks
│       │   ├── HabitGrid.jsx              ← Cards for each habit
│       │   ├── HabitStreak.jsx            ← Streak visual per habit
│       │   └── Habits.module.css
│       │
│       ├── SideHustles/
│       │   ├── SideHustlesPage.jsx        ← Content creation, scripting, etc.
│       │   ├── ProjectCard.jsx            ← Card per side hustle project
│       │   ├── TaskBreakdown.jsx          ← Subtasks within a project
│       │   └── SideHustles.module.css
│       │
│       ├── Goals/
│       │   ├── GoalsPage.jsx              ← Monthly + temporary goals
│       │   ├── GoalCard.jsx               ← Card with circular progress ring
│       │   ├── GoalTimeline.jsx           ← Start/end date timeline bar
│       │   └── Goals.module.css
│       │
│       ├── Mood/
│       │   ├── MoodPage.jsx               ← Stress–Effectiveness wave + mood log
│       │   ├── MoodWave.jsx               ← Dual wave chart component
│       │   ├── MoodLogger.jsx             ← Daily mood/energy rating input
│       │   └── Mood.module.css
│       │
│       ├── Calendar/
│       │   ├── CalendarPage.jsx           ← Full-year heatmap view
│       │   ├── MonthBreakdown.jsx         ← Click month → see daily scores
│       │   ├── DayDetailDrawer.jsx        ← Slide-in: what was done that day
│       │   └── Calendar.module.css
│       │
│       └── Settings/
│           ├── SettingsPage.jsx           ← All settings hub
│           ├── ProfileSection.jsx         ← Name, avatar, reset
│           ├── TaskManager.jsx            ← Add/edit/remove any task
│           ├── ScoreWeightEditor.jsx      ← Adjust per-task weight %
│           ├── RankThresholdViewer.jsx    ← View rank system
│           ├── NotificationSettings.jsx   ← Daily reminder toggles
│           └── Settings.module.css
│
├── vite.config.js                         ← PWA plugin config
├── package.json
└── README.md
```

---

## 🧭 Sidebar Nav Structure

```
ANTIGRAVITY ⚡
─────────────────
📊  Dashboard        ← Landing (overall)
─────────────────
DAILY CORE
🏋️  Workout
📚  Study
🥗  Nutrition
😴  Sleep
💆  Mood
─────────────────
HABITS
✅  Habits           ← All permanent tasks
🎯  Goals            ← Monthly / Temporary
─────────────────
SIDE HUSTLES
🎬  Content / Projects
─────────────────
ANALYTICS
📅  Calendar         ← Full heatmap
─────────────────
⚙️  Settings
```

---

## 📐 Dashboard Layout (Landing Page)

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: [Date]   [Score: 847]   [Rank: GRINDER 🟢]       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Today    │  │ Streak   │  │ Tasks    │  │ XP Bar   │ │
│  │ Score    │  │ 🔥 12d   │  │ 7/10     │  │ ▓▓▓▓░░   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                           │
│  ┌─────────────────────┐  ┌─────────────────────────────┐│
│  │   RADAR CHART       │  │   CALENDAR HEATMAP          ││
│  │  (Pentagram Stats)  │  │  (GitHub-style grid)        ││
│  └─────────────────────┘  └─────────────────────────────┘│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │   WEEKLY BAR+LINE CHART  (Mon–Sun scores)           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐│
│  │ WORKOUT  │ │ STUDY    │ │NUTRITION │ │  MOOD WAVE   ││
│  │  Ring %  │ │  Ring %  │ │  Ring %  │ │  (mini wave) ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘│
│                                                           │
│  ─── TODAY'S PERMANENT TASKS ────────────────────────── │
│  [Task cards with check, score contribution, streak]     │
└──────────────────────────────────────────────────────────┘
```

---

## ⚙️ State Management (Zustand)

### `taskStore`
```
tasks[]           → all task definitions
completions{}     → { taskId: { date: boolean/value } }
addTask()
removeTask()
toggleCompletion()
updateSubtask()
```

### `scoreStore`
```
dailyScores{}     → { "YYYY-MM-DD": number }
todayScore        → computed
weeklyScores[]    → last 7 days
computeDayScore()
```

### `userStore`
```
profile           → { name, avatar }
preferences       → { scoreWeights, rankThresholds }
```

### `uiStore`
```
sidebarOpen       → boolean
activeModal       → null | { type, payload }
theme             → 'dark' (default)
```

---

## 🔌 Services Layer (Stub Now, Real Later)

All services export identical interfaces whether using LocalStorage or Supabase. Swap implementation without touching components.

```
taskService.js
  getTasks()
  createTask(data)
  updateTask(id, data)
  deleteTask(id)
  getCompletions(date)
  setCompletion(taskId, date, value)

scoreService.js
  getScores(startDate, endDate)
  saveScore(date, score)

userService.js
  getProfile()
  updateProfile(data)
```

---

## 🎯 Scoring Logic (scoreCalculator.js)

```
dailyScore = Σ (taskWeight × completionRate) for all tasks on that date

completionRate:
  checkbox   → 0 or 1
  numeric    → actual / target (capped at 1)
  duration   → logged / goal (capped at 1)
  rating     → rating / max_rating

taskWeight → configurable in Settings (default weights in scoreWeights.js)
Total normalized to 1000
```

---

## 📦 Key Dependencies

```json
{
  "react": "^18",
  "react-router-dom": "^6",
  "three": "^0.x",
  "@react-three/fiber": "latest",
  "recharts": "latest",
  "zustand": "latest",
  "framer-motion": "latest",
  "@supabase/supabase-js": "latest",
  "date-fns": "latest",
  "vite-plugin-pwa": "latest"
}
```

---

## 🚀 Build Phases

### Phase 1 — Frontend (Now)
- Scaffold all folders/files
- Build with hardcoded mock data
- All charts, pages, components working visually
- PWA manifest + service worker set up
- Deploy to Vercel

### Phase 2 — Local Persistence
- Wire Zustand + useLocalStorage
- App works offline-first, no backend needed
- Full scoring + rank logic functional

### Phase 3 — Backend
- FastAPI: task, score, user endpoints
- Supabase: auth + database
- Replace service stubs with real API calls
- Multi-device sync

### Phase 4 — Polish
- Push notifications (daily reminders)
- Animations + Three.js accents
- Performance optimization
- APK consideration (Capacitor over Flutter — reuse React codebase)

---

## 💜 AURA POINTS SYSTEM

> Aura Points are your **cumulative lifetime score** — they never reset. Daily activity earns or burns them. The leaderboard ranks users by total Aura Points.

### Base Rules
```
Daily MAX earn  → +1000 AP  (perfect day, all tasks done)
Daily MAX lose  → -1000 AP  (zero activity, fully ignored)
Score is UNBOUNDED — can exceed 1000/day via bonuses
Score is LOSEABLE below 0 net if inactive long enough
```

### Bonus AP (earn more than 1000/day)
```
+100–200 AP   → "Overdrive" bonus: completing optional bonus tasks
+150 AP       → All permanent tasks 100% done (full completion bonus)
+50 AP        → Every single subcategory logged (e.g. all muscle groups)
+200 AP       → Score tier "IM HIM" reached (900–1000 daily score)
+100 AP       → Mood logged as 9–10 (peak mental state bonus)
+50 AP/task   → Any single task at 150%+ of its daily target
Streak Mult.  → See multiplier table below
```

### Streak Multiplier System
```
Day 1–20       → 1.0x  (base)
Day 21         → 1.1x  (streak unlocked — "21 Day Initiation")
Day 22         → 1.2x
Day 23         → 1.3x
...capped at   → 2.0x  (day 31+, "Unstoppable" tier)

Streak BROKEN  → multiplier resets to 1.0x immediately
```
> Multiplier applies to ALL Aura Points earned that day. A 1.3x day with 1000 base AP = 1300 AP.

### Penalty System (lose more than 1000/day)
```
Condition                              | Penalty
───────────────────────────────────────|──────────────────
Fully inactive day (zero logs)         | -1000 AP
2+ consecutive inactive days           | -1100 AP/day
3+ consecutive inactive days           | -1200 AP/day  (escalating)
Ignored a PERMANENT task for 3+ days   | -200 AP/task/day (per task)
No log at all for 7+ days              | -1500 AP/day + streak nuke
"Caught Lacking" score 3 days in a row | -300 AP bonus penalty
```
> Penalties are computed server-side at midnight (or on next login if offline). Cannot go below 0 total Aura Points (floor is 0, not negative).

---

## 🏅 Leaderboard System

### Leaderboard Ranks (Top 3 only)
| Position | Rank Title | Description |
|----------|-----------|-------------|
| 🥇 #1 | **AURA FARMER** | The grind never stops. Undisputed. |
| 🥈 #2 | **THE ALPHA AND THE OMEGA** | Beginning and end. Second to none. |
| 🥉 #3 | **SIGMA** | Quiet grinder. Doesn't need validation. |
| Rest | Ranked by Aura Points | Displayed as `#4`, `#5`... |

### Leaderboard Behavior (Current Phase)
```
- Private leaderboard: only your own entries for now
- Your "vs self" leaderboard: compare this week vs last week vs best week
- Slot system ready for future users (schema already multi-user)
- Public expansion: toggle in Settings when ready
```

### Future Community Phase
```
- Invite-only join link (you control who enters)
- Each user sees: rank, username, avatar, total AP, streak, today's score
- "Challenge" mode: 7-day head-to-head with another user
- Daily push: "X is only 200 AP behind you 👀"
```

---

## 📁 Updated Folder Additions

```
src/
│
├── constants/
│   ├── auraPoints.js          ← AP earn/lose rules, bonus thresholds
│   ├── multipliers.js         ← Streak multiplier table
│   ├── penalties.js           ← Penalty conditions and values
│   └── leaderboardRanks.js    ← Top 3 titles + rest rank display rules
│
├── utils/
│   ├── auraCalculator.js      ← Compute AP earned/lost for a day
│   ├── multiplierResolver.js  ← Current streak → multiplier value
│   └── penaltyEngine.js       ← Check inactivity/ignore → compute penalty
│
├── hooks/
│   ├── useAuraPoints.js       ← Total AP, today's delta, history
│   ├── useMultiplier.js       ← Current streak multiplier state
│   └── useLeaderboard.js      ← Leaderboard fetch + self-rank
│
├── store/
│   └── auraStore.js           ← totalAP, todayEarned, todayLost,
│                                  multiplier, penaltyLog
│
├── services/
│   └── auraService.js         ← AP log CRUD, leaderboard fetch
│
├── components/
│   ├── gamification/
│   │   ├── AuraPointsDisplay/
│   │   │   ├── AuraPointsDisplay.jsx   ← Big AP counter with delta (+/-)
│   │   │   └── AuraPointsDisplay.module.css
│   │   │
│   │   ├── MultiplierBadge/
│   │   │   ├── MultiplierBadge.jsx     ← "1.3x 🔥" glowing chip
│   │   │   └── MultiplierBadge.module.css
│   │   │
│   │   └── PenaltyAlert/
│   │       ├── PenaltyAlert.jsx        ← Warning banner if streak/penalty active
│   │       └── PenaltyAlert.module.css
│   │
│   └── leaderboard/
│       ├── LeaderboardTable/
│       │   ├── LeaderboardTable.jsx    ← Full ranked list
│       │   ├── LeaderboardRow.jsx      ← Single user row: rank, name, AP, streak
│       │   └── LeaderboardTable.module.css
│       │
│       ├── TopThreePodium/
│       │   ├── TopThreePodium.jsx      ← Visual podium: #1 #2 #3 with rank titles
│       │   └── TopThreePodium.module.css
│       │
│       ├── SelfRankCard/
│       │   ├── SelfRankCard.jsx        ← Your position card: rank, AP, multiplier
│       │   └── SelfRankCard.module.css
│       │
│       └── AuraHistory/
│           ├── AuraHistory.jsx         ← Timeline of AP earned/lost per day
│           └── AuraHistory.module.css
│
└── pages/
    └── Leaderboard/
        ├── LeaderboardPage.jsx         ← Full leaderboard view
        ├── WeeklyAuraSummary.jsx       ← This week vs last week AP bar
        ├── StreakMultiplierPanel.jsx    ← Current mult + days to next tier
        ├── PenaltyLog.jsx              ← History of penalties received
        └── Leaderboard.module.css
```

---

## 🧮 Updated Zustand Store

### `auraStore.js`
```
totalAuraPoints       → number (all-time cumulative)
todayEarned           → number
todayLost             → number
todayNet              → todayEarned - todayLost
multiplier            → number (1.0 – 2.0)
streakDays            → number
penaltyLog[]          → [{ date, reason, amount }]
auraHistory[]         → [{ date, net, multiplier }]

computeTodayAura()    → applies bonuses + multiplier + penalties
applyPenalties()      → called at midnight or on app open after gap
```

---

## 🧭 Updated Sidebar Nav

```
ANTIGRAVITY ⚡
─────────────────
📊  Dashboard
─────────────────
DAILY CORE
🏋️  Workout
📚  Study
🥗  Nutrition
😴  Sleep
💆  Mood
─────────────────
HABITS
✅  Habits
🎯  Goals
─────────────────
SIDE HUSTLES
🎬  Content / Projects
─────────────────
AURA
🏆  Leaderboard       ← NEW
💜  Aura History      ← NEW
─────────────────
ANALYTICS
📅  Calendar
─────────────────
⚙️  Settings
```

---

## 📐 Updated Dashboard — Aura Section

```
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────┐  ┌────────────────┐  ┌────────────┐  │
│  │  TOTAL AURA POINTS │  │  TODAY'S AP    │  │ MULTIPLIER │  │
│  │  💜 142,870 AP     │  │  +847 / -0     │  │  🔥 1.3x   │  │
│  │  Rank: #1          │  │  NET: +847     │  │  Day 23    │  │
│  └────────────────────┘  └────────────────┘  └────────────┘  │
│                                                               │
│  ─── AURA HISTORY (Last 14 days bar chart) ─────────────── │
│  [Green bars = earned, Red bars = lost, net line overlay]    │
└──────────────────────────────────────────────────────────────┘
```

---

## 📐 Leaderboard Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  LEADERBOARD  [Private 🔒]  [Week ▾]                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│         🥇           🥈              🥉                        │
│    AURA FARMER   THE ALPHA &      SIGMA                       │
│                  THE OMEGA                                    │
│   [Your card]   [Empty slot]   [Empty slot]                   │
│   142,870 AP    — AP           — AP                          │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  #  │ User      │ Total AP   │ Today  │ Streak │ Multiplier  │
│─────┼───────────┼────────────┼────────┼────────┼────────────│
│  1  │ YOU 👑    │ 142,870    │ +847   │ 🔥 23d │  1.3x      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ── WEEKLY AURA SUMMARY ──────────────────────────────────  │
│  This week: 5,240 AP  |  Last week: 4,100 AP  |  +27.8% ↑  │
│                                                               │
│  ── STREAK MULTIPLIER PROGRESS ───────────────────────────  │
│  Day 23 → 1.3x  |  8 more days → 1.4x  |  Best: 1.5x       │
│                                                               │
│  ── PENALTY LOG ───────────────────────────────────────────  │
│  [None — clean record 🟢]                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔌 Updated Services

```
auraService.js
  getTotalAP()
  getAuraHistory(startDate, endDate)
  saveDayAura(date, earned, lost, multiplier)
  getPenaltyLog()
  getLeaderboard()              ← returns sorted list of users by AP
  getSelfRank()                 ← your position in leaderboard
```

---

## 🚀 Updated Build Phases

### Phase 1 — Frontend (Now)
- All previous + Leaderboard page with hardcoded self data
- AuraPointsDisplay, MultiplierBadge, TopThreePodium (self only)
- PenaltyAlert stub visible in UI

### Phase 2 — Local Persistence
- Full Aura engine wired: auraCalculator + penaltyEngine
- Multiplier tracked in Zustand + localStorage
- Penalty computed on app open if days were missed

### Phase 3 — Backend (FastAPI + Supabase)
- `aura_points` table: user_id, date, earned, lost, multiplier, net
- `leaderboard` view: GROUP BY user, SUM net AP
- Penalty job: FastAPI cron at midnight to compute inactive day penalties
- Multi-user ready: invite system + public toggle

### Phase 4 — Community Expansion
- Invite link generation
- Real-time leaderboard updates (Supabase Realtime)
- Push: "You're losing your #1 spot 👀"
- 7-day challenge system between users

---

*Built different. No excuses.*
