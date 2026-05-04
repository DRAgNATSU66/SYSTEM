# SYSTEM OS — Master Audit & Execution Plan

**Date:** 2026-05-04  
**Scope:** Full codebase — frontend, backend SQL, sync engine, auth flows, client-side logic  
**Status:** PRE-EXECUTION — nothing has been changed yet

> **Note:** The mentor's plan said 3 files were "already edited" (index.html, supabaseClient.js, userStore.js).  
> After reading the actual files, **none of those 3 patches have been applied**. All 3 are still in their original broken state.

---

## Severity Summary

| Layer | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| Database / SQL | 4 | 2 | 1 | 2 |
| Auth & Session | 1 | 3 | 1 | 2 |
| Sync Engine | 1 | 3 | 2 | 0 |
| Frontend Security | 2 | 4 | 4 | 3 |
| Mock Data / Broken Features | 2 | 5 | 6 | 3 |
| Architecture / Design | 0 | 2 | 4 | 3 |
| **Total** | **10** | **19** | **18** | **13** |

---

---

# PHASE 1 — CRITICAL SECURITY FIXES (Before any deploy)

These can cause data loss, double-charges, or complete app failure in production.

---

## P1-C1: React HMR Preamble in production `index.html` [NOT FIXED]

**File:** [frontend/index.html](frontend/index.html) lines 18–24  
**Risk:** On every production page load, the browser attempts to import `/@react-refresh` which does not exist in production. This causes a 404 network error on every page load. It also leaks internal framework info.

**Fix:** Remove the entire `<script type="module">` block that imports `RefreshRuntime`. Vite injects this automatically in dev mode — it must not be hardcoded in `index.html`.

```html
<!-- REMOVE THIS ENTIRE BLOCK from index.html -->
<script type="module">
  import RefreshRuntime from '/@react-refresh'
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
</script>
```

---

## P1-C2: `supabaseClient.js` calls `createClient(undefined, undefined)` on missing env vars [NOT FIXED]

**File:** [frontend/src/services/supabaseClient.js](frontend/src/services/supabaseClient.js) line 10  
**Risk:** If Vercel env vars are missing or misconfigured, `createClient(undefined, undefined)` throws an unrecoverable crash. Every file that imports `supabase` fails. The app white-screens for all users.

**Fix:**
```js
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;
```
Most callers already guard `if (!supabase) return` — but `pushChange` and `flushQueue` in syncEngine do not. Add guards there too.

---

## P1-C3: `Math.random()` used for Cypher ID generation [NOT FIXED]

**File:** [frontend/src/store/userStore.js](frontend/src/store/userStore.js) lines 6–13  
**Risk:** `Math.random()` is not cryptographically secure. Cypher IDs can be predicted or brute-forced.

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

## P1-C4: `compute_midnight_penalties()` applies AP penalty TWICE

**File:** [backend/supabase/init.sql](backend/supabase/init.sql) and [backend/supabase/security_patch.sql](backend/supabase/security_patch.sql)  
**Risk:** For users with `escalation >= 7`, the function has a conditional UPDATE (lines ~420–427) AND an unconditional second UPDATE (lines ~435–437) to `total_aura_points`. Users get double-penalised — AP is subtracted twice. This silently corrupts every power user's AP balance during nightly cron.

**Fix:** Remove the second unconditional UPDATE. The conditional block already handles all cases. See `security_patch_3.sql` in Phase 2 SQL block.

---

## P1-C5: Missing DB indexes cause full table scans (DoS under load)

**File:** [backend/supabase/init.sql](backend/supabase/init.sql)  
**Risk:** The `compute_midnight_penalties()` cron runs `FOR rec IN SELECT ... FROM profiles` with nested queries against `task_completions` — O(users × 7) sequential full-table scans with no indexes. Under real user load this will time-out or kill DB performance.

**Missing indexes:**
- `friends(friend_id)` — reverse friend lookups
- `duels(challenger_id)`, `duels(opponent_id)`, `duels(state)`
- `study_subjects(user_id)`
- `aura_logs(date)` — penalty cron does date-range scans
- `task_completions(task_id)` — completion lookups by task

**Fix:** Create `security_patch_3.sql` with all indexes (see Phase 2).

---

## P1-C6: `calculate_vo2max()` is `SECURITY DEFINER` — runs as postgres superuser

**File:** [backend/supabase/prd_v2_migration.sql](backend/supabase/prd_v2_migration.sql)  
**Risk:** `security_patch_2.sql` revoked `compute_midnight_penalties` and `reset_weekly_progress` from users, but `calculate_vo2max()` is still `SECURITY DEFINER`. It's pure math (no writes), but running math as superuser is unnecessary. A crafted call with extreme values could cause numeric overflow.

**Fix:** Change to `SECURITY INVOKER` — it doesn't need elevated privileges for math.

---

## P1-C7: `.env` file with live Supabase credentials — verify not in git history

**File:** `.env` (root) and `frontend/.env`  
**Risk:** If either file was ever committed to git history, the Supabase URL + anon key are permanently leaked. `.gitignore` lists `.env` but that only prevents future commits — it doesn't remove past ones.

