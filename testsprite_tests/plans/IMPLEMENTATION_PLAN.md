# TestSprite Testing Implementation Plan
## SYSTEM Gamified Life OS — PRD v2 Full Coverage

**Date:** 2026-04-03
**Token Budget:** 120 TestSprite tokens
**Prepared by:** Claude Code (planning only — do NOT run tests until plan is reviewed)

---

## Overview

This document is a complete, executable plan for running TestSprite MCP tests across the SYSTEM OS frontend (React/Zustand/Vite) and backend (Supabase/PostgreSQL). It covers all PRD v2 requirements including the new AP scoring logic, VO2 Max revamp, nutrition micronutrient tracking, Aura Duels, PWA readiness, and authentication flows.

**Do NOT execute tests until:**
1. All real Supabase credentials are injected into the test runner environment.
2. A test user account exists that can be safely mutated (habits completed, AP adjusted, etc.).
3. The deployment URL is confirmed (localhost:5173 for local dev, or Vercel preview URL).

---

## File Deliverables (All in `/testsprite_tests/`)

| File | Purpose |
|------|---------|
| `testsprite_login_test_plan.md` | Expanded auth flow tests including OTP, player name, greetings |
| `testsprite_backend_test_plan.json` | 30 backend Supabase test cases (RLS, scoring, cron, nutrition) |
| `testsprite_frontend_test_plan.json` | Existing 20 cases — extend to 40+ with PRD v2 features |
| `testsprite_prd_report.md` | Pre-filled report template; fill results after test run |

---

## Token Budget Allocation (120 tokens)

| Phase | Scope | Est. Tokens |
|-------|-------|-------------|
| Phase 1 — Auth & Login | 8 test cases | 10 |
| Phase 2 — Backend Core (Supabase) | 30 test cases | 40 |
| Phase 3 — Frontend E2E (PRD v2) | 22 new test cases | 45 |
| Phase 4 — Integration cross-check | 5 sync/consistency cases | 15 |
| Report generation | 1 summary call | 10 |
| **Total** | **~65 test cases** | **~120** |

---

## Phase 1 — Authentication & Login Tests

**File:** `testsprite_login_test_plan.md`
**Runner:** TestSprite Browser Agent (Playwright)
**App URL:** `http://localhost:5173/auth`

### Test Cases to Execute

| ID | Title | Priority |
|----|-------|----------|
| TC-AUTH-01 | Verify Supabase env-missing fallback warning | High |
| TC-AUTH-02 | Unauthenticated routing redirects to /auth | High |
| TC-AUTH-03 | Invalid credentials rejection with UI error | High |
| TC-AUTH-04 | Successful login + store hydration (Zustand) | High |
| TC-AUTH-05 | Session persistence across page reload | High |
| TC-AUTH-06 | New user signup → Player Name prompt displayed | High |
| TC-AUTH-07 | Player Name save persists to `profiles.username` | High |
| TC-AUTH-08 | Forgot Password → OTP email sent via Supabase | High |
| TC-AUTH-09 | OTP input → valid code resets password | High |
| TC-AUTH-10 | OTP input → invalid/expired code shows error | Medium |
| TC-AUTH-11 | Dynamic greeting — new user sees "Welcome" (no "back") | High |
| TC-AUTH-12 | Dynamic greeting — returning user after 18:00 → "Good evening" | Medium |
| TC-AUTH-13 | Dynamic greeting — returning user 00:00–05:00 → "Hi midnight owl" | Low |
| TC-AUTH-14 | Dynamic greeting — returning user 05:00–09:00 → "Hi early riser" | Low |
| TC-AUTH-15 | System PNG brand icon renders on login page | Medium |
| TC-AUTH-16 | Particle effect renders on login page (canvas/WebGL element present) | Low |

### Setup Instructions for Auth Tests
```
ENV: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
TEST_USER_EMAIL: {{LOGIN_USER}}          # existing account
TEST_USER_PASSWORD: {{LOGIN_PASSWORD}}
NEW_USER_EMAIL: testsprite_new_{{timestamp}}@example.com
NEW_USER_PASSWORD: TestSprite!99
```

