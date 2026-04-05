# SYSTEM: Antigravity Life OS — PRD & System Context

**Version:** 6.0 "Neural Sync Overhaul"
**Last Code Audit:** 2026-04-05 (commits: e3f0266 backup 05-04-2026, f531d9e backup 04-04-2026, a821392 v6.0 Overhaul)
**Focus:** High-Performance Habit Tracking, Gamification, and Physiological Analysis.
**Tech Stack:** React 19.2.4, Vite 8, Supabase JS 2.101, Zustand 5, Framer Motion 12, Three.js 0.183, Recharts 3, React Router 7, date-fns 4.

> [!NOTE]
> This document is a **code-accurate** ground truth for TestSprite AI analysis.
> Every value, formula, route, and table name is verified against the live source.
> Do NOT rely on version 5.2 values — they contain several inaccuracies.

---

## 1. Core Vision

SYSTEM is an offline-first PWA "Life OS" that tracks Habits, Fitness, Study, Nutrition, Mood, and Sleep through a gamified lens. It uses **Aura Points (AP)** and **Streak Multipliers** to drive high-intensity personal growth. Supabase provides auth + cloud sync; Zustand + localStorage provides offline-first state.

---

## 2. Routes & Navigation

All routes under `/` are protected — unauthenticated users redirect to `/auth`.

| Path | Component | Description |
|---|---|---|
| `/auth` | `AuthPage` | Login / Signup / OTP password reset |
| `/` (index) | `DashboardPage` | Main command center |
| `/command` | `CommandPage` | Command palette |
| `/habits` | `HabitsPage` | Hobbies/recreation log |
| `/workout` | `WorkoutPage` | Volume + cardio logging |
| `/study` | `StudyPage` | Study session logger |
| `/nutrition` | `NutritionPage` | Macros + 16 micros |
| `/sleep` | `SleepPage` | Sleep duration + deep sleep |
| `/mood` | `MoodPage` | Mood log (0–10 scale) |
| `/goals` | `GoalsPage` | Long-term goals tracker |
| `/sidehustles` | `ProjectsPage` | Side projects tracker |
| `/social` | `FriendsPage` | Friends list |
| `/duels` | `DuelPage` | Aura duels |
| `/leaderboard` | `LeaderboardPage` | Global AP rankings |
| `/history` | `AuraHistoryPage` | AP history log |
| `/calendar` | `CalendarPage` | Calendar view |
| `/shop` | `ShopPage` | Aura Marketplace |
| `/settings` | `SettingsPage` | User preferences / task manager |

---

## 3. Authentication & Onboarding Flow

### 3.1 Signup Flow (exact sequence)
1. User submits email + password (min 8 chars) on `/auth`.
2. `supabase.auth.signUp()` called.
3. `PlayerNamePrompt` modal shown (default name = `email.split('@')[0]` uppercased, max 24 chars).
4. On alias confirmation: `userService.upsertProfileOnSignUp(userId, playerName)` creates `profiles` row, then `seedServerFromLocal(userId)` migrates any existing localStorage data to Supabase.
5. Navigate to `/`.

### 3.2 Login Flow
1. `supabase.auth.signInWithPassword({ email, password })`.
2. On success: `pullAllData(userId)` hydrates all 11 Zustand stores from Supabase.
3. Navigate to `/`.

### 3.3 Password Recovery Flow (OTP)
1. User enters email → `supabase.auth.resetPasswordForEmail(email)` (OTP mode, no magic link).
2. User enters 6-digit OTP code + new password.
3. `supabase.auth.verifyOtp({ email, token, type: 'recovery' })` then `supabase.auth.updateUser({ password })`.

### 3.4 Auth State Management (`AuthProvider`)
- `supabase.auth.getSession()` on mount — restores session.
- `onAuthStateChange` listener handles `SIGNED_IN`, `SIGNED_UP`, `SIGNED_OUT`, `TOKEN_REFRESHED`.
- On `SIGNED_OUT`: clears `useAuraStore`, `useTaskStore`, `useScoreStore` state.
- **CypherID**: 10-character alphanumeric ID auto-generated on first login, stored in `antigravity-user-store`.

### 3.5 First-Login Migration
- `handleUserLogin` checks if `profiles` row exists for the user.
- If not found: create profile + `seedServerFromLocal(userId)` (pushes all localStorage data to Supabase).
- If found (returning user): `pullAllData(userId)`.

**Expected DB state after signup:**
```
profiles row: { id: uuid, username: playerName, total_aura_points: 0,
  current_streak: 0, max_streak: 0, multiplier: 1.0,
  accumulated_iq: 0, accumulated_knowledge: 0, rank_tier: 'Normie' }
```

---

## 4. Aura Points (AP) System

### 4.1 Daily Budget (verified from `auraPoints.js`)

| Bucket | Pool | Categories |
|---|---|---|
| **Daily Core** | 1,000 AP | WORKOUT 300, STUDY 300, NUTRITION 200, SLEEP 150, MOOD 50 |
| **Misc (Goals/Hobbies/Projects)** | 1,000 AP | Weighted by difficulty/type |
| **Max Earn/Day** | **2,000 AP** | Lifted by multiplier if multiplier > 1.0x |
| **Max Lose/Day** | **2,000 AP** | Hard cap on penalties |

