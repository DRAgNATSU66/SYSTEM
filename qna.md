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