**Action:**
```bash
git log --all --diff-filter=A -- .env frontend/.env
```
If any results appear: **rotate the anon key immediately** in Supabase Dashboard → Settings → API.

---

## P1-C8: `daily_scores` leaderboard policy exposes ALL users' score history

**File:** [backend/supabase/security_patch_2.sql](backend/supabase/security_patch_2.sql)  
**Risk:** The current policy `USING (auth.uid() IS NOT NULL)` allows any logged-in user to call `supabase.from('daily_scores').select('*')` and get every user's full score history for all dates — not just today. This is a data leak of all historical performance data for all users.

**Fix:** Restrict to today only:
```sql
USING (auth.uid() IS NOT NULL AND date = CURRENT_DATE)
```

---

## P1-C9: `profiles` leaderboard policy exposes ALL user profile data

**File:** [backend/supabase/security_patch_2.sql](backend/supabase/security_patch_2.sql)  
**Risk:** `USING (auth.uid() IS NOT NULL)` on profiles allows any logged-in user to `SELECT *` all profiles. This exposes `preferences` (JSONB), `last_login_date`, `created_at`, `accumulated_iq`, `accumulated_knowledge`, `avatarUrl` for every user — not just leaderboard-relevant columns.

**Fix:** The leaderboard query in [frontend/src/pages/Leaderboard/LeaderboardPage.jsx](frontend/src/pages/Leaderboard/LeaderboardPage.jsx) already uses explicit columns (`id, username, total_aura_points, current_streak, multiplier, rank_tier`), so the data isn't exposed on that page — but the open policy still allows any direct API call to dump everything.

Best fix: Create a restricted leaderboard view with only needed columns, or use column-level security.

---

## P1-C10: Mock data injected without `DEV` guard

**File:** [frontend/src/main.jsx](frontend/src/main.jsx) lines 11–13  
**Risk:** If Vercel env vars are temporarily missing (a real deployment scenario), `hasSupabase` becomes false and `injectMockData()` runs for real users who have no existing localStorage state. Real users see fake data.

**Current code:**
```js
const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
if (!hasSupabase && !localStorage.getItem('antigravity-aura-store')) {
  injectMockData();
}
```

**Fix:** Add `import.meta.env.DEV` guard:
```js
if (import.meta.env.DEV && !hasSupabase && !localStorage.getItem('antigravity-aura-store')) {
  injectMockData();
}
```

---

---

# PHASE 2 — HIGH SEVERITY (First week of production)

---

## P2-H1: Raw Supabase error messages exposed to users (email enumeration)

**File:** [frontend/src/pages/Auth/AuthPage.jsx](frontend/src/pages/Auth/AuthPage.jsx) lines 29, 49, 179, 199  
**Risk:** `setError(authErr.message)` renders raw Supabase errors like `"User already registered"` directly in the UI. An attacker can enumerate which emails are registered by trying signups and reading the error messages.

**Fix:** Map errors to generic messages:
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
Replace all `setError(authErr.message)` calls with `setError(safeAuthError(authErr.message))`.

---

## P2-H2: `seedServerFromLocal` has no auth guard — accepts spoofed userId

**File:** [frontend/src/services/syncEngine.js](frontend/src/services/syncEngine.js) line 416  
**Risk:** `seedServerFromLocal(userId)` takes a userId parameter and uses it to write to Supabase. A developer calling `seedServerFromLocal('another-users-id')` from the console will generate write requests (RLS blocks them, but the function still fires and produces error noise).

**Fix:** Add auth session guard at the top:
```js
export async function seedServerFromLocal(userId) {
  if (!userId || !supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return;
  // ... rest of function
}
```

---

## P2-H3: Offline Mode / Cloud Sync toggles are cosmetic — never checked during sync

**File:** [frontend/src/store/uiStore.js](frontend/src/store/uiStore.js), [frontend/src/services/syncEngine.js](frontend/src/services/syncEngine.js)  
**Risk:** `offlineMode` and `cloudSync` are stored in `uiStore` but `pushChange()`, `flushQueue()`, and `useCloudSync` never read them. The Settings toggles are UI-only decorations — data always syncs to Supabase regardless of what the user toggles.

**Fix:** Add guards in `pushChange()`:
```js
import { useUiStore } from '../store/uiStore';

export async function pushChange(table, op, payload) {
  if (!supabase) return;
  const { offlineMode, cloudSync } = useUiStore.getState();
  if (offlineMode || !cloudSync || !navigator.onLine) {
    useSyncQueue.getState().enqueue(table, op, payload);
    return;
  }
  // ... rest
}
```

---

## P2-H4: `pullAllData` uses `Promise.all` — one failed query crashes all 17

**File:** [frontend/src/services/syncEngine.js](frontend/src/services/syncEngine.js) line 161  
**Risk:** `Promise.all()` with 17 queries means if any single table query fails (network blip, missing table from schema, rate limit), the entire hydration silently fails. The outer `catch` swallows everything — user sees stale localStorage data with no indication.

**Fix:** Use `Promise.allSettled()` and process each result individually, skipping failed ones.

---

## P2-H5: `flushQueue` doesn't validate `user_id` — cross-session queue replay