### 4.2 Per-Category Daily Caps (from `auraPoints.js`)

```js
DAILY_CATEGORY_CAP: {
  WORKOUT:   300,
  STUDY:     300,
  NUTRITION: 200,
  SLEEP:     150,
  MOOD:       50,
}
// MISC cap = GOALS_POOL = 1000
```

When `multiplier > 1.0`, each cap scales proportionally: `scaledCap = Math.floor(baseCap * multiplier)`.

### 4.3 Misc Block — Goals & Hobbies Weights

```js
GOAL_WEIGHTS: {
  HARD:            0.4,   // hard goal: up to 400 AP of 1000 pool
  MEDIUM:          0.2,
  EASY:            0.1,
  HOBBY_PERMANENT: 0.15,
  HOBBY_TEMPORARY: 0.05,
}
```

Hobby LOG SESSION button: awards **150 MISC AP** via `addCategoryAP('MISC', 150, ...)`.

### 4.4 Legacy Bonuses (used in `computeAuraPointsLegacy` — called by `computeTodayAura`)

```js
BONUSES: {
  ALL_PERMANENT_DONE:    150,   // all permanent daily tasks done
  ALL_SUBCATEGORIES_LOGGED: 50,
  IM_HIM_TIER:           200,   // dailyScore >= 900
  PEAK_MOOD:             100,
  OVERPERFORM_TASK:       50,   // per overperformed task
}
```

### 4.5 Aura Calculator — Two Paths

**Path A — `computeAuraPoints()` (new, detailed):**
```
dailiesEarned = (workoutProgress + nutritionProgress + sleepProgress + studyProgress + moodProgress) * 200
goalsEarned = sum of GOALS_POOL * difficulty fraction for completed goals/hobbies
rawTotal = dailiesEarned + goalsEarned
withMult = round(rawTotal * multiplier)
effectiveCap = multiplier > 1.0 ? floor(2000 * multiplier) : 2000
earned = multiplier <= 0 ? withMult : min(withMult, effectiveCap)
```

**Path B — `computeAuraPointsLegacy()` (called by `auraStore.computeTodayAura`):**
```
earned = dailyScore (0–1000)
+ 150 if all permanent tasks done
+ 200 if dailyScore >= 900
+ 100 if peakMood
+ 50 * overperformedCount
then apply multiplier & daily cap in auraStore
```

### 4.6 `redeemPoints(amount, rewardName)`
- Succeeds only if `totalAuraPoints >= amount`.
- Deducts from `totalAuraPoints`, appends to `auraHistory`.
- Returns `true` (success) or `false` (insufficient balance).

---

## 5. Streak Multiplier System

### 5.1 Constants (from `multipliers.js`)

```js
BASE:  1.0
MAX_MULT:  5.0     // hard ceiling (NOT 4.0 — that was v5.2 era)
MIN_MULT: -5.0     // hard floor (negative multipliers are possible)
STEP:  0.1         // +0.1x per streak day starting from day 1
DUEL_WIN_BONUS: 0.5  // duel win adds +0.5x
```

### 5.2 Streak → Multiplier Formula
```
resolveMultiplier(streakDays) = clamp(1.0 + streakDays * 0.1, -5.0, 5.0)
```
Streak day 0 → 1.0x, day 1 → 1.1x, day 10 → 2.0x, day 40 → 5.0x (max).

### 5.3 Multiplier Penalties (from `multipliers.js`)
```
PENALTY_1_DAY:            -0.2   (1 inactive day)
PENALTY_2_DAYS:           -0.5   (2 inactive days)
PENALTY_3_PLUS_PER_DAY:   -1.0   per day (3–6 days inactive)
PENALTY_7_PLUS_FLOOR:     -1.0   floor value after 7+ days inactive
PENALTY_INCOMPLETE_DAILY: -0.1   per uncompleted required daily task
PENALTY_NO_CCA:           -0.2   for skipping hobbies/goals/content
```
Duel loss: multiplier **resets to 1.0** (`MULTIPLIERS.BASE`).

> **DB DISCREPANCY (BUG):** `prd_v2_migration.sql::enforce_multiplier_cap` trigger clamps
> multiplier to **1.0–4.0**. The frontend uses **-5.0–5.0**. The `multiplier_neural_migration.sql`
> expanded the column type but did NOT update the trigger. This means negative multipliers set
> by the frontend will be reset to 1.0 on the next Supabase upsert.

---

## 6. Ranking System

### 6.1 Leaderboard Position Ranks (from `ranks.js` + `leaderboardRanks.js`)

| Leaderboard Position | Title | Color |
|---|---|---|
| #1 | IM HIM | #00CFFF |
| #2 | ALPHA & OMEGA | #39FF14 |
| #3 | SIGMA | #FFE600 |
| #4+ | `#N` | #9E9E9E |
| Any user with 0 AP | BETA | #FF3131 |

