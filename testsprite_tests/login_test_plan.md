# 🔐 TestSprite Login Implementation Plan

## Objective
Verify the complete authentication flow for the SYSTEM OS. The application enforces a strict "no guest mode" policy. This test ensures the auth wall securely gates the application and properly handles Supabase authentication states.

## Prerequisites
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be populated in the test runner environment.
- A valid test user (`NATSU@example.com` / `tesst123`) must exist in the mock/local Supabase instance.

## Test Cases

### TC-AUTH-01: Verify Environment Missing Fallback
* **Action**: Boot the app without `.env` variables.
* **Expected Result**: The app should display the red warning box: "Supabase is not configured yet." 
* **Status**: 🔴 Un-tested

### TC-AUTH-02: Unauthenticated Routing
* **Action**: Attempt to navigate directly to `/dashboard` or `/leaderboard` without a session.
* **Expected Result**: Immediate redirect to `/auth`. The screen should display the `system.png` branded blue-themed login UI.
* **Status**: 🔴 Un-tested

### TC-AUTH-03: Invalid Credentials Rejection
* **Action**: Enter invalid email/password combinations and click "ACCESS TERMINAL".
* **Expected Result**: Error message rendered natively in the UI (no blank screens). Auth state remains null.
* **Status**: 🔴 Un-tested

### TC-AUTH-04: Successful Login & Data Hydration
* **Action**: Enter `NATSU@example.com` and `tesst123`, then submit.
* **Expected Result**: 
  1. Supabase returns a valid JWT.
  2. Application redirects to `/dashboard`.
  3. Zustand `userStore` and `auraStore` fire `hydrateFromServer()`.
* **Status**: 🔴 Un-tested

### TC-AUTH-05: Session Persistence
* **Action**: Reload the browser tab after a successful login.
* **Expected Result**: `onAuthStateChange` listener restores the session without requiring re-login.
* **Status**: 🔴 Un-tested