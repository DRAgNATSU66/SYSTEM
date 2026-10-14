# QNA transcript — SYSTEM

A stenographic record of significant changes, written at the time each change is made. It is **append-only**: past entries are never edited, and a correction is filed as a new entry that supersedes the old one, with each entry pointing to the other. It is **non-blocking**: nothing here gates a merge, commit or push. Measured numbers are recorded as measured.

What gets logged: changes spanning more than 3 files; routing, orchestration, agent or model-registry changes; model or dataset swaps; schema and migrations; anything that will be claimed in a paper or demo.

---

## QNA-001 — LF line-ending normalisation

- **Date:** 2026-10-14
- **Commit:** `f10d240` on `redesign/seren`

**Q1. What did this change do, mechanically?**
- It added `.gitattributes` with `* text=auto eol=lf`, and marked binary image and font types as `binary`.
- Before the commit, `git ls-files --eol` reported 219 tracked files as `i/lf w/crlf`: LF in the index, CRLF on disk. Each was rewritten to LF with `sed -i 's/\r$//'`.
- The index content is unchanged: after `git add -u`, `git diff --cached | wc -l` returned `0`.

**Q2. Why do this, rather than leave the 219 "modified" files alone?**
- They buried every real change. `git status` showed 219 modified files whose diff vanished under `git diff --ignore-cr-at-eol` (empty).
- The redesign touches dozens of the same files, so reviewing its diffs would have been impractical.
- The rejected alternative was `core.autocrlf` per machine. That is per-clone config, so it doesn't travel with the repo. `.gitattributes` does.

**Q3. Blast radius if this is wrong?**
- Low. Only line terminators changed, and there was no content change in the index.
- Files that genuinely need CRLF, such as Windows `.bat` scripts, would break. The repo has none: `git ls-files '*.bat' '*.cmd'` returns nothing.
- Gojo's checkout of `~/dev/system` still has CRLF on disk. It converges on its next `git pull` / checkout.

**Q4. How is it verified?**
- `git ls-files --eol | awk '{print $2}' | sort | uniq -c`: before, `219 w/crlf, 51 w/lf`; after, `270 w/lf`.
- `git diff --cached | wc -l` is `0`.

**Q5. Defence: "You rewrote 219 files in one commit — how do we know nothing else changed?"**
- The commit contains exactly one file, `.gitattributes` (`git show --stat f10d240`).
- The 219 rewrites never reached the index, because the index already held LF. That is shown by the zero-line staged diff above.

---

## QNA-002 — Seren redesign: approach and spec

- **Date:** 2026-10-14
- **Commit:** the commit adding `docs/superpowers/specs/2026-10-14-seren-redesign-design.md`

**Q1. What is being built?**
- A visual re-theme of the frontend after the SerenIQ Dribbble shot: a framed 3-column shell, charcoal surfaces, a `#3988FF` accent, and new chart styling.
- Three new cards: BodyMap, Hydration and Food.
- Every existing feature is kept. Full detail is in the spec.

**Q2. Why tokens first (approach A) rather than restyling each module directly?**
The audit on 2026-10-14 found:
- the accent hard-coded as `rgba(0,191,255,…)` 356 times
- about 175 hex colours in CSS and about 89 in JS/JSX
- about 1,230 `rgba()` literals in CSS
- about 180 literal `'Outfit'` declarations
- 176 inline `style={{}}` blocks, about 110 of them carrying colour
- the rank palette duplicated in 4 places

Restyling module by module would edit all of those by hand and still leave no way back to the old look. With tokens first, the legacy look survives as `data-theme="legacy"` and the new look becomes a value swap.

**Q3. Blast radius?**
- Phase 2 (the token migration) touches nearly every CSS module and about 110 JSX inline styles.
- Mistakes show up as colour regressions. The gate is a Playwright pixel diff against the legacy baseline, with ≤0.1% changed pixels per route.
- No store, service or sync code changes. The exception is demo mode in `AuthProvider`, which is gated on `import.meta.env.DEV`.

**Q4. Verification?**
- `npm run build` and `npm run lint` after every phase, with no new lint errors compared with the phase-1 baseline count.
- Playwright screenshots of every route at 1440×900 and 390×844.
- `node --test` for the new pure helpers in `bodyMap.js` and `nutritionViz.js`.

**Q5. Defence: "Why are the hydration, food and body-map cards not mock, when the brief said mock?"**
- The data already exists and already syncs:
  - `metricsStore` has `water` (3000 ml) and the macros `pro`, `carb`, `fat`, `cal`
  - `workoutStore.logs` is keyed by date, muscle group and subgroup