The `rank_tier` column in `profiles` defaults to `'Normie'` (set on signup). Rank display is computed client-side from leaderboard position, NOT from `rank_tier` column.

### 6.2 Leaderboard Data Source
The frontend (`LeaderboardPage.jsx`) queries `profiles` table directly:
```js
supabase.from('profiles')
  .select('id, username, total_aura_points, current_streak, multiplier, rank_tier')
  .order('total_aura_points', { ascending: false })
  .limit(100)
```
The `leaderboard` VIEW exists in Supabase but is **not used** by the frontend leaderboard page.

---

## 7. AP Penalties (Inactivity)

### 7.1 AP Deductions (from `penalties.js` + `penaltyEngine.js`)

```
1 day inactive:      -1,000 AP
2 days inactive:     -2,200 AP  (INACTIVE_2_DAYS * 2)
3–6 days inactive:   -1,200 AP × gapDays
7+ days inactive:    -1,500 AP × gapDays
Per ignored permanent task: -200 AP × ignoredTasks × gapDays
```

All deductions capped at `MAX_DAILY_LOSE - todayLost` per application.

### 7.2 Midnight Penalty Function (DB Cron — runs daily at 00:00 UTC)
`compute_midnight_penalties()` checks `task_completions` for yesterday. If none:
- Counts consecutive inactive days (up to 7).
- escalation 1 → -1000, 2 → -1100, 3–6 → -(1200 + (n-3)*100), 7+ → -1500.
- Inserts/updates `aura_logs` row and reduces `profiles.total_aura_points` (floored at 0).
- Resets `current_streak = 0`, `multiplier = 1.0` only for 7+ day gap.

---

## 8. Offline Sync Engine

### 8.1 Architecture (`syncEngine.js`)
1. **Optimistic local update** — Zustand store updated immediately.
2. **`pushChange(table, op, payload)`** — if online: immediate Supabase `upsert`/`delete`; if offline: enqueue in `system-sync-queue`.
3. **`flushQueue()`** — processes queue with deduplication (last-write-wins per table+key). Called on mount and on `window.online` event.
4. **`pullAllData(userId)`** — fetches all 17 tables in `Promise.all()` and hydrates all stores. Called on login.
5. **`seedServerFromLocal(userId)`** — on first login, pushes existing localStorage → Supabase.
6. **`useCloudSync()` hook** — debounced (300ms) reactive sync: watches `totalAuraPoints`, `streakDays`, `multiplier`, `todayEarned`, `todayLost`, `todayScore`, `accumulatedIQ`, `accumulatedKnowledge`. Pushes `profiles` + `aura_logs` + `daily_scores` on change.

### 8.2 Conflict Resolution (table-level conflict keys)
```
profiles          → conflict: 'id'
aura_logs         → conflict: 'user_id,date'
daily_scores      → conflict: 'user_id,date'
tasks             → conflict: 'id'
task_completions  → conflict: 'task_id,date'
workout_logs      → conflict: 'user_id,date'
personal_bests    → conflict: 'user_id'
study_sessions    → conflict: 'user_id,date'
daily_metrics     → conflict: 'user_id,date'
macro_configs     → conflict: 'user_id'
goals             → conflict: 'user_id,id'
projects          → conflict: 'user_id,id'
project_sessions  → conflict: 'user_id,id'
hobbies           → conflict: 'user_id,id'
friends           → conflict: 'user_id,friend_id'
duels             → conflict: 'id'
```

### 8.3 localStorage Persistence Keys
```
antigravity-aura-store      (useAuraStore)
antigravity-task-store      (useTaskStore)
antigravity-score-store     (useScoreStore)
antigravity-user-store      (useUserStore)
antigravity-workout-engine  (useWorkoutStore, version: 2)
antigravity-study-store     (useStudyStore)
antigravity-metrics-engine  (useMetricsStore, version: 1)
antigravity-goal-store      (useGoalStore)
antigravity-project-store   (useProjectStore)
antigravity-hobby-store     (useHobbyStore)
antigravity-social-store    (useSocialStore)
system-sync-queue           (useSyncQueue — offline mutation queue)
```

### 8.4 Mock Data (local dev only)
`injectMockData()` in `utils/mockSeed.js` runs at startup if:
- `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is not set **AND**
- `localStorage.getItem('antigravity-aura-store')` is `null`.

Injects 14 days of simulated AP history starting at 50,000 AP base.

---

## 9. Database Schema (Supabase / PostgreSQL)

### 9.1 Core Tables

**`profiles`** (PK: `id` UUID → `auth.users`)
```
id UUID, username TEXT UNIQUE, total_aura_points INTEGER DEFAULT 0,
current_streak INTEGER DEFAULT 0, max_streak INTEGER DEFAULT 0,
multiplier NUMERIC(3,1) DEFAULT 1.0,
accumulated_iq NUMERIC(8,2) DEFAULT 0,
accumulated_knowledge NUMERIC(8,2) DEFAULT 0,
last_login_date DATE, rank_tier TEXT DEFAULT 'Normie',
preferences JSONB DEFAULT '{}',
weekly_workout_progress NUMERIC DEFAULT 0,
created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

