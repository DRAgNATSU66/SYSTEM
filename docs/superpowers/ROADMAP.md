# SYSTEM v2 — roadmap and checklist

Last updated 2026-10-15. Branch `redesign/system-v2`, kept local and not merged. Old UI is tagged `ui-legacy`.
Target look: [system-v2-preview.png](system-v2-preview.png), approved by the user.
Spec: [specs/2026-10-14-system-v2-redesign-design.md](specs/2026-10-14-system-v2-redesign-design.md). Transcript: [`qna.md`](../../qna.md), entries QNA-001 to QNA-005.

## Where things stand

| Phase | What it covers | Status |
|---|---|---|
| 0 | Branch, legacy tag, line endings fixed | ✅ done |
| 1 | Demo mode + screenshot gate | ✅ done |
| 2 | All colours and fonts moved onto theme variables, with no visual change | ✅ done, final review clean |
| 3 | SYSTEM v2 colour theme + theme switch | ⬜ next |
| 4 | Framed 3-column layout + Alishka dock | ⬜ |
| 5 | Chart restyle | ⬜ |
| 6 | New cards: BodyMap, Hydration, Fuel | ⬜ |
| 7 | Restyle every page + polish | ⬜ |
| — | Backend: self-hosted Supabase on the spare laptop | ⏸ deferred by the user |

## Decisions needed from the user

- [ ] **Fuel card meals list.** Recommendation: keep the macro rings, and add a "Today's meals" list in the card. Each slot shows the foods eaten, kcal and protein, using mock data for now. Option: update the preview PNG first.
- [ ] **Alishka name sent to the agent.** `CommandPage.jsx:117` sends `ai_name: 'CORE'` to the Hugging Face agent. Decide whether to change it to `'ALISHKA'`, or whether the agent side handles the name.
- [ ] **Merging.** Merge into main, open a PR, or keep the branch local (the current choice).

## Phase 3: SYSTEM v2 colour theme + theme switch

Must be done first. These come from the final review:
- [ ] Add a module-level "reloading" guard in `AuthProvider.jsx`. In dev, React runs the startup effect twice, and the second run can start a sync before the demo-data wipe finishes reloading the page.
- [ ] Fix the theme variable load order:
  - `tokens.css` loads before `index.css`, and `:root` has the same specificity as `[data-theme]`, so `index.css` would silently override new theme values.
  - Move the rank and tier hex values into `tokens.css`, built from the channel variables.
  - Use `:root[data-theme="…"]` selectors.
- [ ] Make mobile screenshots deterministic. There were two random failures: mood 0.179%, then goals/history/leaderboard up to 0.376%. Both passed on re-run.

Then:
- [ ] Add the `data-theme="system"` theme: charcoal surfaces (`#202020` / `#242425` / `#2F3132` / `#39393A`), accent `#3988FF` / `#0C49A4`, series `#3988FF` / `#27A884` / `#B65FCB`, and a deep-blue backdrop.
- [ ] Soften the rank colours: keep each rank's identity, desaturated.
- [ ] Switch the screens that use rank colours for things that aren't ranks (Goals overdue, retry buttons, Friends reject) onto neutral or status colours.
- [ ] Theme switch in Settings. It must set `<html data-theme>` and `uiStore.theme` together, because `useThemeColors` only re-reads colours when `uiStore.theme` changes.
- [ ] RankBadge: change the `${c}40` hex-alpha trick to `color-mix`, so rank colours can become theme variables. `useRankResolver` should then follow the theme.
- [ ] Fonts: Manrope (as in the preview) for headings, Inter for body text.
- [ ] Remove the global `nowrap` + ellipsis that every button and h1–h6 is forced into; make it an opt-in class instead.
- [ ] Take a new screenshot baseline for the `system` theme, and keep the `legacy` baseline for the old theme.

## Phase 4: Framed layout + Alishka dock

