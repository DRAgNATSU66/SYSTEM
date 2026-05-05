# SYSTEM OS — Master Audit & Execution Plan
**Last updated:** 2026-05-04 | **Status:** Phase 1 ✅ Phase 2 ✅ Phase 3 ✅ Phase 4 ✅ Phase 5 ✅ Phase 6 future

---

## Master Checklist — All Phases

### Phase 1 — Critical Security ✅ COMPLETE
- [x] Remove HMR preamble from `index.html`
- [x] Guard `supabaseClient.js` against `undefined` args (null export)
- [x] Replace `Math.random()` with `crypto.getRandomValues()` in `userStore.js`
- [x] Add `import.meta.env.DEV` guard to mock data injection in `main.jsx`
- [x] Create `security_patch_3.sql` — fix double penalty, add 7 indexes, SECURITY INVOKER on vo2max
- [x] Restrict `daily_scores` leaderboard policy to `date = CURRENT_DATE` only
- [x] Fix `localStorage.clear()` in Settings to preserve `sb-*` auth keys
- [x] Clear `useSocialStore`, `useCommandStore`, `useSyncQueue` on `SIGNED_OUT`
- [x] Add auth guard to `seedServerFromLocal` (verify userId matches session)
- [x] Verify `.env` never committed to git history — repo was private at time of commit, no rotation needed

### Phase 2 — High Severity ✅ COMPLETE
- [x] Sanitize auth error messages with `safeAuthError()` mapping
- [x] Wire `offlineMode` / `cloudSync` toggles into `pushChange()` and `flushQueue()`
- [x] Switch `pullAllData` from `Promise.all` to `Promise.allSettled`
- [x] Validate `payload.user_id` in `flushQueue` against current session
- [x] Add null guard for `supabase` in `pushChange` and `flushQueue`
- [x] Add password complexity hint on signup (min 1 uppercase, 1 number)
- [x] Add `maxLength` to all form inputs (Settings, Habits, Nutrition, Study, Mood, Tasks)
- [x] Cap `auraHistory` array at 180 entries across all push sites in `auraStore`
- [x] Replace all `Date.now()` IDs with `crypto.randomUUID()` — goals, projects, hobbies, duels, commands

### Phase 3 — Broken Feature Rewrites ✅ COMPLETE
- [x] Add `cypher_id` column + index to `profiles` table (security_patch_3.sql)
- [x] Add `last_seen_at` column to `profiles` (security_patch_3.sql) + updated in pullAllData on every call
- [x] Add `ai_usage` table in Supabase (security_patch_3.sql)
- [x] Rebuild `FriendsPage` — real Cipher ID lookup, online presence, mutual accept/reject
- [x] Friend request incoming section in FriendsPage (Settings notifications deferred to Phase 5)
- [x] Rebuild `DuelPage` — direct 1v1 challenge, incoming accept/reject, real AP progress bars
- [x] Duel AP escrow — client triggers state change; server-side RPC deferred (escrow note in UI)
- [x] Server-side duel resolution — `resolve_duel` deferred; `get_top5_profile` RPC added (phase3_features.sql)
- [x] Duel challenge notification UI — accept ✅ / reject ❌ in DuelPage incoming section
- [x] Shop — fake alerts removed; "COMING SOON" inline message
- [x] HF Spaces — `backend/hf_agent/` created: app.py, Dockerfile, requirements.txt, README.md
- [x] HF Spaces — store secrets: manual step (OPENROUTER_API_KEY + SUPABASE_SERVICE_ROLE_KEY in HF Space settings)
- [x] AI Agent — `app.py` FastAPI proxy complete (streaming SSE, rate limiting, CSP endpoint); Command Center UI deferred to Phase 5
- [x] Workout — LOG ALL uses `lastLoggedValues`; confirms defaults when history missing
- [x] Hobby sessions — START/STOP timer per card, AP formula, sessions stored to `hobby_sessions` + shown on card
- [x] Mobility — dual-mode MobilityCard: duration (seconds → AP) + DONE tick (5 AP flat)
- [x] Leaderboard — top-5 profile viewer modal with `get_top5_profile` RPC
- [x] Leaderboard — 90-day streak: `update_leaderboard_streaks()` function added (phase3_features.sql)

### Phase 4 — Medium Severity ✅ COMPLETE
- [x] Avatar upload — client-side MIME type check (JPG/PNG/WEBP only)
- [x] Service worker — tighter cache (1s timeout, 5-min TTL on Supabase reads)
- [x] CSP `report-uri` directive added to `vercel.json` (→ HF Spaces /csp-report)
- [x] `autocomplete` attributes on auth form inputs (done in Phase 2)

### Phase 5 — Architecture & New Features ✅ COMPLETE
- [x] `aura_history_detail` — per-entry push via syncEngine subscriber; pullAllData fetches + replaces auraHistory; all days expandable in AuraHistoryPage
- [x] Delete dead `LoginPage.jsx`
- [x] Remove unused `Placeholder` component from `routes.jsx`
- [x] Root `<ErrorBoundary>` added in `main.jsx`
- [x] Sync loading indicator — `syncing` state in userStore; "SYNCING..." shown in Header; set true/false around pullAllData
- [x] Workout split — user-configurable 7-day schedule in Settings; WorkoutPage reads from preferences
- [x] Goals — overdue detection (red badge), one-time AP penalty (10% of bounty, max 500), RETRY button with decaying bounty (÷2, min 50 AP) + date picker
- [x] Goals — `retry_count` + `overdue_penalty_applied` columns added (security_patch_3.sql)
- [x] Nutrition — auto-save baseline on each successful log (`setMacroLimit`/`setMicroLimit`)
- [x] Study — LOG 60M → manual minutes input (done in Phase 3)
- [x] Command terminal — `complete` matches real task titles; `reward` shows real AP + milestones; timer AP formula fixed
- [x] Leaderboard 90-day bonus — deferred to Phase 6 (requires Shop backend)