**File:** [frontend/src/services/syncEngine.js](frontend/src/services/syncEngine.js) lines 98–129  
**Risk:** If user A goes offline, queues mutations, logs out and user B logs in, stale queue items from user A are flushed under user B's session. RLS blocks the writes, but they generate network errors and noise.

**Fix:** Before flushing each item, verify `payload.user_id` matches `supabase.auth.getUser()`. Drop items that don't match.

---

## P2-H6: `clearAllStores()` on sign-out misses 3 stores — cross-account data leak

**File:** [frontend/src/components/auth/AuthProvider.jsx](frontend/src/components/auth/AuthProvider.jsx) lines 109–122  
**Risk:** On `SIGNED_OUT`, `clearAllStores()` resets aura, task, score, goal, project, hobby, metrics, workout, and study stores — but misses:
- `useSocialStore` → friends list and duel history **persists across accounts**
- `useCommandStore` → command history persists
- `useSyncQueue` → offline queue persists

If user A logs out and user B logs in on the same device, user B sees user A's friends and duels until `pullAllData` overwrites them.

**Fix:** Add to `clearAllStores()`:
```js
useSocialStore.setState({ friends: [], duels: [], lastSyncedAt: null });
useCommandStore.setState({ history: [/* boot messages */], timerStart: null });
useSyncQueue.getState().clearQueue();
```

---

## P2-H7: Duel resolution is fully client-controlled — winner self-declaration exploit

**File:** [frontend/src/store/socialStore.js](frontend/src/store/socialStore.js) line 26  
**Risk:** `resolveDuel(duelId, winnerId, currentUserId)` accepts the winner as a client-provided parameter and writes it directly. Any user can call `socialStore.resolveDuel('duel-id', myUserId, myUserId)` from console to declare themselves winner and get the multiplier bonus. RLS only checks `challenger_id OR opponent_id`, so the write succeeds.

**Fix:** Duel resolution needs a server-side Supabase RPC that compares actual score values for both players and determines the winner. The client should not pass a `winnerId`.

**Question for you:** Do you want me to build the duel RPC now, or gate duels as "coming soon" until the backend is ready?

---

## P2-H8: Shop redemption is client-side only — infinite AP loop exploit

**File:** [frontend/src/pages/Shop/ShopPage.jsx](frontend/src/pages/Shop/ShopPage.jsx)  
**Risk:**
1. `redeemPoints()` deducts AP from local Zustand store
2. `alert()` says "VOUCHER SENT" — but no actual voucher is sent
3. User clears localStorage → AP restored from Supabase server → can "redeem" again
4. No server-side transaction log, no actual voucher delivery
5. The shop shows real brand names (Amazon, Netflix, Spotify, GPay) with a "REDEEM" button that does nothing — this is misleading and potentially a consumer protection issue

**Options:**
- **A:** Gate the entire shop page behind a "Coming Soon" screen until you have a real backend
- **B:** Build a server-side redemption flow (requires an external voucher API or manual fulfillment)

**Question for you:** What's the intended redemption backend? HF Spaces + a webhook? Manual fulfillment? Or hide the shop for now?

---

## P2-H9: `auraHistory` array grows unbounded — localStorage overflow

**File:** [frontend/src/store/auraStore.js](frontend/src/store/auraStore.js)  
**Risk:** `auraHistory` is appended to on every AP earn/loss event and persisted to localStorage. After months of daily use, this array becomes enormous. localStorage has a ~5-10MB limit. When exceeded, the app **silently loses all persisted state** — the user's entire local store is wiped.

**Fix:** Cap `auraHistory` at 180 entries (sliding window, oldest first):
```js
auraHistory: [...state.auraHistory, { date: today, net: actual, reason }].slice(-180)
```
Apply this cap in every place that pushes to `auraHistory`: `addCategoryAP`, `computeTodayAura`, `addAuraPoints`, `redeemPoints`, `applyPenalties`.

---

## P2-H10: `Date.now()` as entity IDs — collision risk + timestamp leak

**Files:**
- [frontend/src/store/assetStores.js](frontend/src/store/assetStores.js) lines 14, 69, 130 (goals, projects, hobbies)
- [frontend/src/store/socialStore.js](frontend/src/store/socialStore.js) line 17 (duels)
- [frontend/src/store/commandStore.js](frontend/src/store/commandStore.js) line 17 (command entries)

**Risk:** `Date.now().toString()` as IDs causes collisions if two items are created within the same millisecond. Also leaks creation timestamps to anyone who sees the ID.

**Fix:** Replace all with `crypto.randomUUID()`:
```js
id: crypto.randomUUID(),
```

---

## P2-H11: Password complexity — only `minLength={8}` enforced

**File:** [frontend/src/pages/Auth/AuthPage.jsx](frontend/src/pages/Auth/AuthPage.jsx) line 314  
**Risk:** Signup only requires 8 characters. No uppercase, number, or special character requirements. This allows trivially weak passwords like `aaaaaaaa`.

**Fix:** Add a complexity check on the signup form (at minimum: 1 uppercase, 1 number). Also add a visible strength indicator.

---