- Only fields with no store today are mock: the meal list (new `mealStore`), glass size, and the Command dock replies.

---

## QNA-003 — Dev-only demo mode and screenshot pixel-diff gate

- **Date:** 2026-10-14
- **Commits:** `4bf515c`, `11a07b9`, `2db7e36`, `b57847e`, `a4917ec` on `redesign/seren`

**Q1. What do these commits do, mechanically?**

Demo mode:
- `frontend/src/utils/demoSeed.js` builds 14 days of aura, score, metrics and workout data from a seeded PRNG (mulberry32, seed 42). The output is a pure function of the clock passed in.
- `src/services/demoFlag.js` defines `IS_DEMO = import.meta.env.DEV && VITE_DEMO_MODE === 'true'`. When it is set:
  - `supabaseClient.js` exports `null`
  - `AuthProvider.jsx` seeds empty stores through `demoMode.applyDemoState()`, logs in `DEMO_USER`, and returns before any Supabase code

The screenshot gate:
- `frontend/scripts/shots.mjs` starts Vite in demo mode and screenshots 17 routes at 1440×900 and 390×844 in system Chrome, through `playwright-core`.
- `scripts/shotdiff.mjs` pixel-diffs two runs with pixelmatch (threshold 0.1) and fails any route over 0.1% changed pixels, or any size mismatch, missing file or extra file.

**Q2. Why a demo mode and a pixel gate, rather than unit tests?**
- The Supabase cloud project is paused, so the app could not be entered at all.
- There is no unit-test framework in `frontend/package.json`.
- The next phase moves about 356 accent literals onto tokens. The only claim that matters is "nothing looks different", and a pixel diff of every route tests that claim directly. Unit tests would not.
- `IS_DEMO` requires `import.meta.env.DEV`, which Vite statically sets to false in production builds. The verification build found 0 occurrences of `demo@system.local` in `dist/assets/*.js`, so the demo code is tree-shaken out.

**Q3. Blast radius?**
- The only production-path changes are the `IS_DEMO` checks in `supabaseClient.js` and `AuthProvider.jsx`, and both are constant-false in production.
- No page needed a null-`supabase` guard: `errors.json` was `{}` for every route.
- The harness changes nothing in the app. All its determinism measures run inside the browser page only:
  - a `Date` shifted to `2026-10-14T10:30:00Z` plus elapsed time
  - seeded `Math.random` and `crypto.getRandomValues`
  - UTC timezone and `en-US` locale
  - hidden GIFs, animations off, a warm-up load, waiting for fonts
  - un-clipping `.content-area` so the full page height is captured
  - the mobile drawer seeded closed

**Q4. How is it verified? (as measured)**
- `npm test`: 5/5 pass.
- `npm run build`: passes.
- Lint: `✖ 23 problems (20 errors, 3 warnings)`, the same as the pre-change baseline.
- Determinism, measured with two clean captures in a row (`legacy` against `check`) after the final harness commit `a4917ec`:
  - desktop 0.000% on all 17 routes
  - mobile max 0.030% (shop); command, duels, habits and leaderboard 0.005%; the rest 0.000%
- Earlier rounds measured residuals of up to 0.068% (desktop/shop, before the fixes for font loading and full-page capture). The harness is **not bit-exact**. Its noise floor uses up to about a third of the 0.1% budget.
- Desktop full-page heights now reach 3508 px (workout) and 3436 px (settings). Before fix round 1, every capture was clipped to 900 px by the inner-scrolling `.content-area`.