- [ ] Rounded glass frame over the blue backdrop.
- [ ] Sidebar with pill-shaped items and section labels. Keep the existing sections (DAILY CORE, HOBBIES, …) and progress bars. On mobile it stays a drawer.
- [ ] Top bar: "Hello, {name}", a clock pill, rank, score and AP.
- [ ] **Alishka dock** on the right. It replaces every "CORE" label for the AI (Command page, placeholders, status text); "Daily Core", the AP category, keeps its name.
  - Uses the same `commandStore` as the Command page.
  - Quick chips: status, critique, commend, timer.
  - Replies are mock for now.
  - Collapses below 1280px and is hidden on `/command`.
- [ ] The `260px` sidebar rule is load-bearing; replace it only when the new layout rebuild lands.

## Phase 5: Charts

- [ ] `src/theme/chartTheme.js`: dark rounded tracks, white ring-dot markers, a gradient on the active bar, a dashed average line with a pill label, a tooltip card, smooth two-series lines, and `SegmentedBar`.
- [ ] Apply it to RadarChart, SubRadar, DomainPieChart, APTrendChart, WeeklyBarChart and CalendarHeatmap.
- [ ] Add the Daily score and Sleep vs mood charts, as in the preview.

## Phase 6: New cards

- [ ] **BodyMap** on Workout + Dashboard.
  - Uses `react-muscle-highlighter@1.2.0` (MIT). It was checked while making the preview: the paths render.
  - Volume comes from the real `workoutStore.logs`, split into three intensity levels. 7/30-day toggle; tapping a muscle shows its stats.
  - Pure helpers in `src/utils/bodyMap.js`, with `node --test` tests.
- [ ] **Hydration** on Nutrition + Dashboard. Silhouette fill from the real `metricsStore` water value; the glasses row adds water through the existing store.
- [ ] **Fuel** on Nutrition + Dashboard. Real macros from `metricsStore`; meals come from a new mock `mealStore`, with the meals list if approved. Helpers in `src/utils/nutritionViz.js`, with tests.

## Phase 7: Restyle every page + polish

- [ ] Restyle each page in parallel groups, one worktree per group. Create the worktrees by hand from `redesign/system-v2`: the Agent tool's worktree option starts from `main`.
- [ ] Before/after review pairs, legacy vs system theme, for every page.
- [ ] Final review of the whole branch; `qna.md` entries for each phase.

## Backend (deferred): self-hosted Supabase on the spare laptop

Full context is in memory (`server-laptop-migration`). Checklist:
- [ ] The user installs Ubuntu Server 26.04 with OpenSSH, then gives SSH access.
- [ ] Copy the setup from this laptop and Gojo: passwordless sudo, key-only SSH, Docker, nvm, pyenv, gh, Tailscale, ufw.
- [ ] Laptop-as-server settings: ignore lid close, cap battery charge at 60–80%, lm-sensors, unattended upgrades with a weekly reboot.
- [ ] Self-hosted Supabase with Docker Compose. Restore the paused cloud project first to `pg_dump` everything, including `auth.users`.
- [ ] Nightly `pg_dump` to Gojo; access through a Cloudflare Tunnel or Tailscale.
- [ ] Point `frontend/.env` at the new server URL and keys.
- [ ] Separately: the sync bugs live in `frontend/src/services/syncEngine.js`; changing hosts won't fix them.

## Housekeeping

- [ ] `CURRENT_PROJECT_AUDIT.md` is untracked in the repo root: commit it or delete it.
- [ ] Lint has 20 errors and 3 warnings that existed before this work.
- [ ] Gojo's checkout still has CRLF line endings on disk; they fix themselves on its next `git pull` / checkout.
- [ ] Tidy-ups for later: `getAPColorPale` is unused, `getAPColorHex` duplicates `getAPColor`, `SettingsPage.jsx:~306` builds invalid CSS (`${COLORS[type]}50`), and `scripts/unmapped-G1.txt` still lists deleted three.js files.

## Resuming in a new chat

Paste this:
> Continue the SYSTEM v2 redesign. Read `docs/superpowers/ROADMAP.md`, the spec, and the memory `system-v2-redesign`. Start phase 3 with the three must-do-first items.