**`aura_logs`** (UNIQUE: `user_id, date`)
```
id UUID, user_id UUID→profiles, date DATE,
earned INTEGER DEFAULT 0, lost INTEGER DEFAULT 0,
net INTEGER GENERATED ALWAYS AS (earned - lost) STORED,
multiplier NUMERIC(3,1), reason TEXT,
created_at, updated_at
```
DB trigger `trg_ap_cap` clamps `earned` and `lost` to max 2000.

**`daily_scores`** (UNIQUE: `user_id, date`)
```
id UUID, user_id UUID→profiles, date DATE, score INTEGER DEFAULT 0
```

**`tasks`**
```
id UUID, user_id UUID→profiles, title TEXT, type TEXT DEFAULT 'PERMANENT_DAILY',
base_weight INTEGER DEFAULT 100, method TEXT DEFAULT 'checkbox',
target INTEGER, subcategory TEXT
```
Task types: `PERMANENT_DAILY`, `SIDE_HUSTLE`, `MONTHLY`, `TEMPORARY`, `SINGLE_DAY`.

**`task_completions`** (UNIQUE: `task_id, date`)
```
id UUID, user_id UUID→profiles, task_id UUID→tasks,
date DATE, value NUMERIC
```

**`workout_logs`** (UNIQUE: `user_id, date`)
```
id UUID, user_id UUID→profiles, date DATE,
cardio JSONB DEFAULT '{}', volume JSONB DEFAULT '{}'
```

**`personal_bests`** (PK: `user_id`)
```
user_id UUID→profiles, data JSONB DEFAULT '{}'
```

**`study_subjects`** (PK: `user_id, id`)
```
id UUID, user_id UUID→profiles, name TEXT, color TEXT
```

**`study_sessions`** (UNIQUE: `user_id, date`)
```
id UUID, user_id UUID→profiles, date DATE, data JSONB DEFAULT '{}'
```

**`daily_metrics`** (UNIQUE: `user_id, date`)
```
id UUID, user_id UUID→profiles, date DATE,
sleep NUMERIC, deep_sleep NUMERIC, mood INTEGER,
macros JSONB DEFAULT '{}', micros JSONB DEFAULT '{}'
```

**`macro_configs`** (PK: `user_id`)
```
user_id UUID→profiles, macros JSONB DEFAULT '[]'
```

**`goals`** (PK: `user_id, id`)
```
id UUID, user_id UUID→profiles, title TEXT, target_date DATE,
completed BOOLEAN DEFAULT false, bounty_ap INTEGER DEFAULT 1000,
archived BOOLEAN DEFAULT false, completed_at TIMESTAMPTZ,
difficulty TEXT CHECK ('easy','medium','hard') DEFAULT 'medium'
```

**`projects`** (PK: `user_id, id`)
```
id UUID, user_id UUID→profiles, title TEXT, type TEXT DEFAULT 'CS',
status TEXT DEFAULT 'UPCOMING', color TEXT, total_hours NUMERIC DEFAULT 0,
archived BOOLEAN DEFAULT false
```

**`project_sessions`** (PK: `user_id, id`)
```
id UUID, user_id UUID→profiles, project_id UUID,
date DATE, hours NUMERIC DEFAULT 0, efficiency INTEGER
```

**`hobbies`** (PK: `user_id, id`)
```
id UUID, user_id UUID→profiles, name TEXT, data JSONB DEFAULT '{}',
archived BOOLEAN DEFAULT false,
hobby_type TEXT CHECK ('permanent','temporary') DEFAULT 'temporary'
```

**`friends`** (UNIQUE: `user_id, friend_id`)
```
id UUID, user_id UUID→profiles, friend_id UUID→profiles,
status TEXT DEFAULT 'pending'
```

**`duels`**
```
id UUID, challenger_id UUID→profiles, opponent_id UUID→profiles,
state TEXT DEFAULT 'pending',
stake_ap INTEGER DEFAULT 500, winner_id UUID→profiles,
start_date TIMESTAMPTZ, end_date TIMESTAMPTZ
```

### 9.2 Views
**`leaderboard`** (security_invoker = true)
```sql
SELECT p.id, p.username, p.total_aura_points, p.current_streak,
       p.max_streak, p.multiplier, p.accumulated_iq,
       p.accumulated_knowledge, p.rank_tier,
       COALESCE(today.score, 0) AS today_score,
       ROW_NUMBER() OVER (ORDER BY p.total_aura_points DESC) AS rank
FROM profiles p
LEFT JOIN daily_scores today ON today.user_id = p.id AND today.date = CURRENT_DATE
```

### 9.3 RLS Policies
- `profiles`: own row SELECT/INSERT/UPDATE + unrestricted SELECT (`leaderboard_select` policy for global leaderboard reads).
- Per-user tables: `auth.uid() = user_id`.
- `daily_scores`: own rows + unrestricted SELECT (`daily_scores_leaderboard_select`).
- `personal_bests` / `macro_configs`: `auth.uid() = user_id`.
- `friends`: `auth.uid() = user_id OR auth.uid() = friend_id`.
- `duels`: `auth.uid() = challenger_id OR auth.uid() = opponent_id`.