**Q5. Defence: "What can this gate not see?"**
These are recorded as known blind spots in the Task 3 report:
- hidden GIF images
- animation end-states and hover/transition colours (animations are disabled)
- anything the layout un-clip overrides (`height` and `overflow` on html, body, #root, .app-layout, .content-area)
- small per-pixel colour drift under pixelmatch's 0.1 threshold
- regressions smaller than about 0.1% of a page (around 5k px on a 1440×3508 capture)
- dependence on Google Fonts loading over the network

For a colour-token migration, the main risk is a wrong colour on a large surface or on text, and that is well above these limits.

**Process note, recorded verbatim:** during Task 3 an implementer subagent killed two `chrome_crashpad_handler` processes that belonged to the user's own Chrome session on localhost:8765. Only Chrome's crash reporter was affected. This was disclosed to the user, and later dispatches restrict process kills to PIDs the agent started itself.

---

## QNA-004 — Colour and font token migration (phase 2), pixel-identical

- **Date:** 2026-10-14
- **Commits:** `b210ec9`, `b2b4fbf`, `9c9e98f`, `f1b68da`, `6297d75` and `72ee2a5` (merged as `da38fe4` and `7014f07`), `96d72c3` on `redesign/seren`

**Q1. What changed, mechanically?**
- `frontend/src/theme/tokens.css` defines a `legacy` token set as RGB channel triples, so alpha variants survive, for example `--accent-rgb: 0 191 255`. Channel tokens are also defined for the rank and AP-tier colours (`--rank-*-rgb`, `--tier-*-rgb`).
- `frontend/scripts/tokenize-css.mjs` is a tested codemod (12 `node --test` cases). It rewrote every CSS file:
  - Task 5 made 1,460 replacements: accent 339, accentHi 4, fg 653, shade 278, fontDisplay 180, fontBody 6.
  - Task 6b made 87 more for rank and tier alphas.
  - Lines that define a rank or tier token are protected, so rank colours never get coupled to the accent.
- JS/JSX colours now go through `src/theme/palette.js`:
  - `rgbVar()` for inline styles
  - `useThemeColors()` for SVG and Recharts attributes, which don't reliably resolve `var()`
- Dead `App.css` and the `components/three/*` components were deleted, and the `three` and `@react-three/fiber` dependencies uninstalled.

**Q2. Measured before and after** (`git grep` over `frontend/src`, `ui-legacy` against `96d72c3`):

| Literal | Before | After |
|---|---|---|
| `rgba(0,191,255,…)` | 356 | 1 (a test fixture string) |
| `'Outfit'` / `"Outfit"` | 184 | 1 (the `--font-display` definition) |
| `#00BFFF` / `#00CFFF` hex | 27 | 8 (token definitions and comments, plus 2 project colours in `ProjectsPage.jsx` deliberately kept because they are saved as user data and would leak `var()` strings into Supabase rows) |

**Q3. Why channel tokens and a codemod, rather than hand edits or plain hex tokens?**
- Plain hex tokens can't express `rgba(0,191,255,0.12)`, and the accent appears at dozens of alpha steps. `rgb(var(--accent-rgb) / 0.12)` renders the same colour and lets one variable re-theme every step.
- A codemod under test is repeatable and reviewable. 1,547 hand edits would be neither.

**Q4. How was "no visual change" verified? (numbers as measured)**
- The Playwright gate (QNA-003) ran after every task. The final combined run on `7014f07`: 34/34 routes within 0.1%, maximum 0.005%, 0 page errors.
- Tests: 21/21 pass.
- Lint: `✖ 23 problems (20 errors, 3 warnings)`, the same as the pre-change baseline at every task.
- **Flakes, recorded verbatim.** On code that was otherwise identical, two runs breached the threshold on mobile, and re-runs passed:
  - Task 6b: mobile/mood 0.179%
  - Task 10: mobile goals 0.131%, history 0.376%, leaderboard 0.193%

  The gate's mobile captures are not fully deterministic. The policy adopted: re-run once, and treat a route that fails twice as real.

**Q5. What turned out wrong?**
- The spec called `.app-layout aside { width: 260px }` a stale rule to delete. Measurement disproved that: removing it pushed all 17 desktop routes to 0.291–1.573% changed pixels. The rule stays, and the spec now carries a correction.
- Removing `three` did not shrink the bundle. `index-BRU7rKMb.js` was 1,226,326 bytes before and after, because the dead components were never bundled.

**Q6. Defence: "How do you know a rank colour didn't silently become the accent?"**
- The codemod's protected-line rule skips any line that defines `--rank-`, `--color-` or `--tier-`. That is tested in `scripts/__tests__/tokenize-css.test.mjs`.
- No rule maps `rgba(0,207,255,a)` or `#9E9E9E` to a rank token. Both values are ambiguous, which is also tested.
- `#00CFFF` in JS was classified case by case, and each decision is in the Task 6/7/8 reports:
  - chart series and the mood wave → accent-hi
  - the leaderboard first-place colour and the rank resolver → `--rank-alpha`

---

## QNA-005 — Corrections to QNA-003 and QNA-004; demo-residue purge

- **Date:** 2026-10-15
- **Commit:** `cb39776` on `redesign/seren`, plus the corrections below

This entry **supersedes** parts of QNA-003 and QNA-004, as listed below. The originals stay as written. Each correction comes from the whole-branch review on 2026-10-15.

**Q1. Which earlier claims were wrong or overstated?**

*Supersedes the title of QNA-004 and its Q4 wording ("pixel-identical"):* the accurate claim is **value-identical CSS by codemod, and perceptually identical within the gate**.
- The reviewer re-ran `tokenizeCss()` on every base CSS file. Every changed CSS file at head equals the codemod output byte for byte. The exceptions are the two deleted files and the added `@import` line in `index.css`.
- The gate itself, however, allows up to 0.1% changed pixels per route. pixelmatch at `threshold: 0.1` cannot see small colour shifts: `#00BFFF` against `#00CFFF` is a YIQ delta of about 64, under its tolerance. For hand-edited JS, the protection was review, not the gate.
- Font fallbacks also changed. `font-family: 'Outfit'` became `var(--font-display)` = `'Outfit', sans-serif`, so if Google Fonts fails to load, the fallback is now sans-serif instead of the browser default. The two are identical only when the font loads.

*Supersedes QNA-004 Q2 (what the 8 remaining hex literals are):* the count of 8 is correct, but the list was incomplete. It also includes:
- `Sidebar.jsx:43` `#00BFFF`, a live UI colour kept as hex because ProgressBar appends a hex alpha (`${color}44`)
- `studyStore.js:35`, the default subject colour, which is persisted and synced

*Supersedes QNA-004 Q6 wording:* the codemod protects lines that **start with** a `--rank-`, `--color-` or `--tier-` definition (`^\s*--(rank|color|tier)-`), not every line that defines one. In this codebase the two are equivalent, but the original wording overstated the rule.

*Supersedes QNA-003 Q3 ("the only production-path changes are the IS_DEMO checks"):* that was true for those commits, but incomplete. Demo mode wrote into the **real** persisted store keys (`antigravity-*`) and the `system-sync-queue`, and nothing removed them. In a later non-demo session in the same browser, a real sign-up's `seedServerFromLocal` could have upserted about 14 days of fake aura and score rows under the real user id. Through the `trg_aura_logs_sync_total_ap` trigger, that would have meant around 60k fake AP on the shared leaderboard. A demo `profiles` UPSERT would also have sat in the queue as a poison item. This was a dev-only path, and no production user could be affected. The fix is Q2.

*Supersedes the QNA-003 Q5 blind-spot list:* it also omitted:
- `/auth`, which is not in the gate's routes even though `Auth.module.css` changed in 160 lines
- modals and forms (HistoryModal, TaskForm, HobbyForm, Top5ProfileCard)
- the open mobile drawer
- empty and error states, and the ErrorBoundary screen

**Q2. What does `cb39776` do?**
- New `frontend/src/utils/demoResidue.js`:
  - `markDemoSeeded(storage)` sets `system-demo-seeded`
  - `purgeDemoResidue(storage)` removes the marker, `system-sync-queue` and every `antigravity-*` key when the marker is present, and returns true
- `applyDemoState()` sets the marker.
- `AuthProvider` runs the purge right after the `IS_DEMO` branch, before any Supabase call. When something was purged, it reloads once so the in-memory stores rehydrate empty.
- Both storage accesses are wrapped in try/catch.

**Q3. Why purge, rather than make the sync engine demo-aware?**
- The phase-2 plan forbids changes to sync code.
- The purge closes both leak paths (store seeding and the queue) at one choke point that runs before any sync can start.
- `useCloudSync` cannot flush first. It lives in `App`, which renders only inside `ProtectedRoute`, which returns null while `authLoading` is true. On the purge path, `authLoading` never becomes false before the reload.

**Q4. Verification (as measured)**
- `demoResidue.test.js` (RED: module not found → GREEN). No marker means nothing is removed. With the marker, the marker, queue and `antigravity-*` keys are removed, while `sb-xyz-auth-token` and `theme` are kept.
- Full suite 24/24. Build passes. Lint `✖ 23 problems (20 errors, 3 warnings)`, unchanged.
- `dist` grep: `system-demo-seeded` = 1 (the purge is production code, as intended), `demo@system.local` = 0.
- Gate: all 34 routes within threshold, max 0.005%.

**Q5. What residual risk is known?**
React StrictMode runs effects twice, and only in dev. The first run purges and calls `reload()`. The second run sees no marker, so if a real Supabase session exists it can start `getSession` → `handleUserLogin` → `pullAllData` with the still-in-memory demo stores during the sub-second window before the page unloads. This is dev-only and needs both an existing session and that race. It is parked as the first fix of phase 3: a module-level "reloading" guard of about 2 lines.