---

## Phase 2 — Backend Tests (Supabase)

**File:** `testsprite_backend_test_plan.json`
**Runner:** TestSprite API Agent (direct Supabase REST + RPC calls)

### Sub-Phase 2A — Row Level Security (RLS)

- **BE-RLS-01:** User A cannot read User B's `tasks`
- **BE-RLS-02:** User A cannot read User B's `aura_logs`
- **BE-RLS-03:** User A cannot write to User B's `profiles`
- **BE-RLS-04:** Unauthenticated request returns 401 on all protected tables
- **BE-RLS-05:** User can read/write only their own `daily_scores`

### Sub-Phase 2B — AP Scoring & Aura Logs

- **BE-AP-01:** `aura_logs.net` computed column = `earned - lost`
- **BE-AP-02:** Daily earned AP capped at 2000 (insert 2500 earned → net = 2000)
- **BE-AP-03:** Daily lost AP capped at 2000 (attempt -2500 → clamps to -2000)
- **BE-AP-04:** Streak multiplier applied correctly: `net * multiplier`
- **BE-AP-05:** Multiplier cap enforced at 4.0x
- **BE-AP-06:** Dailies completion (all 5 categories) grants exactly 1000 AP
- **BE-AP-07:** Partial daily completion grants proportional AP (3/5 = 600 AP)
- **BE-AP-08:** Goals/Hobbies block awards remaining 1000 AP proportionally by weight
- **BE-AP-09:** `profiles.total_aura_points` is updated after `aura_logs` upsert
- **BE-AP-10:** `profiles.rank_tier` is recalculated and stored after AP update

### Sub-Phase 2C — Ranking Logic

- **BE-RANK-01:** User with top-3 AP in `profiles` receives named rank tier
- **BE-RANK-02:** User outside top 3 receives `Unranked #<position>` string
- **BE-RANK-03:** Rank position is accurate (ordered by `total_aura_points DESC`)
- **BE-RANK-04:** Rank updates in real-time when another user surpasses the current user

### Sub-Phase 2D — Workout & Volume Logic

- **BE-WRK-01:** Volume formula `sets × reps × weight` persisted correctly in `workout_logs`
- **BE-WRK-02:** Muscle group volume aggregated correctly per muscle group per session
- **BE-WRK-03:** Weekly hypertrophy progress resets at Sunday midnight (UTC)
- **BE-WRK-04:** VO2 Max score calculated from BPM + Distance + Time + Age inputs (RPC)
- **BE-WRK-05:** VO2 Max score is bounded 0–100

### Sub-Phase 2E — Sleep, Nutrition, Study Scoring

- **BE-SLEEP-01:** Sleep 8h + Deep Sleep 9/10 = 100% progress
- **BE-SLEEP-02:** Sleep 6h + Deep Sleep 7/10 = proportional partial progress
- **BE-NUTR-01:** User baseline macros/micros saved and retrievable from `profiles.preferences`
- **BE-NUTR-02:** All 16 tracked micronutrients present in nutrition log schema
- **BE-NUTR-03:** Reaching baseline thresholds marks nutrition 100% complete
- **BE-STUDY-01:** 2h study = 100% progress; 1h = 50% progress

### Sub-Phase 2F — Cron, Penalties & Maintenance

- **BE-CRON-01:** `compute_midnight_penalties()` docks inactive users 1000 AP
- **BE-CRON-02:** Weekly progress bar resets via Sunday midnight cron trigger
- **BE-CRON-03:** Streak broken → multiplier reset to 1.0x

---

## Phase 3 — Frontend E2E Tests (PRD v2 New Cases)

**File:** `testsprite_frontend_test_plan.json` (extend existing 20 cases)
**Runner:** TestSprite Browser Agent

### New Test Cases to Append (TC021–TC042)