## P2-H12: No `maxLength` on multiple form inputs

**Files and inputs:**
- [frontend/src/pages/Settings/SettingsPage.jsx](frontend/src/pages/Settings/SettingsPage.jsx) line 187 — player name input (no `maxLength`)
- [frontend/src/pages/Habits/HobbyForm.jsx](frontend/src/pages/Habits/HobbyForm.jsx) — hobby name input
- [frontend/src/pages/Nutrition/NutritionPage.jsx](frontend/src/pages/Nutrition/NutritionPage.jsx) line 199 — macro name input
- [frontend/src/pages/Study/StudyPage.jsx](frontend/src/pages/StudyPage.jsx) — subject name input
- [frontend/src/pages/Mood/MoodPage.jsx](frontend/src/pages/MoodPage.jsx) — mood note textarea
- [frontend/src/components/tasks/TaskForm/TaskForm.jsx](frontend/src/components/tasks/TaskForm/TaskForm.jsx) — task title

**Risk:** Users can submit arbitrarily long strings that get stored in Supabase, consuming storage and potentially breaking UI layouts.

**Fix per input:**
- Player name: `maxLength={24}`
- Hobby/subject name: `maxLength={50}`
- Macro/micro name: `maxLength={30}`
- Mood note: `maxLength={500}`
- Task title: `maxLength={100}`

---

---

# PHASE 3 — MOCK DATA REMOVAL & BROKEN FEATURE REWRITES

The following features are either displaying hardcoded/fake data or are entirely non-functional. These need real logic built.

---

## P3-M1: `FriendsPage` — entirely fake, no real DB lookup

**File:** [frontend/src/pages/Social/FriendsPage.jsx](frontend/src/pages/Social/FriendsPage.jsx)  
**Current broken behaviour:**
- User enters a Cipher ID in the input
- `addFriend()` ignores the input entirely
- Creates a fake friend with `Math.random() * 1000` as the name
- `[CIPHER_ID]` placeholder shown as avatar
- "PING" button does nothing

**Decision: Mutual friend requests with online presence display. ✅ CONFIRMED**

**What needs to be built:**
1. Add `last_seen_at` timestamp to `profiles` — updated on each `pullAllData` call; users active in last 5 min = "online"
2. FriendsPage shows a live "ONLINE NOW" section — users whose `last_seen_at` is recent
3. User sends a challenge/friend request → inserts a `friends` row with `status: 'pending'`
4. Target user sees incoming request, accepts → `status` updates to `accepted`; both users now see each other
5. `friends` table needs: `user_id`, `friend_id`, `status` (`pending` | `accepted`), `requested_by`, `created_at`
6. Display real username and avatar from matched profiles
7. DB: add `cypher_id` column to profiles, index it — used for friend lookup

---

## P3-M2: `DuelPage` — entirely hardcoded, non-functional

**File:** [frontend/src/pages/Duels/DuelPage.jsx](frontend/src/pages/Duels/DuelPage.jsx)  
**Current broken behaviour:**
- "SEARCH FOR OPPONENT" button hardcodes `initiateDuel('001', 'GOGGINS CLONE')` — fake opponent
- Progress bars hardcoded at 45% and 32%
- `duel.opponent_name.replace(/_/g, ' ')` — fragile string manipulation on DB data

**Decision: Both modes — direct 1v1 by Cipher ID + default skill-based matchmaking queue. ✅ CONFIRMED**