### 9.4 Cron Jobs (pg_cron)
```
midnight-penalties     → daily 00:00 UTC  → compute_midnight_penalties()
weekly-workout-reset   → Sunday 00:00 UTC → reset_weekly_progress()
```

### 9.5 RPC Functions
- `calculate_vo2max(p_bpm, p_dist_km, p_time_min, p_age)` → JSONB `{rawVO2, score}`
  - Formula: `raw = (dist/time) * 21.4 - 0.065 * bpm + age_factor + 10`
  - Clamped 20–80, normalized 0–100.

> **FORMULA DISCREPANCY (BUG):** Frontend `calculateVO2Max()` uses:
> `rawVO2 = (distKm / timeMins) * 16.6 + ((220 - age) - bpm) * 0.62 + 15.5`
> Backend RPC uses: `rawVO2 = (dist/time) * 21.4 - 0.065 * bpm + age_factor + 10`
> These produce DIFFERENT scores for identical inputs. Frontend formula is the one users see.

---

## 10. Physiological Tracking Details

### 10.1 Workout Engine (`workoutStore.js`, version 2)
- **Volume logging**: Sets × Reps × Weight per muscle sub-group.
- **1RM (Personal Best)**: Epley formula → `weight * (1 + reps / 30)`.
- **Cardio**: LSS (minutes + BPM), VO2Max test (BPM + distKm + timeMins + age).
- **Muscle groups**: chest, shoulders, biceps, triceps, back, core, legs, calves, forearms, mobility.
- **lastLoggedValues** persisted across sessions.
- Store migration (version 2): removed 'Pec Minor' from chest sub-groups.

### 10.2 Study Pulse (`studyStore.js`)
- Sessions logged per subject per date (minutes).
- Full STUDY AP (300) = `studyProgress = minutes / 120` → 1.0 at 120 minutes (2 hours).
- **IQ Gain Rates** (per hour):
  - HIGH tier (math, physics, aptitude, competitive programming): **1.0 IQ/hr**
  - MEDIUM tier (CS, ML, AI, engineering, chemistry): **0.5 IQ/hr**
  - LOW tier (GK, history, biology, language): **0.1 IQ/hr**
- **Knowledge Gain**: **2.0 points/hr** for any subject.
- Neural Pentagram caps: IQ_MAX = 100, KNOWLEDGE_MAX = 200.

### 10.3 Nutrition Hub (`metricsStore.js`)
**Default Macros (4):**
```
Protein 180g, Carbs 250g, Fats 70g, Calories 2500kcal
```
**Default Micros (19):**
```
VitD3 2000IU, VitB12 2.4mcg, VitC 90mg, VitE 15mg, VitK2 120mcg,
Calcium 1000mg, Magnesium 400mg, Potassium 3500mg, Sodium 2300mg,
Zinc 11mg, Iron 8mg, Iodine 150mcg, Copper 0.9mg,
Omega-3 1.6g, Fiber 30g, Water 3000ml,
Biotin 30mcg, Omega-3 EPA+DHA 1000mg, Creatine 5g
```
Full NUTRITION AP (200) = all macros + all micros at or above baseline.
One-click baseline log: `metricsService.logBaselineToday(userId, today)` (signed-in) or `logBaselineToday()` (local) — updates store AND pushes `micros` to Supabase immediately so background `pullAllData` cannot reset them.

### 10.4 Sleep
- Logged fields: `sleep` (hours, numeric), `deepSleep` (fraction/percentage, numeric).
- Full SLEEP AP (150) = ≥8h sleep + deep sleep ≥ 9/10 (from PRD).

### 10.5 Mood
- Scale: 0–10 integer.
- MOOD AP progress: `moodProgress = min(1, moodValue / 5)` → full 50 AP at mood ≥ 5.

---

## 11. Aura Marketplace (Shop)

**Actual reward catalog from `ShopPage.jsx`:**

| Reward | AP Cost | Real Value |
|---|---|---|
| Amazon Gift Card | 100,000 AP | $10.00 |
| Netflix Sub (1 Month) | 150,000 AP | $15.00 |
| Spotify Premium | 100,000 AP | $10.00 |
| GPay Direct Cashout | 50,000 AP | $5.00 |

Exchange rate: **1,000 AP = $0.10 USD**.

> **CORRECTION from v5.2 PRD:** There is NO "Elite Card Frame for 500 AP".
> All redemptions use `redeemPoints(cost, name)` from `useAuraStore`.

**Redemption logic:**
- If `totalAuraPoints >= cost`: deduct, add to history, return `true`.
- If `totalAuraPoints < cost`: show `alert('INSUFFICIENT AURA POINTS')`, return `false`.

---

## 12. Social & Duels