| ID | Title | Category | Priority |
|----|-------|----------|----------|
| TC021 | Dashboard shows live AP score beside ranking bar | Dashboard | High |
| TC022 | Ranking bar resolves (no indefinite "ranking...") | Dashboard | High |
| TC023 | Rank shows named tier when user is top-3 | Dashboard | High |
| TC024 | Rank shows "Unranked #N" when not top-3 | Dashboard | High |
| TC025 | Muscle pentagram shows volume (sets×reps×weight) per group | Workout | High |
| TC026 | Weekly hypertrophy progress bar resets on Monday | Workout | High |
| TC027 | VO2 Max form accepts BPM + Distance + Time + Age | Workout | High |
| TC028 | VO2 Max result score renders 0–100 | Workout | High |
| TC029 | Study progress: 2h = 100%, 1h = 50% | Daily Progress | High |
| TC030 | Sleep log: 8h + 9/10 deep sleep = 100% | Daily Progress | High |
| TC031 | Nutrition: logging baseline macros marks 100% | Daily Progress | High |
| TC032 | All 16 micronutrients visible in nutrition form | Daily Progress | High |
| TC033 | One-click default nutrition log from saved baseline | Daily Progress | Medium |
| TC034 | Player Name prompt shown to new user after signup | Auth | High |
| TC035 | Player Name can be changed in Settings | Auth/Settings | Medium |
| TC036 | Forgot Password link visible on login page | Auth | High |
| TC037 | OTP input UI shown after forgot password submit | Auth | High |
| TC038 | Dynamic greeting: new user → "Welcome" | Dashboard | High |
| TC039 | Dynamic greeting: returning user 12:00 → "Good afternoon" | Dashboard | Medium |
| TC040 | Aura Duel matchmaking UI accessible | Duels | Medium |
| TC041 | Aura Duel permission request UI renders (cam/mic/accessibility) | Duels | Medium |
| TC042 | PWA manifest.json present and service worker registered | PWA | High |

---

## Phase 4 — Integration & Sync Consistency Tests

These tests verify data written by the backend is faithfully reflected in the frontend.

| ID | Title | Priority |
|----|-------|----------|
| INT-01 | AP update in Supabase immediately reflected in dashboard AP display | High |
| INT-02 | Habit completion triggers aura_log row + dashboard score update | High |
| INT-03 | Rank change after AP update shown in leaderboard without page reload | High |
| INT-04 | Nutrition baseline saved in settings visible pre-filled in nutrition log | Medium |
| INT-05 | Sleep entry syncs to daily progress bar on dashboard | Medium |

---

## Execution Order

```
1. Boot app: npm run dev (SYSTEM/)
2. Verify Supabase env vars loaded
3. Phase 1: Run auth tests (testsprite_login_test_plan.md)
4. Phase 2: Run backend tests (testsprite_backend_test_plan.json)
5. Phase 3: Run frontend E2E tests (testsprite_frontend_test_plan.json TC001–TC042)
6. Phase 4: Run integration tests
7. Fill testsprite_prd_report.md with results
```

---

## TestSprite MCP Call Structure (Reference)

When running via TestSprite MCP in AntiGravity IDE, use these call patterns:

```
# Run a single test case
testsprite.run_test(file="testsprite_frontend_test_plan.json", id="TC021")

# Run all backend tests
testsprite.run_plan(file="testsprite_backend_test_plan.json")

# Generate report
testsprite.generate_report(output="testsprite_prd_report.md")
```

**Token-saving tips:**
- Run high-priority tests first (exhaust Critical/High before Medium/Low)
- Group related test cases in a single `run_plan` call where possible
- Use `testsprite.run_test` selectively for low-priority cases if tokens run low

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Mocked data still present in services | High | Audit each service file before test run |
| `ranking...` indefinite state on real data | High | Seed leaderboard with ≥2 users before running |
| VO2 Max RPC not yet implemented | Medium | Stub with placeholder; mark test as Blocked |
| Micronutrient fields missing from nutrition schema | Medium | Check `init.sql` and `NutritionPage.jsx` |
| OTP email requires SendGrid/Resend config in Supabase | High | Configure email provider in Supabase dashboard first |
| PWA service worker absent from Vite config | Medium | Add `vite-plugin-pwa` before running TC042 |