**What needs to be built:**
1. **Direct 1v1:** User enters opponent's Cipher ID → sends duel challenge → opponent accepts/declines
2. **Matchmaking:** "FIND OPPONENT" puts user in a queue; matched by closest `total_aura_points` bracket (within ±20% of user's AP); first match in queue auto-challenged
3. `duels` table needs: `challenger_id`, `opponent_id`, `state` (`pending`|`active`|`resolved`), `stake_ap`, `start_at`, `end_at` (24h window), `winner_id`, `match_type` (`direct`|`ranked`)
4. Progress bars show AP earned by each player **within the 24h duel window** (compare `aura_logs.earned` for both users since `start_at`)
5. Server-side RPC resolves winner by comparing actual AP earned in window (see P2-H7)

---

## P3-M3: `ShopPage` — client-side redemption loop (no backend)

**Decision: Keep shop UI as-is. Final phase — needs funding + company tie-ups first. ✅ CONFIRMED**

No code changes to ShopPage until the redemption backend is ready. The only fix needed now is removing the `alert()` fake success message so users aren't misled. Replace with a "COMING SOON — redemption backend in progress" message.

---

## P3-M4: `commandStore.js` — hardcoded AI responses, fake reward data

**File:** [frontend/src/store/commandStore.js](frontend/src/store/commandStore.js)  
**Current broken behaviour:**
- `critique/status` — generates static "AI" critique from a hardcoded array
- `commend` — picks from 4 hardcoded strength strings
- `reward` — shows `500 AP -> NEXT_RANK_UP`, `1000 AP -> REDEEMABLE_CREDIT_VOUCHER` — these thresholds are completely wrong vs actual system
- `complete <task>` — awards 50 AP without verifying task exists or hasn't been completed already
- `timer` — awards `minutes × 2` AP uncapped up to 200, bypassing STUDY category caps

**What needs to be built:**
1. `critique/status` — should derive critique from actual store state (AP today, streak, tasks done)
2. `reward` — show the user's real current AP and what the next reward milestone is
3. `complete <task>` — should match task titles from taskStore, not award free AP for any string
4. `timer` — should go through `addCategoryAP('STUDY', ...)` with proper daily cap enforcement
5. (Optional) Route `critique` through a real AI endpoint on HF Spaces for dynamic responses

---

## P3-M5: `WorkoutPage` — LOG ALL hardcodes fake values

**File:** [frontend/src/pages/Workout/WorkoutPage.jsx](frontend/src/pages/Workout/WorkoutPage.jsx) lines 239, 261  
**Current broken behaviour:**
- "LOG ALL" button for a muscle group calls `logVolume(group, sub, 3, 10, 20)` — **hardcoded 3 sets, 10 reps, 20kg** for every exercise regardless of what the user has been training
- This awards AP as if the user trained, with fake numbers in their logs

**Fix:** "LOG ALL" should either:
- Use the last logged values for each sub-group (already tracked in `lastLoggedValues`)
- Or be removed and replaced with a "quick log same as last time" that shows the user what it'll log before confirming

---

## P3-M6: Weekly schedule hardcoded (Mon–Wed cardio, Thu–Sun hypertrophy)

**File:** [frontend/src/pages/Workout/WorkoutPage.jsx](frontend/src/pages/Workout/WorkoutPage.jsx) lines 14–17  
**Current:** Day-of-week split is hardcoded. No user customization.

**Question for you:** Should users be able to set their own workout split? Or keep the fixed Mon–Wed / Thu–Sun split but just don't show it as "today's schedule" if they want to do something different?

---

## P3-M7: Duel progress bars hardcoded at 45% and 32%

**File:** [frontend/src/pages/Duels/DuelPage.jsx](frontend/src/pages/Duels/DuelPage.jsx) lines 26–31  
Already covered in P3-M2. Progress needs to be computed from actual AP earned by each participant within the duel window.

---

## P3-M8: `StudyPage` — "LOG 60M" hardcodes 60 minutes

**File:** [frontend/src/pages/Study/StudyPage.jsx](frontend/src/pages/Study/StudyPage.jsx) line 118  
**Risk:** Every "LOG 60M" click bypasses the timer completely and logs 60 minutes with no verification. Users can spam AP by clicking this button repeatedly (though daily caps prevent infinite AP, it still pollutes study session data).

**Fix:** Either remove the quick-log button and require timer use, or add a number input for manual logging with a reasonable max (e.g., max 480 minutes/day per subject).

---

---

# PHASE 4 — MEDIUM SEVERITY (Post-launch Polish)

---

## P4-M1: `localStorage.clear()` in "PURGE LOCAL CACHE" wipes Supabase auth token

**File:** [frontend/src/pages/Settings/SettingsPage.jsx](frontend/src/pages/Settings/SettingsPage.jsx) line 401  
**Risk:** `localStorage.clear()` removes everything including the `sb-*` Supabase auth token. The user is silently logged out with no warning. Any offline-queued mutations are also lost.

**Fix:**
```js
Object.keys(localStorage)
  .filter(k => k.startsWith('antigravity-') || k === 'system-sync-queue')
  .forEach(k => localStorage.removeItem(k));
```

---

## P4-M2: Avatar upload — no server-side MIME type validation

**File:** [frontend/src/pages/Settings/SettingsPage.jsx](frontend/src/pages/Settings/SettingsPage.jsx) lines 73–101  
**Risk:** `accept="image/*"` on the file input is a client-side hint only — easily bypassed. If a user uploads a `.html` file renamed to `.png`, Supabase Storage serves it at a public URL. If another user visits the direct URL, it executes XSS.

**Fix:**
1. Add client-side `file.type` validation: reject if not in `['image/jpeg', 'image/png', 'image/webp']`
2. Add Supabase Storage policy restricting MIME types (via Supabase Dashboard → Storage → Policies)

---

## P4-M3: Service worker caches Supabase REST responses — stale data served after 3s

**File:** [frontend/vite.config.js](frontend/vite.config.js) lines 31–39  
**Risk:** `NetworkFirst` with `networkTimeoutSeconds: 3` means on a slow connection (>3s response time), the service worker serves yesterday's cached leaderboard data, stale task completions, etc. User acts on stale data and creates sync conflicts.

**Fix:** Either:
- Use `NetworkOnly` for all Supabase REST (data is always fresh, falls back to empty on offline)
- Or reduce timeout to 1s and add strict `maxAgeSeconds: 300` (5 min) cache expiration

---

## P4-M4: `hydrateFromServer` blindly merges state — no schema validation

**Files:** Every store with `hydrateFromServer: (serverData) => set(serverData)`  
**Risk:** Server response replaces store state wholesale. If Supabase returns unexpected keys (schema migration, compromised response), they pollute the store. This is low-risk for a real Supabase backend but worth noting for future hardening.

**Fix (post-launch):** Add a Zod schema layer to validate server responses before hydrating stores.

---

## P4-M5: CSP header missing `report-uri` directive

**File:** [frontend/vercel.json](frontend/vercel.json) line 23  
**Risk:** CSP violations are silently dropped — you never know if someone is probing for XSS vectors.

**Fix:** Add a reporting endpoint:
```json
"Content-Security-Policy": "... ; report-uri /api/csp-report"
```
Or use a free service like `report-uri.com` for CSP violation reports.

---

## P4-M6: Auth inputs missing `autocomplete` attributes

**File:** [frontend/src/pages/Auth/AuthPage.jsx](frontend/src/pages/Auth/AuthPage.jsx) lines 299–315  
**Risk:** Missing `autocomplete="email"` and `autocomplete="current-password"` / `autocomplete="new-password"` breaks password manager integration (1Password, Bitwarden, Chrome autofill).

**Fix:**
```jsx
<input type="email" autocomplete="email" ... />
<input type="password" autocomplete={isLogin ? "current-password" : "new-password"} ... />
```

---

## P4-M7: No `select()` column limits — full schema exposure via API

**Files:** All service files — every Supabase query uses `select('*')`  
**Risk:** Fetches every column including `created_at`, `updated_at`, and internal fields never used client-side. Wastes bandwidth and exposes unnecessary schema information in network responses.

**Fix (non-urgent, batch later):** Replace `select('*')` with explicit column lists in all 17 `pullAllData` queries and service files.

---

## P4-M8: No rate limiting on `addFriend` / `initiateDuel`

**File:** [frontend/src/services/socialService.js](frontend/src/services/socialService.js)  
**Risk:** A user can spam `addFriend()` or `initiateDuel()` from console with no throttling. Each call creates a DB row. No max active duels constraint.

**Fix:** Add a DB constraint: `CONSTRAINT max_active_duels CHECK (...)` or a server-side RPC that checks count before inserting.

---

---

# PHASE 5 — DEAD CODE & ARCHITECTURE

---

## P5-L1: `LoginPage.jsx` — 215-line dead code file, imported nowhere

**File:** [frontend/src/components/auth/LoginPage.jsx](frontend/src/components/auth/LoginPage.jsx)  
**Action:** Delete this file. `AuthPage.jsx` is the actual auth page used in routes.

---

## P5-L2: `Placeholder` component defined but never used in routes

**File:** [frontend/src/router/routes.jsx](frontend/src/router/routes.jsx) lines 35–40  
**Action:** Remove the `Placeholder` component definition. No route uses it.

---

## P5-L3: No React Error Boundary — app white-screens on any component throw

**Risk:** If any component throws during render, the entire app shows a blank white screen. There's no fallback UI.

**Fix:** Add a root `<ErrorBoundary>` component wrapping `<RouterProvider>` in `main.jsx`.

---

## P5-L4: No loading/skeleton states during `pullAllData`

**Risk:** The 17-query hydration takes 2–5 seconds on a real connection. During this time the user sees stale localStorage data that then "jumps" when server data arrives. No visual feedback that a sync is happening.

**Fix:** Show a sync indicator in the header/sidebar during `pullAllData`. The `lastSyncedAt` in stores can drive this.

---

## P5-L5: `NUMERIC(3,1)` multiplier column — fragile type definition

**File:** [backend/supabase/multiplier_neural_migration.sql](backend/supabase/multiplier_neural_migration.sql)  
**Risk:** `NUMERIC(3,1)` allows values from -9.9 to 9.9. The `enforce_multiplier_cap` trigger clamps to [-5, 5], but if someone changes the cap without changing the column type, silent truncation occurs.

**Fix:** Change to `NUMERIC(5,2)` for safety headroom, or document the dependency explicitly.

---

## P5-L6: Dynamic SQL uses `%s` instead of `%I` for identifiers

**File:** [backend/supabase/init.sql](backend/supabase/init.sql) — trigger creation EXECUTE block  
**Risk:** `format('... ON %s ...', tbl)` uses string substitution instead of identifier quoting. Currently safe because `tbl` comes from a hardcoded array, but violates SQL hygiene. Any future code that passes user input here would be injectable.

**Fix:** Change all `%s` used for table/column identifiers to `%I`.

---

---

# PHASE 6 — LOGIC QUESTIONS (Need Your Input Before Building)

These features are either missing or need your design decisions before I can implement them correctly. Nothing will be built for these until you answer.

---

## Q1: Social / Friends system — mutual or one-way?

Current: broken (fake random names).  
Do you want:
- **A) Follow system** — one-way, like Twitter (you follow them, they see you in their followers)
- **B) Friend request** — mutual, both must accept before appearing in each other's friends list

