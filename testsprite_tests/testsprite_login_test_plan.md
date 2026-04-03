# TestSprite Login & Authentication Test Plan
## SYSTEM OS — PRD v2 Auth Coverage

**Version:** 2.0 (supersedes original login_test_plan.md)
**Date:** 2026-04-03
**Runner:** TestSprite Browser Agent (Playwright)
**Base URL:** `http://localhost:5173` (swap for Vercel preview URL in CI)

---

## Prerequisites

```
Environment Variables Required:
  VITE_SUPABASE_URL         = <project URL>
  VITE_SUPABASE_ANON_KEY    = <anon key>
  SUPABASE_SERVICE_ROLE_KEY = <service role key> (for test seeding only)

Test Accounts (must exist before running):
  {{LOGIN_USER}}     = existing verified user email
  {{LOGIN_PASSWORD}} = existing user password

  NEW_USER_EMAIL     = testsprite_new_{{timestamp}}@mailinator.com
  NEW_USER_PASSWORD  = TestSprite!99

Email Provider:
  Supabase email provider must be configured (Resend or SendGrid)
  so OTP emails are deliverable to the test inbox.
```

---

## TC-AUTH-01: Supabase Env-Missing Fallback

- **Type:** Environment / Boot
- **Action:** Start the app without `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` set.
- **Expected:** The red warning box with text `"Supabase is not configured yet."` is visible on screen.
- **Priority:** High
- **Status:** Untested

---

## TC-AUTH-02: Unauthenticated Routing — Protected Routes Redirect

- **Type:** Route Guard
- **Action:** Navigate directly to `/dashboard`, `/leaderboard`, and `/shop` without a session.
- **Expected:** All three routes immediately redirect to `/auth`. The branded login UI (system.png logo, blue theme) is visible.
- **Priority:** High
- **Status:** Untested

---

## TC-AUTH-03: Invalid Credentials Rejection

- **Type:** Negative / Error Handling
- **Action:** On `/auth`, enter `wrong@email.com` and `WrongPassword123`, click ACCESS TERMINAL.
- **Expected:**
  - An error message renders natively in the UI (no blank white screen, no unhandled promise rejection).
  - Auth state remains null (user is not redirected to dashboard).
  - The login form remains visible and interactive.
- **Priority:** High
- **Status:** Untested

---

## TC-AUTH-04: Successful Login and Store Hydration

- **Type:** Happy Path
- **Action:** Enter `{{LOGIN_USER}}` and `{{LOGIN_PASSWORD}}`, submit the form.
- **Expected:**
  1. Supabase returns a valid JWT (no error in network tab).
  2. App redirects to `/dashboard`.
  3. Zustand `userStore` is populated (username visible on dashboard).
  4. Zustand `auraStore` is populated (AP score visible or > 0 on dashboard).
  5. `hydrateFromServer()` call is triggered (visible in network: Supabase queries for tasks, aura_logs, profiles).
- **Priority:** High
- **Status:** Untested

---

## TC-AUTH-05: Session Persistence Across Page Reload

- **Type:** Session
- **Action:** Log in successfully, then hard-reload the browser tab (F5 / Ctrl+Shift+R).
- **Expected:**
  - The Supabase `onAuthStateChange` listener restores the session.
  - User lands back on `/dashboard` without re-entering credentials.
  - All Zustand stores are re-hydrated.
- **Priority:** High
- **Status:** Untested

---

## TC-AUTH-06: New User Signup → Player Name Prompt

- **Type:** New User Onboarding (PRD v2)
- **Action:**
  1. Navigate to `/auth`, switch to Signup mode.
  2. Enter `NEW_USER_EMAIL` and `NEW_USER_PASSWORD`, submit.
- **Expected:**
  - After Supabase account creation, a Player Name prompt/modal is shown before the dashboard loads.
  - The prompt includes a text input pre-filled with a default name (e.g., inferred from email prefix).
  - A confirm/save button is visible.
- **Priority:** High
- **Status:** Untested

---

## TC-AUTH-07: Player Name Save Persists to profiles.username

- **Type:** New User Onboarding / Data Persistence (PRD v2)
- **Action:** Complete signup, when the Player Name prompt appears, enter `"TestSpriteUser"`, click Save.
- **Expected:**
  - The prompt closes.
  - `profiles.username` in Supabase equals `"TestSpriteUser"` for the new user.
  - The dashboard greeting references the chosen name.
- **Priority:** High
- **Status:** Untested

---

## TC-AUTH-08: Forgot Password — OTP Email Triggered

- **Type:** Account Recovery (PRD v2)
- **Action:**
  1. On `/auth`, click the "Forgot Password" link.
  2. Enter `{{LOGIN_USER}}` in the email field and submit.
- **Expected:**
  - A success message indicates an OTP has been sent (e.g., "Check your email for a reset code").
  - An OTP input field or code entry UI appears.
  - Supabase sends a password reset OTP to the email (verify via Supabase Logs or test inbox).
- **Priority:** High
- **Status:** Untested
- **Dependency:** Supabase email provider must be configured.

---

## TC-AUTH-09: OTP Valid Code Resets Password