### 12.1 Duel System
- `initiateDuel(opponentId, opponentName, stake = 500)` → state: `'active'`
- `resolveDuel(duelId, winnerId, currentUserId)`:
  - Winner: `applyDuelWinBonus()` → `multiplier += 0.5`
  - Loser: `applyDuelLossReset()` → `multiplier = 1.0`
- Duels stored in Supabase `duels` table with `challenger_id` + `opponent_id`.
- RLS: users can only see duels where they are challenger or opponent.

---

## 13. Score Calculation

### 13.1 Daily Score (`scoreCalculator.js`)
```
computeDailyScore(tasks, defaultWeights):
  For each task:
    - checkbox method: completionRate = completed ? 1 : 0
    - numeric method:  completionRate = min(progress / target, 1)
    - score += (task.weight || defaultWeights[task.type] || 100) * completionRate
  return floor(min(score, 1000))
```

### 13.2 Default Weights (`scoreWeights.js`)
```js
DEFAULT_WEIGHTS = { WORKOUT: 300, STUDY: 300, NUTRITION: 200, SLEEP: 150, MOOD: 50 }
```

---

## 14. Dynamic Greeting Engine (`greetingEngine.js`)

| Time | Example Greeting |
|---|---|
| 00:00–04:59 | "Night owl mode, {name}. Respect the grind." |
| 05:00–06:59 | "Early riser, {name}. Discipline is freedom." |
| 07:00–08:59 | "Good morning, {name}. Time to execute." |
| 09:00–11:59 | "Peak focus window, {name}. Make it count." |
| 12:00–13:59 | "Afternoon, {name}. Stay locked in." |
| 14:00–16:59 | "Afternoon push, {name}. No coasting." |
| 17:00–19:59 | "Good evening, {name}. Log the wins." |
| 20:00–21:59 | "Late session, {name}. Still in beast mode." |
| 22:00–23:59 | "Still grinding, {name}. Rest is earned." |

New user (zero AP, zero history, zero streak): "Welcome, {name}. Let's build something legendary."

---

## 15. Testable Scenarios for TestSprite

### A. Authentication & Onboarding

**A1. Signup → Player Name → Dashboard**
- Action: POST `/auth/v1/signup` with valid email + password (min 8 chars).
- Expected UI flow: PlayerNamePrompt appears.
- After name confirmed: navigate to `/`.
- DB check: `profiles` row created with `total_aura_points = 0`, `multiplier = 1.0`, `current_streak = 0`.
- localStorage: `antigravity-user-store` contains `cypherId` (10-char alphanumeric).

**A2. Login → Data Hydration**
- Action: POST sign-in with existing credentials.
- Expected: `pullAllData()` called → all stores hydrated from Supabase.
- Navigate to `/`.

**A3. Login with Invalid Credentials**
- Expected: Supabase returns `authErr`; error message rendered inside `styles.error` div.
- No navigation occurs.

**A4. Password Reset (OTP)**
- Step 1: Submit email → OTP sent (step state = `'otp'`).
- Step 2: Submit valid 6-digit OTP + new password → `step = 'done'`.
- Step 3: "Password updated" message shown + "Back to Login" button.
- Invalid OTP: error "Invalid or expired code. Try again."

**A5. Logout**
- Expected: `clearUser()` called; `useAuraStore`, `useTaskStore`, `useScoreStore` reset to initial state.
- Redirect to `/auth`.

---

### B. Aura Points & AP Sync

**B1. Task Completion → AP Increment**
- Action: Click "MARK DONE" on a task in Dashboard Daily Loop.
- Expected: `taskService.setCompletion()` or `toggleCompletion()` called.
- `aura_logs` UPSERT pushed via `pushChange` (online) or queued (offline).
- Dashboard AP counter reflects updated `totalAuraPoints`.
- `useCloudSync` debounces and pushes `profiles` within 300ms.

**B2. AP Earn Cap Enforcement**
- Action: Attempt to earn > 2000 AP in one day (standard multiplier = 1.0).
- Expected: `todayEarned` capped at 2000; `actual = min(amount, remaining) = 0`.
- DB trigger `trg_ap_cap` clamps `aura_logs.earned` to 2000 even if frontend bug occurs.

**B3. AP With Active Multiplier > 1.0**
- Given: `multiplier = 2.0`, `streakDays = 10`.
- Max daily earn = `floor(2000 * 2.0) = 4000 AP`.
- Per-category WORKOUT cap = `floor(300 * 2.0) = 600 AP`.
- DB cap trigger still enforces 2000 — **frontend can earn 4000, DB enforces 2000**.

**B4. Negative Multiplier Scenario**
- Given: 7+ days inactive → `multiplier = -1.0`.
- Action: Log any activity.
- Expected: `addCategoryAP` computes `effectiveAmount = amount * -1.0` → loss, not gain.
- `totalAuraPoints` decreases; entry added to `auraHistory` with negative net.
- DB trigger still prevents this on next upsert (clamps to 1.0) → TEST this discrepancy.

**B5. Daily Reset**
- On Dashboard mount: `resetDailyIfNeeded()` checks `lastLoginDate` vs today.
- If different: `todayEarned = 0`, `todayLost = 0`, `todayNet = 0`.