---

## Q2: Duels — matchmaking or direct challenge?

- **A) Direct by Cipher ID** — user enters opponent's Cipher ID to challenge them
- **B) Matchmaking pool** — users opt into a queue and get auto-matched by rank tier
- **C) Both** — Cipher ID for specific challenges + a queue for random matches

---

## Q3: Shop / Redemption backend — what's the plan?

- **A) Hide shop** — "Coming Soon" overlay until you have a real backend
- **B) Manual fulfillment** — redemption sends you (the admin) a notification, you manually send the voucher
- **C) External API** — integrate with a voucher API (Reloadly, etc.)
- **D) HF Spaces webhook** — you want to route redemptions through a Spaces endpoint

---

## Q4: Workout split — fixed or user-customizable?

**Decision: User-configurable. User sets their own split in Settings. ✅ CONFIRMED**

What needs to be built:
- In Settings, add a "WORKOUT SCHEDULE" section — 7 day toggles (Mon–Sun), each day assignable to `cardio` | `hypertrophy` | `mobility` | `rest`
- Default preset: Mon/Tue/Wed = cardio, Thu/Fri/Sat/Sun = hypertrophy (current hardcode becomes the default)
- Stored in `preferences.workoutSplit` in userStore and synced to `profiles.preferences` in Supabase
- WorkoutPage reads from user's configured split to show "TODAY: CARDIO" etc.