- **Type:** Account Recovery / Happy Path (PRD v2)
- **Action:**
  1. Obtain the OTP code from the test inbox.
  2. Enter the valid OTP in the code input field.
  3. Enter a new password (`TestSpriteNew!01`), confirm and submit.
- **Expected:**
  - The password reset succeeds.
  - User is redirected to `/dashboard` or shown a "Password updated" confirmation.
  - The new password works on the next login attempt.
- **Priority:** High
- **Status:** Untested

---

## TC-AUTH-10: OTP Invalid or Expired Code Shows Error

- **Type:** Account Recovery / Negative (PRD v2)
- **Action:**
  1. Trigger the Forgot Password OTP flow.
  2. Enter an incorrect code (`000000`) in the OTP field and submit.
- **Expected:**
  - An error message is shown (e.g., "Invalid or expired code").
  - The user is NOT redirected to the dashboard.
  - The OTP input field remains available for retry.
- **Priority:** Medium
- **Status:** Untested

---

## TC-AUTH-11: Dynamic Greeting — New User Sees "Welcome"

- **Type:** Dashboard UX / Greeting Logic (PRD v2)
- **Action:** Sign up as a brand new user and land on the dashboard.
- **Expected:**
  - The greeting does NOT contain "back" (e.g., it reads "Welcome, TestSpriteUser" not "Welcome back").
  - The greeting is time-appropriate (e.g., includes "Good morning" if between 05:00–12:00).
- **Priority:** High
- **Status:** Untested

---

## TC-AUTH-12: Dynamic Greeting — Returning User After 18:00

- **Type:** Dashboard UX / Greeting Logic (PRD v2)
- **Action:** Log in as an existing returning user when the local time is between 18:00 and 21:00.
- **Expected:**
  - The dashboard greeting contains "Good evening".
- **Priority:** Medium
- **Status:** Untested
- **Note:** May require mocking system time in the test runner.

---

## TC-AUTH-13: Dynamic Greeting — Midnight Range (00:00–05:00)

- **Type:** Dashboard UX / Greeting Logic (PRD v2)
- **Action:** Log in when system time is between 00:00 and 04:59.
- **Expected:**
  - The dashboard greeting contains "Hi midnight owl" or equivalent.
- **Priority:** Low
- **Status:** Untested

---

## TC-AUTH-14: Dynamic Greeting — Early Morning (05:00–09:00)

- **Type:** Dashboard UX / Greeting Logic (PRD v2)
- **Action:** Log in when system time is between 05:00 and 08:59.
- **Expected:**
  - The dashboard greeting contains "Hi early riser" or equivalent.
- **Priority:** Low
- **Status:** Untested

---

## TC-AUTH-15: System PNG Brand Icon on Login Page

- **Type:** UI Branding
- **Action:** Navigate to `/auth` (unauthenticated).
- **Expected:**
  - The `system.png` brand icon is rendered and visible above or near the login form.
  - The image has a non-zero natural width (not broken img src).
- **Priority:** Medium
- **Status:** Untested

---

## TC-AUTH-16: Particle Effect Canvas Renders on Login Page

- **Type:** UI / Visual Effect (PRD v2)
- **Action:** Navigate to `/auth`.
- **Expected:**
  - A `<canvas>` element or WebGL/Three.js canvas is present in the DOM.
  - The canvas has non-zero width and height (particle effect is rendering).
  - Moving the mouse causes visible particle movement or hover reaction.
- **Priority:** Low
- **Status:** Untested

---

## TC-AUTH-17: Player Name Editable in Settings

- **Type:** Settings / Profile Management (PRD v2)
- **Action:** Log in, navigate to `/settings`, locate the Player Name input, change it to `"UpdatedName"`, save.
- **Expected:**
  - `profiles.username` in Supabase updates to `"UpdatedName"`.
  - The dashboard greeting or profile display reflects the new name.
- **Priority:** Medium
- **Status:** Untested

---

## Summary Table

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| TC-AUTH-01 | Env-missing fallback | High | Untested |
| TC-AUTH-02 | Unauthenticated routing | High | Untested |
| TC-AUTH-03 | Invalid credentials rejection | High | Untested |
| TC-AUTH-04 | Successful login + store hydration | High | Untested |
| TC-AUTH-05 | Session persistence on reload | High | Untested |
| TC-AUTH-06 | New user signup → Player Name prompt | High | Untested |
| TC-AUTH-07 | Player Name save → profiles.username | High | Untested |
| TC-AUTH-08 | Forgot Password → OTP email sent | High | Untested |
| TC-AUTH-09 | OTP valid code resets password | High | Untested |
| TC-AUTH-10 | OTP invalid code shows error | Medium | Untested |
| TC-AUTH-11 | Greeting: new user "Welcome" (no back) | High | Untested |
| TC-AUTH-12 | Greeting: returning user 18:00 "Good evening" | Medium | Untested |
| TC-AUTH-13 | Greeting: midnight "Hi midnight owl" | Low | Untested |
| TC-AUTH-14 | Greeting: early "Hi early riser" | Low | Untested |
| TC-AUTH-15 | System PNG brand icon renders | Medium | Untested |
| TC-AUTH-16 | Particle effect canvas present | Low | Untested |
| TC-AUTH-17 | Player Name editable in Settings | Medium | Untested |