---

### C. Streak & Multiplier

**C1. Streak Increment**
- Action: Log activity on consecutive days.
- `checkAndUpdateStreak()`: if `lastStreakDate === yesterday` → `streakDays++`, `multiplier = resolveMultiplier(newStreak)`.
- Expected at 10-day streak: `multiplier = clamp(1.0 + 10 * 0.1, -5, 5) = 2.0`.

**C2. Streak Break**
- Action: Skip a day (gap in `lastStreakDate`).
- Expected: `streakDays = 1`, `multiplier = 1.0` (MULTIPLIERS.BASE).

**C3. Duel Win Multiplier Boost**
- Action: `resolveDuel(id, currentUserId, currentUserId)` (winner = self).
- Expected: `multiplier = clamp(multiplier + 0.5, -5, 5)`.

**C4. Duel Loss Multiplier Reset**
- Action: `resolveDuel(id, opponentId, currentUserId)` (winner = opponent).
- Expected: `multiplier = 1.0`.

---

### D. Ranking & Leaderboard

**D1. Leaderboard Position Rank Labels**
- Position 1, AP > 0 → "IM HIM" (#00CFFF).
- Position 2, AP > 0 → "ALPHA & OMEGA" (#39FF14).
- Position 3, AP > 0 → "SIGMA" (#FFE600).
- Position 4+, AP > 0 → "#4" (#9E9E9E).
- Any position, AP = 0 → "BETA" (#FF3131).

**D2. Leaderboard Data Query**
- Source: `profiles` table (NOT the `leaderboard` view).
- Ordered by `total_aura_points DESC`, limit 100.
- `(YOU)` tag shown next to the authenticated user's row.

**D3. Self-Rank Determination**
- `selfRank = leaders.findIndex(r => r.id === user.id) + 1`.
- If user not found in top 100: `selfRank = null`.

---

### E. Shop Transactions

**E1. Successful Redemption**
- Given: `totalAuraPoints >= 50000`.
- Action: Click REDEEM on "GPay Direct Cashout" (50,000 AP).
- Expected: `redeemPoints(50000, 'GPAY DIRECT CASHOUT')` returns `true`.
- `totalAuraPoints` decreases by 50,000.
- `auraHistory` gets entry `{ net: -50000, reason: 'Redeemed: GPAY DIRECT CASHOUT' }`.
- `alert('SUCCESS: GPAY DIRECT CASHOUT REDEEMED...')` shown.

**E2. Failed Redemption (Insufficient AP)**
- Given: `totalAuraPoints < 50000`.
- Action: Click REDEEM on "GPay Direct Cashout".
- Expected: REDEEM button is `disabled` (via `disabled={totalAuraPoints < reward.cost}`).
- `alert('INSUFFICIENT AURA POINTS. CONTINUE GRINDING.')` shown if forced.
- `totalAuraPoints` unchanged.

**E3. Amazon Gift Card (100,000 AP)**
- Requires exactly 100,000+ AP to unlock button.

**E4. Netflix Sub (150,000 AP)**
- Highest cost item. Requires 150,000+ AP.

---

### F. Offline Sync

**F1. Offline Task Completion**
- Given: `navigator.onLine = false`.
- Action: Complete a task.
- Expected: Change enqueued in `system-sync-queue` (localStorage).
- On reconnect (`window.online` event): `flushQueue()` runs, deduplicates, upserts to Supabase.

**F2. Queue Deduplication**
- If same `(table, id)` queued multiple times: only the last entry is flushed.
- Ensures no duplicate upserts on noisy offline toggling.

**F3. Offline → Online Hydration**
- On `AuthProvider` mount with existing session: `flushQueue()` called.
- After flush: local state matches Supabase.

---

### G. Workout Engine

**G1. Volume Log + Personal Best**
- Action: Log set: `chest > Upper Chest > sets=3, reps=10, weight=80kg`.
- Expected: Entry appended to `logs[date][chest][Upper Chest]`.
- 1RM computed: `80 * (1 + 10/30) = 80 * 1.333 = 106.7`.
- If `106.7 > personalBests[chest][Upper Chest]`: PB updated; `_lastPbAchieved` set.

**G2. VO2 Max (Frontend Formula)**
- Input: `bpm=160, distKm=3.5, timeMins=10, age=22`.
- Formula: `hrReserve = (220 - 22) - 160 = 38`; `rawVO2 = (3.5/10)*16.6 + 38*0.62 + 15.5 = 5.81 + 23.56 + 15.5 = 44.87`.
- Clamped to 44.87, score = `round((44.87-20)/60 * 100) = round(41.4) = 41`.

---

### H. Study & Neural Stats

**H1. IQ Gain from Mathematics Session**
- Subject: "Mathematics" (HIGH tier, 1.0 IQ/hr).
- 60 minutes → `computeIQGain('Mathematics', 60) = 60/60 * 1.0 = 1.0 IQ`.

**H2. Knowledge Gain**
- Any subject, 60 minutes → `computeKnowledgeGain(60) = 60/60 * 2.0 = 2.0 knowledge`.

**H3. Study AP**
- 120 minutes total → `studyProgress = 120/120 = 1.0` → full 300 STUDY AP.
- 60 minutes → `studyProgress = 0.5` → 150 STUDY AP (via `addCategoryAP`).

---

### I. Midnight Cron Penalty (Backend)

**I1. 1-Day Gap**
- User has no `task_completions` for yesterday.
- `compute_midnight_penalties()` runs: escalation = 1 → penalty = -1000.
- `aura_logs` UPSERT: `lost += 1000`.
- `profiles.total_aura_points` reduced by 1000 (GREATEST 0).

**I2. 7+ Day Gap**
- escalation >= 7 → penalty = -1500.
- Additionally: `current_streak = 0`, `multiplier = 1.0` reset.

**I3. No Penalty When Active**
- User has ≥1 `task_completions` row for yesterday → `gap_days > 0` check fails → no action.

---

### J. Nutrition

**J1. Full Nutrition AP (200 AP)**
- All 4 macros and all 19 micros logged at or above `minLimit`.
- `nutritionProgress = 1.0` → 200 NUTRITION AP.

**J2. One-Click Baseline Log**
- `logBaselineToday()` sets every macro and micro to their `minLimit` values for today.
- Expected: All entries in `dailyMetrics[today].macros` and `.micros` equal their baselines.

---

## 16. Security & Data Isolation

- **RLS enforced**: Every table requires `auth.uid() = user_id` (or `id` for profiles).
- **Exception**: `profiles` and `daily_scores` have unrestricted SELECT for leaderboard reads.
- **Duels**: both challenger and opponent can read/write the duel row.
- **Friends**: both parties can see the friendship row.
- **`leaderboard` view**: `security_invoker = true` — runs as the calling user, not superuser.
- **`compute_midnight_penalties()`**: `SECURITY DEFINER` intentionally — cron needs to update all users' rows.
- **`update_updated_at()`**: `SET search_path = ''` to prevent schema injection.
- **`calculate_vo2max()`**: `SECURITY DEFINER`, `SET search_path = ''`.
- **Data sharing**: no user data shared unless user is in an active duel (challenger/opponent).

---

## 17. Performance Targets

- **Dashboard render**: < 250ms (Core Web Vitals target).
- **Sync debounce**: 300ms after last change before Supabase push.
- **`pullAllData`**: single `Promise.all()` with 17 parallel queries.
- **Queue deduplication**: last-write-wins prevents N+1 upserts after reconnect.
- **Workout store migration**: version 2, migrates on load (removes 'Pec Minor' from chest).
- **Metrics store migration**: version 1, migrates on load — appends any `DEFAULT_MICROS` entries missing from the user's persisted `customMicros` (preserves existing custom limits).

---

## 18. Known Bugs / Discrepancies to Test

| ID | Location | Issue |
|---|---|---|
| BUG-1 | `prd_v2_migration.sql` | `enforce_multiplier_cap` DB trigger clamps multiplier to 1.0–4.0, but frontend uses -5.0–5.0 range. Negative multipliers set by frontend are silently reset to 1.0 on next upsert. |
| BUG-2 | VO2 Max | Frontend formula (`16.6, 0.62, 15.5`) and backend RPC formula (`21.4, 0.065`) produce different scores for same inputs. Frontend value is what users see. |
| BUG-3 | `auraStore.computeTodayAura` | Uses legacy `computeAuraPointsLegacy()` (score + bonuses), while `HabitsPage` uses new `addCategoryAP()`. Two separate paths compute AP independently. |
| BUG-4 | `LeaderboardPage` | Queries `profiles` table directly, ignoring the `leaderboard` VIEW with pre-computed rank. Rank label is computed client-side from array index. |
| BUG-5 | Mock data (`mockSeed.js`) | Uses old cap of `min(4.0, ...)` for multiplier — does not reflect new 5.0 ceiling. |
| ~~BUG-6~~ | ~~`NutritionPage` micros reset~~ | **FIXED 2026-04-05** — `pullAllData` now preserves local micros when server row has none; `handleBaselineLog` now pushes micros to Supabase immediately via `metricsService.logBaselineToday`. |
| ~~BUG-7~~ | ~~`handleLogItem` micros branch~~ | **FIXED 2026-04-05** — Was calling `metricsService.logMacroValue` for micro rows. Now correctly calls `metricsService.logMicroValue`. |
| ~~BUG-8~~ | ~~`metricsStore` Zustand persist~~ | **FIXED 2026-04-05** — `customMicros` was frozen to whatever was in localStorage at first run. New micros added to `DEFAULT_MICROS` never appeared. Fixed with `version: 1` + `migrate()` that appends missing micros to existing stored array on first load after upgrade. |
| ~~BUG-9~~ | ~~`Nutrition.module.css` overflow~~ | **FIXED 2026-04-05** — `.container` had `overflow: hidden` which clipped the micros grid to the initial viewport height (showing only ~10 cards). Fixed with `overflow-x: hidden` (horizontal only). |