---

## Q5: Command terminal — AI agent (heart of SYSTEM)

**Decision: Build as a full LLM chatbot agent — the brain of SYSTEM OS. Backend: Qwen3-32B via OpenRouter free tier. ✅ CONFIRMED**

Architecture:
- The Command page becomes a true AI agent chat interface, not just a command parser
- Model: `qwen/qwen3-32b:free` on OpenRouter (free, strong reasoning, better than Gemini free)
- Fallback: `google/gemma-3-27b-it:free` if Qwen quota exceeded
- The agent receives a **system prompt** containing the user's live stats: current AP, streak, rank, today's completions, weekly progress per category, active goals, multiplier
- User can chat freely — ask for critique, motivation, task suggestions, goal planning, study tips
- Keep the existing slash commands (`critique`, `status`, `timer`, `complete`) as shortcuts that pre-fill the chat
- Host the OpenRouter API call on **HF Spaces** (a tiny FastAPI endpoint) so the API key never touches the client
- HF Spaces endpoint: `POST /chat` → `{ messages, user_context }` → streams LLM response back
- Frontend streams the response token by token into the command terminal UI

---

## Q6: Hobbies / Passion tab — what logging do you want?

**Decision: Per-session store: hobby name, time logged, points scored, type + category classes. ✅ CONFIRMED**

What needs to be built:
- Timer on each hobby card (like Study) — start/stop logs duration
- Each session record: `{ hobby_id, hobby_name, type, categories[], duration_minutes, ap_earned, date }`
- Session history per hobby (last N sessions visible on the card)
- AP scales with duration: e.g. first 30min = 150 AP, each additional 30min = +50 AP up to daily MISC cap
- Store in `hobby_sessions` table in Supabase (new table needed)

---

## Q7: Nutrition — preset or user-defined?

**Decision: Fully user-defined. After first log, current values auto-save as the new baseline. ✅ CONFIRMED**

What needs to be built:
- No preset template on new account — user adds their own macros/micros
- "ONE-CLICK LOG BASELINE" already exists — extend so that **every time the user logs a value and saves**, those values silently overwrite the stored baseline
- Baseline stored in `macro_configs` table (already exists) — update on each successful log
- This means the baseline always reflects the last real values the user entered, not a static snapshot

---

## Q8: Goals — target date logic?

**Decision: Overdue = AP penalty. Retry gives half AP. Each subsequent retry halves again (decaying bounty). ✅ CONFIRMED**