---

## ⚠ MANUAL STEPS REMAINING (do before deployment)

### 1 — Run SQL migrations in Supabase SQL Editor (in order)
```
1. security_patch_3.sql  (run this FIRST — adds columns/tables Phase 3+ depends on)
2. phase3_features.sql   (duel columns, matchmaking_queue, get_top5_profile RPC, leaderboard streak fn)
```

### 2 — HF Space secrets setup (step-by-step)
1. Go to https://huggingface.co/spaces → New Space → name: `system-agent`, SDK: **Docker**
2. Space Settings → **Variables and secrets** → Add secret:
   - `OPENROUTER_API_KEY` = your OpenRouter API key (from openrouter.ai)
   - `SUPABASE_URL` = your Supabase project URL (e.g. `https://xxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase **service-role** key (NOT the anon key — from Dashboard → Settings → API)
3. Push `backend/hf_agent/` contents to the Space repo (clone URL shown in Space page)
4. Space auto-builds and deploys — test at `https://DRAgNATSU66-system-agent.hf.space/health`

### Phase 6 — Final / Future
- [ ] Sleep — Google Fit / Samsung Health auto-sync via Capacitor plugin
- [ ] Command center ai chatbot build using AI Agent — Command Terminal (HF Spaces Backend + OpenRouter)(more details given in #M4 in this md file)
- [ ] Shop — real redemption backend (after company tie-ups + funding)
- [ ] Capacitor mobile build — iOS + Android
- [ ] Push notifications via Capacitor (built on top of Phase 3 notifications table)

---
---

# Phase 1 — Critical Security

## C1: React HMR Preamble in `index.html`
**File:** `frontend/index.html` lines 18–24

The `<script>` block that imports `/@react-refresh` is hardcoded in `index.html`. In production, this file doesn't exist → 404 on every page load. Vite injects this block automatically in dev; it must not be in the file.

**Fix:** Remove the entire `<script type="module">` block containing `RefreshRuntime`.

---

## C2: `supabaseClient.js` crashes app on missing env vars
**File:** `frontend/src/services/supabaseClient.js` line 10

`createClient(undefined, undefined)` throws and crashes every file that imports `supabase`. If Vercel env vars are missing or misconfigured, the entire app white-screens.

**Fix:**
```js
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;
```
Also add `if (!supabase) return;` guards in `pushChange` and `flushQueue` in `syncEngine.js`.

---

## C3: `Math.random()` for Cypher ID — not cryptographically secure
**File:** `frontend/src/store/userStore.js` lines 6–13

**Fix:**
```js
const generateCypherId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
};
```

---

## C4: `compute_midnight_penalties()` applies AP penalty twice
**File:** `backend/supabase/init.sql` + `security_patch.sql`

The function has a conditional UPDATE for `escalation >= 7` AND a second unconditional UPDATE to `total_aura_points`. Users with 7+ day gaps get double-penalised. Fixed in `security_patch_3.sql`.

---

## C5: Missing DB indexes — full table scans under load
**File:** `backend/supabase/init.sql`

The midnight cron runs `O(users × 7)` sequential scans with no indexes. Added in `security_patch_3.sql`:
- `friends(friend_id)`
- `duels(challenger_id)`, `duels(opponent_id)`, `duels(state)`
- `study_subjects(user_id)`
- `aura_logs(date)`
- `task_completions(task_id)`

---

## C6: `calculate_vo2max()` is `SECURITY DEFINER` — runs as postgres superuser
**File:** `backend/supabase/prd_v2_migration.sql`

Pure math function with no DB writes has no need for superuser. Changed to `SECURITY INVOKER` in `security_patch_3.sql`.

---

## C7: `.env` credentials — verify not in git history
```bash
git log --all --diff-filter=A -- .env frontend/.env
```
If any output: rotate anon key immediately in Supabase Dashboard → Settings → API.

---

## C8: `daily_scores` policy exposes all users' full score history
**File:** `backend/supabase/security_patch_2.sql`

`USING (auth.uid() IS NOT NULL)` lets any logged-in user dump all users' score history for all dates.

**Fix** (in `security_patch_3.sql`):
```sql
USING (auth.uid() IS NOT NULL AND date = CURRENT_DATE)
```

---

## C9: Mock data injected without `DEV` guard
**File:** `frontend/src/main.jsx` lines 11–13

If Vercel env vars are temporarily absent, `injectMockData()` fires for real users.

**Fix:**
```js
if (import.meta.env.DEV && !hasSupabase && !localStorage.getItem('antigravity-aura-store')) {
  injectMockData();
}
```

---

## C10: `localStorage.clear()` wipes Supabase auth token
**File:** `frontend/src/pages/Settings/SettingsPage.jsx` line 401

**Fix:** Only clear app-specific keys:
```js
Object.keys(localStorage)
  .filter(k => k.startsWith('antigravity-') || k === 'system-sync-queue')
  .forEach(k => localStorage.removeItem(k));
```

---

## security_patch_3.sql — Full SQL

```sql
-- ============================================================
-- SECURITY PATCH 3
-- Run AFTER: init.sql, prd_v2_migration.sql,
--            multiplier_neural_migration.sql,
--            security_patch.sql, security_patch_2.sql
-- ============================================================

-- C4: Fix double penalty in compute_midnight_penalties
CREATE OR REPLACE FUNCTION public.compute_midnight_penalties() RETURNS void AS $$
DECLARE
  rec RECORD;
  yesterday DATE := CURRENT_DATE - 1;
  gap_days INTEGER;
  penalty INTEGER;
  escalation INTEGER;
BEGIN
  FOR rec IN SELECT id, current_streak, total_aura_points FROM public.profiles LOOP
    SELECT COUNT(*) INTO gap_days
    FROM public.task_completions
    WHERE user_id = rec.id AND date = yesterday;
    IF gap_days = 0 THEN
      SELECT COUNT(*) INTO escalation
      FROM generate_series(1, 7) AS s(n)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.task_completions
        WHERE user_id = rec.id AND date = (yesterday - (s.n - 1))
      );
      IF escalation >= 7 THEN penalty := -1500;
      ELSIF escalation >= 3 THEN penalty := -(1200 + (escalation - 3) * 100);
      ELSIF escalation >= 2 THEN penalty := -1100;
      ELSE penalty := -1000;
      END IF;
      INSERT INTO public.aura_logs (user_id, date, earned, lost, reason)
      VALUES (rec.id, yesterday, 0, ABS(penalty), 'Inactivity Penalty')
      ON CONFLICT (user_id, date) DO UPDATE
        SET lost = public.aura_logs.lost + ABS(penalty),
            reason = 'Inactivity Penalty', updated_at = NOW();
      -- Single UPDATE (was incorrectly doubled before this patch)
      UPDATE public.profiles
      SET
        total_aura_points = GREATEST(0, rec.total_aura_points + penalty),
        current_streak = CASE WHEN escalation >= 7 THEN 0 ELSE current_streak END,
        multiplier = CASE WHEN escalation >= 7 THEN 1.0 ELSE multiplier END,
        updated_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- C5: Missing indexes
CREATE INDEX IF NOT EXISTS idx_friends_friend_id        ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_duels_challenger_id      ON public.duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent_id        ON public.duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_state              ON public.duels(state);
CREATE INDEX IF NOT EXISTS idx_study_subjects_user_id  ON public.study_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_aura_logs_date           ON public.aura_logs(date);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON public.task_completions(task_id);

-- C6: calculate_vo2max → SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.calculate_vo2max(
  p_bpm INTEGER, p_dist_km NUMERIC, p_time_min NUMERIC, p_age INTEGER
) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  dist_per_min NUMERIC; age_factor NUMERIC;
  raw_vo2 NUMERIC; clamped NUMERIC; score INTEGER;
BEGIN
  IF p_bpm IS NULL OR p_dist_km IS NULL OR p_time_min IS NULL OR p_age IS NULL THEN
    RETURN jsonb_build_object('rawVO2', 0, 'score', 0);
  END IF;
  dist_per_min := p_dist_km / NULLIF(p_time_min, 0);
  age_factor   := GREATEST(0, 30 - p_age) * 0.1;
  raw_vo2      := (dist_per_min * 21.4) - (0.065 * p_bpm) + age_factor + 10;
  clamped      := GREATEST(20, LEAST(80, raw_vo2));
  score        := ROUND(((clamped - 20) / 60.0) * 100);
  RETURN jsonb_build_object('rawVO2', ROUND(clamped::NUMERIC, 1), 'score', score);
END;
$$;

-- C8: Restrict daily_scores leaderboard policy to today only
DROP POLICY IF EXISTS "daily_scores_leaderboard_select" ON public.daily_scores;
CREATE POLICY "daily_scores_leaderboard_select" ON public.daily_scores
  FOR SELECT USING (auth.uid() IS NOT NULL AND date = CURRENT_DATE);

-- Phase 3 prep: cypher_id + last_seen_at on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cypher_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_streak_days INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_profiles_cypher_id ON public.profiles(cypher_id);

-- Phase 3 prep: friends table — mutual request system
ALTER TABLE public.friends ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted';
ALTER TABLE public.friends ADD COLUMN IF NOT EXISTS requested_by UUID;

-- Phase 3 prep: hobby_sessions table
CREATE TABLE IF NOT EXISTS public.hobby_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hobby_id TEXT NOT NULL,
  hobby_name TEXT NOT NULL,
  type TEXT,
  categories TEXT[],
  duration_minutes INTEGER DEFAULT 0,
  ap_earned INTEGER DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.hobby_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hobby_sessions_user_policy" ON public.hobby_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_hobby_sessions_user_id ON public.hobby_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hobby_sessions_date ON public.hobby_sessions(date);

-- Phase 5 prep: goal retry tracking
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS overdue_penalty_applied BOOLEAN DEFAULT FALSE;
```

---
---

# Phase 2 — High Severity

## H1: Raw Supabase error messages enable email enumeration
**File:** `frontend/src/pages/Auth/AuthPage.jsx` lines 29, 49, 179, 199

**Fix:** Replace all `setError(err.message)` in auth flows with:
```js
const safeAuthError = (msg) => {
  if (!msg) return 'Something went wrong. Please try again.';
  if (msg.includes('Invalid login')) return 'Incorrect email or password.';
  if (msg.includes('already registered')) return 'An account with this email exists.';
  if (msg.includes('rate limit') || msg.includes('429')) return 'Too many attempts. Try again later.';
  if (msg.includes('Email not confirmed')) return 'Please verify your email before logging in.';
  return 'Authentication failed. Please try again.';
};
```

---

## H2: `seedServerFromLocal` accepts spoofed userId
**File:** `frontend/src/services/syncEngine.js` line 416

**Fix:** Add session check at top of function:
```js
const { data: { user } } = await supabase.auth.getUser();
if (!user || user.id !== userId) return;
```

---

## H3: Offline / Cloud Sync toggles never checked during actual sync
**Files:** `frontend/src/store/uiStore.js`, `frontend/src/services/syncEngine.js`

`offlineMode` and `cloudSync` are stored but `pushChange()` and `flushQueue()` never read them. Toggles are cosmetic.

**Fix:** Add at top of `pushChange()`:
```js
const { offlineMode, cloudSync } = useUiStore.getState();
if (offlineMode || !cloudSync || !navigator.onLine) {
  useSyncQueue.getState().enqueue(table, op, payload);
  return;
}
```

---

## H4: `pullAllData` uses `Promise.all` — one failure aborts all 17 queries
**File:** `frontend/src/services/syncEngine.js` line 161

**Fix:** Switch to `Promise.allSettled()`. Process only fulfilled results; log rejected ones individually.

---

## H5: `flushQueue` replays stale user's mutations on new session
**File:** `frontend/src/services/syncEngine.js` lines 98–129

**Fix:** Before processing each queue item, verify `item.payload.user_id` matches `supabase.auth.getUser()`. Drop non-matching items.

---

## H6: `clearAllStores()` misses social, command, and sync queue stores
**File:** `frontend/src/components/auth/AuthProvider.jsx` lines 109–122

On sign-out, `useSocialStore`, `useCommandStore`, and `useSyncQueue` are not cleared. User B sees User A's friends and duel history.

**Fix:** Add to `clearAllStores()`:
```js
useSocialStore.setState({ friends: [], duels: [], lastSyncedAt: null });
useCommandStore.setState({ history: [
  { id: 'boot-1', type: 'system', text: 'SYSTEM_BOOT . . . [V9.0.1 ALPHA]' },
  { id: 'boot-2', type: 'system', text: 'SCANNING_ENVIRONMENT . . . [SECURE_ENCLAVE]' },
  { id: 'boot-3', type: 'update', text: 'SYNCING_USER_BIOMETRICS . . . [SUCCESS]' }
], timerStart: null });
useSyncQueue.getState().clearQueue();
```

---

## H7: Duel winner self-declared client-side
**File:** `frontend/src/store/socialStore.js` line 26

Any user can call `resolveDuel(id, myId, myId)` from console and win. RLS allows it since they are a participant.

**Fix:** Server-side resolution RPC only (built in Phase 3). Client sends `resolveDuel(duelId)` — no `winnerId` param. Server compares AP earned by both players in the duel window.

---

## H8: `auraHistory` grows unbounded — localStorage overflow risk
**File:** `frontend/src/store/auraStore.js`

**Fix:** Cap at 180 entries everywhere `auraHistory` is pushed to:
```js
auraHistory: [...state.auraHistory, entry].slice(-180)
```
Apply in: `addCategoryAP`, `computeTodayAura`, `addAuraPoints`, `redeemPoints`, `applyPenalties`.

---

## H9: `Date.now()` as entity IDs — collision risk
**Files:** `assetStores.js` (goals L14, projects L69, hobbies L130), `socialStore.js` (duels L17), `commandStore.js` (entries L17)

**Fix:** `id: crypto.randomUUID()` everywhere.

---

## H10: No `maxLength` on multiple form inputs
| Input | File | Max |
|---|---|---|
| Player name | `SettingsPage.jsx` L187 | 24 |
| Task title | `TaskForm.jsx` | 100 |
| Hobby name | `HobbyForm.jsx` | 50 |
| Subject name | `StudyPage.jsx` | 50 |
| Macro/micro name | `NutritionPage.jsx` | 30 |
| Mood note | `MoodPage.jsx` textarea | 500 |
| Task add input | `SettingsPage.jsx` | 100 |

---

## H11: Password complexity — only `minLength={8}` on signup
**File:** `frontend/src/pages/Auth/AuthPage.jsx` line 314

**Fix:** Client-side validation before submit: require at least 1 uppercase letter and 1 number. Show a simple strength indicator line under the password field.

---
---

# Phase 3 — Broken Feature Rewrites

## M1: Friends / Social Hub — entirely fake
**File:** `frontend/src/pages/Social/FriendsPage.jsx`

Current: ignores Cipher ID input, generates fake random names, "PING" does nothing.

**What to build:**
- Online presence: `pullAllData` updates `profiles.last_seen_at` on every call. Users active within 5 minutes = online. Show "ONLINE NOW" section at top of Friends page.
- Friend request flow: user enters Cipher ID → look up `profiles` where `cypher_id = input` → if found, insert `friends` row with `status: 'pending'`, `requested_by: currentUserId`
- Incoming requests show in Settings → Notifications section with accept/reject
- Accepted: both users see each other in friends list with real username + avatar
- Friends table needs: `user_id`, `friend_id`, `status` (`pending` | `accepted`), `requested_by`, `created_at`
- DB: `cypher_id` column + index already added in `security_patch_3.sql`

---

## M2: Duels — entirely hardcoded and non-functional
**File:** `frontend/src/pages/Duels/DuelPage.jsx`

Current: hardcoded `initiateDuel('001', 'GOGGINS CLONE')`, progress bars at 45%/32%, no real data.

**What to build:**

**Direct 1v1:** User enters opponent's Cipher ID → look up profile → send challenge. Opponent sees it in Duels page under "INCOMING CHALLENGES" with ✅ / ❌ buttons.

**Skill-based matchmaking (default):** "FIND OPPONENT" button puts user in a matchmaking pool (new `matchmaking_queue` table: `user_id`, `ap_bracket`, `joined_at`). Server matches by closest `total_aura_points` (±20% bracket). First match auto-challenges.

**AP escrow:** On acceptance, deduct `stake_ap` from both players' `total_aura_points` immediately. On resolution, winner's balance is credited `stake_ap * 2`.

**Progress bars:** Show AP earned by each player in `aura_logs` since `duels.start_at`. Fetched when duel card is opened.

**Resolution:** Server-side RPC `resolve_duel(duel_id)` — compares `SUM(earned)` from `aura_logs` for both players between `start_at` and `end_at`. Winner gets escrow back × 2. Multiplier bonus applied server-side.

**Duels table additions:** `start_at TIMESTAMPTZ`, `end_at TIMESTAMPTZ`, `match_type TEXT` (`direct` | `ranked`), `challenger_escrowed BOOLEAN`, `opponent_escrowed BOOLEAN`.

---

## M3: Shop — fake `alert()` misleads users
**File:** `frontend/src/pages/Shop/ShopPage.jsx`

Remove the `alert('SUCCESS: ... VOUCHER SENT...')`. Replace with a disabled button state showing "REDEMPTION BACKEND PENDING". Keep all UI. No other changes until backend funding is secured.

---

## M4: AI Agent — Command Terminal (HF Spaces Backend + OpenRouter)

**Decision locked.** Model: `qwen/qwen3-32b:free` (text-only — no vision/audio needed). Fallback: `google/gemma-3-27b-it:free`. Both free on OpenRouter.

---

### HF Spaces role — backend server, not a model host

HF Spaces hosts a **FastAPI server** (Docker SDK, CPU Basic free tier). It does not run the model locally — it proxies every chat request to OpenRouter, which serves Qwen3-32B on their own infrastructure. This means:

- **The app never exposes the OpenRouter API key** — key lives as a HF Space secret, only accessible by the FastAPI process
- **All users share one backend endpoint** — `https://DRAgNATSU66-system-agent.hf.space/chat`
- **Scales automatically** — OpenRouter handles concurrent model requests for every user simultaneously; HF Spaces just routes and rate-limits
- **No GPU cost** — CPU Basic is enough because we only forward JSON and stream bytes

### How multi-user AI works (public deployment)

```
User A browser  ──┐
User B browser  ──┤── POST /chat ──► HF Spaces FastAPI ──► OpenRouter API ──► Qwen3-32B
User C browser  ──┘        ▲                                     (hosted by OpenRouter/Qwen)
                            └── auth check + rate limit (Supabase ai_usage table)
                                stream SSE back to each client independently
```

Each request is stateless. The HF Spaces server:
1. Verifies `X-User-Id` header against Supabase (lightweight `auth.getUser()` check)
2. Checks `ai_usage` table — if user hit 20 requests today, return 429
3. Injects system prompt + user context, calls OpenRouter with `stream: true`
4. Pipes SSE chunks back to the browser

### What server-side logic lives on HF Spaces

| Responsibility | Where |
|---|---|
| AI chat proxy (hide OpenRouter key) | HF Spaces FastAPI |
| Per-user rate limiting (20 req/day) | HF Spaces + `ai_usage` Supabase table |
| System prompt + context injection | HF Spaces |
| CSP violation reports (P4-3) | HF Spaces `/csp-report` endpoint |
| Duel resolution RPC | Supabase Edge Function (or SQL RPC) |
| Midnight penalty cron | Supabase scheduled function |
| All data reads/writes | Supabase directly from frontend |

### Files to create

```
backend/hf_agent/
  app.py             ← FastAPI server (chat proxy + rate limit + csp-report)
  requirements.txt   ← fastapi, uvicorn, httpx, supabase-py
  Dockerfile         ← FROM python:3.11-slim, EXPOSE 7860, CMD uvicorn app:app
  README.md          ← HF Spaces config (title, sdk: docker, app_port: 7860)
```

### System prompt template

```
You are CIPHER, the AI core of SYSTEM OS — a gamified life-tracking OS.
The user's current state: {user_context_json}
Rules: be direct, motivational, brutally honest. Max 200 words unless asked for a plan.
Never fabricate numbers — only reference what is in the user context above.
```

`user_context_json` sent from frontend includes: `total_ap`, `streak`, `multiplier`, `rank`, `todayEarned`, `todayLost`, `dailyCategoryAP` (today), `active_goals[]`, `recent_aura_history` (last 7 days), `tasks_completed_today`, `tasks_total`.

### Rate limiting — `ai_usage` table

```sql
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id   UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date      DATE    NOT NULL DEFAULT CURRENT_DATE,
  count     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_self" ON public.ai_usage FOR ALL USING (auth.uid() = user_id);
```

HF Spaces upserts this on each request using a service-role key (secret). Frontend never touches this table.

### Frontend changes (Command Center)

- Command page becomes a full chat interface with streaming text output
- Message history capped at 50 entries in `commandStore` (FIFO drop oldest)
- Existing slash commands (`critique`, `status`, `timer`, `complete`) become preset prompt chips that pre-fill the input and submit immediately
- Input: single text field + SEND button + streaming indicator
- No image/audio inputs needed

---

## M5: Workout — LOG ALL uses hardcoded fake values
**File:** `frontend/src/pages/Workout/WorkoutPage.jsx` lines 239, 261

`handleLogAllGroup` hardcodes `3 sets, 10 reps, 20kg`. Awards AP for fake training data.

**Fix:** Use `lastLoggedValues[group][sub]` for each sub-group. If no history exists for a sub-group, show a confirmation dialog before logging defaults.

---

## M6: Hobby sessions — no data stored, timer missing
**File:** `frontend/src/pages/Habits/HabitsPage.jsx`

Current: "LOG SESSION" awards 150 AP flat with no duration, no record stored.

**What to build:**
- Each hobby card gets a START / STOP timer (same pattern as Study page)
- On STOP: record saved to `hobby_sessions` table: `{ hobby_id, hobby_name, type, categories[], duration_minutes, ap_earned, date }`
- AP formula: first 30 min = 150 AP, each additional 30 min = +50 AP, capped at daily MISC limit
- Session history visible per hobby card (last 5 sessions: date, duration, AP)
- `hobby_sessions` table already created in `security_patch_3.sql`

---

## M7: Mobility — sets/reps/weight inputs make no sense
**File:** `frontend/src/pages/Workout/WorkoutPage.jsx` (Mobility tab uses `MuscleGroupCard`)

**What to build:** Replace the Mobility tab's `MuscleGroupCard` with a `MobilityCard` component:
- **Duration mode:** number input for hold time in seconds (e.g., hip flexor: 90s)
- **Completion mode:** single "DONE" button to tick the exercise as complete
- Each mobility sub-group card shows both — user picks which applies per exercise
- AP: completion tick = 5 AP flat; duration = `Math.round(seconds / 30) * 5` AP, capped at 30 AP per exercise

---

## M8: Leaderboard — top-5 exclusive mutual profile viewer

**What to build:**

**Access rule:** Only users ranked #1–5 can click to expand another #1–5 player's card. For all other users, leaderboard rows are non-interactive (no expand).

**Profile card content (dropdown on click):**
- Avatar / profile picture
- Username + Rank badge
- Total Aura Points
- Current streak
- Multiplier
- Last active (formatted: "2h ago", "Online now", etc.)
- Net negative AP experienced (total lifetime lost AP)
- Today's score
- Recent activity — AP breakdown for today (categories: WORKOUT, STUDY, SLEEP, MOOD, NUTRITION, MISC)
- Mini neural pentagram (same axes as dashboard: Workout, Study, Sleep, Mood, Nutrition — sized ~120px)

**Security:** Fetching this data uses a Supabase RPC `get_top5_profile(target_user_id)` that:
1. Checks if `auth.uid()` is in the top 5 (via `profiles` ordered by `total_aura_points DESC LIMIT 5`)
2. Checks if `target_user_id` is also in top 5
3. Only returns expanded data if both conditions pass
4. Returns: profile fields + today's `aura_logs` breakdown + today's `daily_scores` + today's `daily_metrics` (for pentagram)

**90-day top-5 streak bonus:**
- Daily cron (alongside `compute_midnight_penalties`) checks who is in top 5
- Increments `leaderboard_streak_days` for each qualifying user
- Resets to 0 if user drops out of top 5
- At exactly 90 days: set a `leaderboard_bonus_earned` flag and grant equivalent of $10 store credit (implemented when Shop backend is live — Phase 6)
- `leaderboard_streak_days` column already added in `security_patch_3.sql`

---

## M9: Study — "LOG 60M" bypasses timer, AP farming vector
**File:** `frontend/src/pages/Study/StudyPage.jsx` line 118

**Fix:** Replace "LOG 60M" button with a manual input: number field (min 1, max 480) + "LOG MANUAL" button. Show a note: "Use the timer for accuracy." The manual log goes through the same `addCategoryAP('STUDY', ...)` path with proper daily cap enforcement.

---
---

# Phase 4 — Medium Severity

## P4-1: Avatar upload — no MIME type validation
**File:** `frontend/src/pages/Settings/SettingsPage.jsx` lines 73–101

`accept="image/*"` is bypassable. A `.html` file renamed `.png` could be uploaded and served as XSS from Supabase's public URL.

**Fix:**
- Client: `if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setAvatarMsg('Invalid file type.');`
- Supabase Storage: add MIME type restriction policy in Dashboard → Storage → Policies

---

## P4-2: Service worker caches stale Supabase REST responses
**File:** `frontend/vite.config.js` lines 31–39

`NetworkFirst` with `networkTimeoutSeconds: 3` serves cached data after 3s lag. User acts on yesterday's leaderboard or stale task completions.

**Fix:** Split the cache rule:
- Supabase REST GET requests: `NetworkFirst`, timeout 1s, `maxAgeSeconds: 300`
- Supabase REST POST/PATCH/DELETE: `NetworkOnly`
- Auth: already `NetworkOnly` — keep

---

## P4-3: CSP missing `report-uri` — violations silently dropped
**File:** `frontend/vercel.json` line 23

Add `report-uri https://DRAgNATSU66-system-agent.hf.space/csp-report` to the CSP header value. The HF Spaces FastAPI server (built in Phase 3 M4) exposes a `/csp-report` POST endpoint that logs violations to a `csp_violations` table or simply prints to Space logs.

---

## P4-4: Auth inputs missing `autocomplete` attributes
**File:** `frontend/src/pages/Auth/AuthPage.jsx`

**Fix:**
```jsx
<input type="email" autoComplete="email" ... />
<input type="password" autoComplete={isLogin ? "current-password" : "new-password"} ... />
```

---
---

# Phase 5 — Architecture & New Features

## A0: `aura_history_detail` — Per-Activity AP Server Storage

**Why:** Currently individual AP events (reason strings like "SLEEP LOGGED: 8h") exist only in `localStorage.auraHistory`. After logout they're gone. `aura_logs` only stores daily totals (earned/lost). This table stores every individual activity entry permanently.

**Retention:** Same Wrapped Recap policy — full detail kept for current year, pruned to daily totals after user downloads Wrapped.

**SQL (run in Supabase SQL Editor when ready to implement):**

```sql
CREATE TABLE IF NOT EXISTS public.aura_history_detail (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date         DATE         NOT NULL DEFAULT CURRENT_DATE,
  category     TEXT         NOT NULL,  -- 'WORKOUT' | 'SLEEP' | 'NUTRITION' | 'MOOD' | 'STUDY' | 'MISC'
  reason       TEXT         NOT NULL,  -- e.g. 'SLEEP LOGGED: 8h, Deep 9/10'
  net          INTEGER      NOT NULL,  -- positive = earned, negative = lost
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.aura_history_detail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aura_history_detail_user_policy"
  ON public.aura_history_detail
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_aura_history_detail_user_date
  ON public.aura_history_detail(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_aura_history_detail_date
  ON public.aura_history_detail(date);
```

**Frontend changes when implementing:**

- In `auraStore.addCategoryAP`: after local state update, call `pushChange('aura_history_detail', 'INSERT', { user_id, date, category, reason, net: actual })`
- In `syncEngine.pullAllData`: fetch last 30 days of detail rows; replace `auraHistory` in store with real per-entry data (preserving reason strings across devices)
- In `AuraHistoryPage`: remove the 10-day expandable limit — all days expandable since data is server-side
- Wrapped prune: `DELETE FROM aura_history_detail WHERE user_id = $1 AND date < $year_start` after download

---

## A1: Delete dead `LoginPage.jsx`
**File:** `frontend/src/components/auth/LoginPage.jsx` — 215 lines, imported nowhere. Delete.

## A2: Remove unused `Placeholder` component
**File:** `frontend/src/router/routes.jsx` lines 35–40. Remove the component definition; no route uses it.

## A3: React Error Boundary
Wrap `<RouterProvider>` in `main.jsx` with a root `<ErrorBoundary>`. Any component throw currently white-screens the entire app.

## A4: Loading indicator during `pullAllData`
Add a `syncing` boolean to `useUserStore`. Set true at start of `pullAllData`, false at end. Header shows a subtle "SYNCING..." indicator while true.

## A5: Workout split — user-configurable
**Decision:** User sets their own split in Settings.

Add a "WORKOUT SCHEDULE" section to Settings: 7 toggles (Mon–Sun), each day = `cardio` | `hypertrophy` | `mobility` | `rest`. Default preset: Mon/Tue/Wed = cardio, Thu/Fri/Sat/Sun = hypertrophy. Stored in `preferences.workoutSplit` in userStore, synced to `profiles.preferences` JSONB. WorkoutPage reads this to show "TODAY: CARDIO".

## A6: Goals — overdue detection + decaying bounty on retry
**Decision:** Overdue = AP penalty. Each retry halves bounty. Floor: 50 AP.

- When `CURRENT_DATE > target_date` and not completed: card flagged red with "OVERDUE" badge
- AP penalty on day it goes overdue: `-Math.min(Math.floor(bounty_ap * 0.10), 500)` — applied once (`overdue_penalty_applied` flag prevents repeat)
- "RETRY" button: new `target_date` picker + `bounty_ap = Math.max(50, Math.floor(bounty_ap / 2))` + `retry_count++`
- DB columns added in `security_patch_3.sql`: `retry_count`, `overdue_penalty_applied`

## A7: Nutrition — auto-save baseline on each log
**Decision:** After first log, logged values become the new baseline automatically.

Every time a user logs a macro/micro value and it's saved to Supabase, silently update `macro_configs` with the new value as the baseline. No manual "save baseline" step needed after the first setup. The existing "ONE-CLICK LOG BASELINE" button then reflects the last real values entered.

## A8: Command terminal — fix real-data commands (pre-AI)
Until the AI agent (Phase 3 M4) is live, fix existing commands to use real store data:
- `timer stop`: route AP through `addCategoryAP('STUDY', ...)` with proper daily cap
- `complete <task>`: match against `useTaskStore` task titles; reject unknown task names
- `reward`: query real `totalAuraPoints` and show distance to next actual reward milestone
- `critique/status`: derive from live store state (today AP, streak, tasks completed vs total)

---
---

# Phase 6 — Final / Future

## F1: Sleep — wearable integration
**Decision:** Manual now. Google Fit / Samsung Health via Capacitor plugin in final phase.

When implemented: `@capacitor-community/health` plugin reads from Google Fit (Android) and Apple HealthKit (iOS). SleepPage detects connection and shows "AUTO-SYNCED FROM DEVICE" vs manual inputs. Both modes coexist — manual if no device connected.

## F2: Shop — real redemption backend
Needs external funding + company tie-ups (Amazon, Netflix, Spotify, GPay). Architecture TBD when partnerships are confirmed. The `redeemPoints()` AP deduction already exists — just needs a real fulfillment hook and transaction log table.

## F3: Capacitor mobile build
```bash
npm install @capacitor/core @capacitor/cli
npx cap init SYSTEM com.dragnatsu66.system
npx cap add ios && npx cap add android
npm run build && npx cap sync
```
Zero UI rewrites — existing React + CSS works as-is in the WebView.

## F4: Push notifications
Built on top of Phase 3 `notifications` table. Capacitor `@capacitor/push-notifications` plugin routes friend requests and duel challenges to OS-level notifications when app is backgrounded.

---
---

# File Change Map

| File | Phase | What changes |
|---|---|---|
| `backend/supabase/security_patch_3.sql` | P1 | Create — double penalty fix, indexes, INVOKER, schema additions |
| `frontend/index.html` | P1 | Remove HMR preamble block |
| `frontend/src/services/supabaseClient.js` | P1 | Null guard on createClient |
| `frontend/src/store/userStore.js` | P1 | crypto.getRandomValues for CypherId |
| `frontend/src/main.jsx` | P1 | DEV guard on mock inject |
| `frontend/src/pages/Settings/SettingsPage.jsx` | P1 + P5 | localStorage fix, workout split UI |
| `frontend/src/services/syncEngine.js` | P2 | Auth guard, allSettled, queue validation, offline toggle |
| `frontend/src/pages/Auth/AuthPage.jsx` | P2 | safeAuthError, autocomplete, complexity hint |
| `frontend/src/components/auth/AuthProvider.jsx` | P2 | Clear social/command/sync on sign-out |
| `frontend/src/store/auraStore.js` | P2 | auraHistory cap at 180 |
| `frontend/src/store/assetStores.js` | P2 | crypto.randomUUID for IDs |
| `frontend/src/store/socialStore.js` | P2 + P3 | UUID IDs, duel escrow logic |
| `frontend/src/store/commandStore.js` | P2 + P5 | UUID IDs, real-data commands |
| `frontend/src/pages/Habits/HabitsPage.jsx` | P3 | Hobby timer + session storage |
| `frontend/src/pages/Habits/HobbyForm.jsx` | P2 | maxLength |
| `frontend/src/pages/Social/FriendsPage.jsx` | P3 | Full rebuild — real lookup, online presence |
| `frontend/src/pages/Duels/DuelPage.jsx` | P3 | Full rebuild — 1v1, matchmaking, escrow, real progress |
| `frontend/src/pages/Shop/ShopPage.jsx` | P3 | Remove fake alert |
| `backend/hf_agent/app.py` | P3 | NEW — FastAPI server: chat proxy, rate limit, CSP report endpoint |
| `backend/hf_agent/Dockerfile` | P3 | NEW — Docker config for HF Spaces (CPU Basic, port 7860) |
| `backend/hf_agent/requirements.txt` | P3 | NEW — fastapi, uvicorn, httpx, supabase-py |
| `backend/hf_agent/README.md` | P3 | NEW — HF Spaces metadata (sdk: docker, app_port: 7860) |
| `frontend/src/pages/Command/CommandPage.jsx` | P3 + P5 | AI streaming chat UI (Phase 3), real commands (Phase 5) |
| `frontend/src/pages/Leaderboard/LeaderboardPage.jsx` | P3 | Top-5 profile viewer |
| `frontend/src/pages/Workout/WorkoutPage.jsx` | P3 + P5 | LOG ALL fix, mobility cards, configurable split |
| `frontend/src/pages/Study/StudyPage.jsx` | P3 | LOG 60M → manual input |
| `frontend/src/pages/Goals/GoalsPage.jsx` | P5 | Overdue detection, retry/decay bounty |
| `frontend/src/pages/Nutrition/NutritionPage.jsx` | P2 + P5 | maxLength, auto-baseline |
| `frontend/src/pages/Mood/MoodPage.jsx` | P2 | maxLength on note |
| `frontend/vite.config.js` | P4 | Service worker cache rules |
| `frontend/vercel.json` | P4 | CSP report-uri |
| `frontend/src/components/auth/LoginPage.jsx` | P5 | DELETE |
| `frontend/src/router/routes.jsx` | P5 | Remove Placeholder |
| `frontend/src/main.jsx` | P5 | Add ErrorBoundary |

---

# Verification Checklist

**After Phase 1:**
- [ ] `npm run build` — no errors
- [ ] Production URL — no `/@react-refresh` 404 in browser console
- [ ] Remove Vercel env vars temporarily → error page shown, not white screen
- [ ] New user CypherId is 10-char alphanumeric, visually random
- [ ] Delete localStorage + refresh with env vars set → no mock data
- [ ] `git log --all --diff-filter=A -- .env` → no output

**After Phase 2:**
- [ ] Login with wrong password → generic message shown
- [ ] `seedServerFromLocal('fake-uuid')` from console → silent no-op
- [ ] Toggle Offline Mode → task completion generates no Supabase network request
- [ ] Sign out as User A, sign in as User B → friends list empty
- [ ] PURGE LOCAL CACHE → user stays logged in
- [ ] `supabase.from('daily_scores').select('*')` → only today's rows returned
- [ ] Log AP 200+ times → `auraHistory.length` stays ≤ 180

**After Phase 3:**
- [ ] Enter real Cipher ID in Friends → correct user found and challenged
- [ ] Duel challenge sent → AP deducted from challenger on accept, not on send
- [ ] Progress bars on active duel show real AP numbers
- [ ] Shop REDEEM → "coming soon" message, no AP deducted
- [ ] Hobby LOG SESSION → session record visible in history with duration
- [ ] Mobility tab shows duration/completion inputs, not sets/reps/weight
- [ ] Click rank #1 card as rank #3 → expanded card shows. Click as rank #6 → no expand

**After Phase 5:**
- [ ] Goals past target date → red badge + penalty applied once
- [ ] RETRY goal → bounty halved, shown on card
- [ ] Log a nutrition value → macro_configs updated silently as new baseline
- [ ] Workout schedule settings → WorkoutPage reflects chosen split

---
---

# Database Architecture — SQL Only (Through All Phases)

**Decision: PostgreSQL via Supabase exclusively. No NoSQL added until specific scale triggers are hit.**

Every feature in this plan maps cleanly to PostgreSQL:

| Feature | Why you might consider NoSQL | Why Supabase/Postgres wins here |
|---|---|---|
| Real-time notifications | "Needs pub/sub" | Supabase Realtime = PostgreSQL LISTEN/NOTIFY — already pub/sub |
| Online presence | "Redis TTL keys are cleaner" | `WHERE last_seen_at > NOW() - INTERVAL '5 min'` — 3 lines |
| Matchmaking queue | "Ephemeral high-write" | `matchmaking_queue` table + Supabase Realtime handles launch scale |
| Workout/metrics objects | "Document store" | Already using PostgreSQL `JSONB` — same power, no extra service |
| AI chat history | "Document store" | JSONB array column, capped at 50 messages |
| Leaderboard ranking | "Redis sorted sets are faster" | Indexed `ORDER BY total_aura_points DESC LIMIT 100` is sub-5ms at thousands of users |

**AI rate limiting (HF Spaces only):** The `/chat` endpoint uses a simple Python in-memory counter dict with daily reset — no Redis needed. Falls back to a `ai_usage(user_id, date, count)` Supabase table if HF Spaces restarts.

## When to add Redis (scale triggers — revisit only when these hit)

| Trigger | Threshold | What to add |
|---|---|---|
| Leaderboard query slowness | >100ms p95, >1000 DAU | Redis sorted set as cache layer, 5-min TTL |
| Matchmaking lag | >50 users in queue simultaneously | Redis sorted set keyed by AP bracket |
| `last_seen_at` read pressure | >500 concurrent users, Postgres CPU spikes | Redis TTL keys for presence (key expires = offline) |
| AI endpoint restarts lose rate limit state | Happens in prod under load | Upstash Redis (serverless, free tier) on HF Spaces |

None of these will apply at launch or through Phases 1–5. Revisit post-Phase 5 if the app gains real user traction.