What needs to be built:
- When `CURRENT_DATE > target_date` and goal is not completed: flag card red, show "OVERDUE" badge
- Apply AP penalty on the day it goes overdue: deduct from `total_aura_points` (suggest -10% of `bounty_ap`, capped at 500 AP)
- "RETRY" button on overdue goals: resets `target_date`, but sets `bounty_ap = Math.floor(bounty_ap / 2)`
- Store `retry_count` on the goal — each retry increments it and further halves remaining bounty
- Minimum bounty floor: 50 AP (can't go below)
- DB: add `retry_count INTEGER DEFAULT 0` and update penalty logic in `compute_midnight_penalties()` or a new `check_overdue_goals()` function

---

## Q9: Mobility — same logging model as Hypertrophy or different?

**Decision: Both — duration-based (hold time) AND completion-based (tick done). ✅ CONFIRMED**

What needs to be built:
- Replace the `MuscleGroupCard` sets/reps/weight inputs on the Mobility tab with a dual-mode card:
  - **Duration mode:** input for hold duration in seconds (e.g., hip flexor hold: 90s)
  - **Completion mode:** single checkbox/button — "DONE" tick for routine exercises where duration doesn't matter
- Each mobility sub-group card shows both options; user picks which is relevant per exercise
- AP awarded based on: completion tick = flat points, duration = scales with seconds held (cap at reasonable max)

---

## Q10: Sleep — source of sleep data?

**Decision: Manual now (hours + quality /10). Google Fit / Samsung Health integration in final phase. ✅ CONFIRMED**

Phases:
- **Now:** Manual input — total hours + quality rating out of 10 (keep current UI, quality replaces "deep sleep rating" label)
- **Final phase:** If device connected → auto-pull from Google Fit or Samsung Health API; if not connected → fall back to manual
- Architecture for later: Capacitor plugin (`@capacitor-community/health`) reads from both Google Fit and Samsung Health on Android; Apple HealthKit on iOS
- The SleepPage will detect whether a health integration is active and show "AUTO-SYNCED FROM DEVICE" vs the manual inputs

---

---

# PHASE 2 SQL: `security_patch_3.sql` — New file to create

Run in Supabase SQL Editor after all previous patches.

```sql
-- ============================================================
-- SECURITY PATCH 3
-- Run AFTER: init.sql, prd_v2_migration.sql, 
--            multiplier_neural_migration.sql,
--            security_patch.sql, security_patch_2.sql
-- ============================================================

-- C3: Fix double penalty in compute_midnight_penalties
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
            reason = 'Inactivity Penalty',
            updated_at = NOW();
      -- Single UPDATE only (was incorrectly doubled before)
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

-- C4: Missing indexes
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_duels_challenger_id ON public.duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent_id ON public.duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_state ON public.duels(state);
CREATE INDEX IF NOT EXISTS idx_study_subjects_user_id ON public.study_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_aura_logs_date ON public.aura_logs(date);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON public.task_completions(task_id);

-- C6: change calculate_vo2max to SECURITY INVOKER
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

-- C8+C9: Restrict leaderboard policies
DROP POLICY IF EXISTS "daily_scores_leaderboard_select" ON public.daily_scores;
CREATE POLICY "daily_scores_leaderboard_select" ON public.daily_scores
  FOR SELECT USING (auth.uid() IS NOT NULL AND date = CURRENT_DATE);

-- (profiles policy already restricts to explicit columns in the app query,
--  but ideally create a leaderboard view with only needed columns)
```

---

---

# Execution File Map

| File | Phase | Issues Fixed |
|---|---|---|
| `backend/supabase/security_patch_3.sql` | Create in P1+P2 | C3, C4, C6, C8 |
| `frontend/index.html` | P1 | C1 |
| `frontend/src/services/supabaseClient.js` | P1 | C2 |
| `frontend/src/store/userStore.js` | P1 | C3 |
| `frontend/src/main.jsx` | P1 | C10 |
| `frontend/src/pages/Auth/AuthPage.jsx` | P2 | H1, H11, H12 |
| `frontend/src/services/syncEngine.js` | P2 | H2, H3, H4, H5 |
| `frontend/src/components/auth/AuthProvider.jsx` | P2 | H6 |
| `frontend/src/store/auraStore.js` | P2 | H9 |
| `frontend/src/store/assetStores.js` | P2 | H10 |
| `frontend/src/store/socialStore.js` | P2 | H10 |
| `frontend/src/store/commandStore.js` | P2 | H10 |
| `frontend/src/pages/Settings/SettingsPage.jsx` | P2+P4 | H12, M1 |
| `frontend/src/pages/Habits/HobbyForm.jsx` | P2 | H12 |
| `frontend/src/pages/Nutrition/NutritionPage.jsx` | P2 | H12 |
| `frontend/src/pages/Study/StudyPage.jsx` | P2 | H12, M8 |
| `frontend/src/pages/Mood/MoodPage.jsx` | P2 | H12 |
| `frontend/src/pages/Duels/DuelPage.jsx` | P3 | M2, M7 |
| `frontend/src/pages/Social/FriendsPage.jsx` | P3 | M1 |
| `frontend/src/pages/Shop/ShopPage.jsx` | P3 | H8 |
| `frontend/src/store/commandStore.js` | P3 | M4 |
| `frontend/src/pages/Workout/WorkoutPage.jsx` | P3 | M5, M6 |
| `frontend/vite.config.js` | P4 | M3 |
| `frontend/vercel.json` | P4 | M5 |
| `frontend/src/components/auth/LoginPage.jsx` | P5 | L1 (delete) |
| `frontend/src/router/routes.jsx` | P5 | L2 |

---

# Verification Checklist (after each phase)

**Phase 1:**
- [ ] `npm run build` succeeds with no errors
- [ ] Open prod URL — browser console shows no `/@react-refresh` 404 error
- [ ] Remove env vars temporarily → app shows error page, not white screen crash
- [ ] Cypher ID is alphanumeric and not predictable
- [ ] Delete localStorage + refresh with env vars present → no mock data injected

**Phase 2:**
- [ ] Login with wrong password → generic error shown, not "Invalid login credentials"
- [ ] `seedServerFromLocal('fake-uuid')` from console → silent return, no DB writes
- [ ] Toggle Offline Mode → task completion generates no Supabase network request
- [ ] Log out user A, log in user B → friends/duels list is empty, not user A's data
- [ ] `PURGE LOCAL CACHE` → user stays logged in, only app data is cleared
- [ ] `supabase.from('daily_scores').select('*')` → returns only today's rows
- [ ] `auraHistory.length` stays ≤ 180 after many AP events

**Phase 3:**
- [ ] FriendsPage — entering a real Cipher ID finds the correct user
- [ ] Duels — challenge/accept flow works end-to-end
- [ ] Shop — either hidden "coming soon" or real redemption flow

---

**Answer the Phase 6 questions and Phase 1–2 can start executing immediately.**
