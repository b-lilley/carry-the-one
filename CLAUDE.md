# Carry the One

A daily mental math puzzle in the spirit of Wordle. The user built it to rebuild mental arithmetic skills they've lost since school. They're also using it to learn modern web development (TypeScript, Vite, MVC structure, later React). The project folder lives inside their `job-search` directory, so keeping it portfolio-quality matters.

## Working with the user

- They are learning as they go. Explain what a step does and why before (or while) doing it, and prefer showing the commands so they can run them. Ask before doing large changes for them; they sometimes want to do the steps themselves.
- They use VS Code with the Claude Code extension, Homebrew, Node (installed via Homebrew), git, and the GitHub CLI (`gh`, logged in as `b-lilley`).
- Give shell commands with absolute paths or a `cd` into this folder first. They often have another project (`python_practice`) open in a terminal.

## The game (current behavior, keep it intact through the refactor)

- **Daily six:** six problems per day, seeded from the local date (`YYYY-MM-DD`), so everyone gets the same set. Lineup: Add L2, Subtract L2, Multiply L1, Percent L2, Shortcut (L1 or L2), then Multiply L3 or Divide L3. Puzzle number counts from 2026-01-01 = No. 1.
- **Hints:** three tries per problem. The number of empty tiles equals the answer's digit count. Each guess is graded digit by digit, aligned by place value: hit (green), near (amber, digit elsewhere in the answer, duplicates counted), miss (grey), plus a too-high/too-low arrow. The keypad colors digits by best-known status.
- **Scoring:** 3/2/1 points for solving on try 1/2/3, 0 for a miss; max 18. Share line uses 🟩🟨🟧🟥 and includes score and time. The timer counts only while the daily game is visible and started.
- **The shortcut:** after each problem, a step-by-step mental math tip built from that problem's actual numbers. Tips must be correct and clearly worded. The user caught confusing wording in the "square a number ending in 5" tip, which was then rewritten. Every tip should end with the correct answer in bold.
- **Practice mode:** topics Mixed, Add, Subtract, Multiply, Divide, Percent, Shortcuts; levels Warm-up / Steady / Stretch (1–3); session stats (done, first-try %, streak, average time).
- **Storage:** everything in `localStorage` under `carry-the-one.v1` (history by date, today's in-progress daily state, best practice streak). Every read and write is wrapped in try/catch.
- **Design:** graph-paper background, Big Shoulders Display (wordmark and expressions), IBM Plex Mono (digits and labels), Instrument Sans (body) from Google Fonts. Colors are CSS custom properties with light and dark themes. Mobile-first single column, max width 480px.

## Current state

- All code is still in one file, `index.html` (inline `<style>` and `<script>`, no dependencies).
- GitHub repo: `b-lilley/carry-the-one` (public). `main` was pushed with the single-file version.
- **GitHub Pages is not enabled yet.** Once the Vite build exists, enable it with the GitHub Actions source (not "deploy from branch"), because the site will be built into `dist/`.
- Working branch: `refactor-modules`. `package.json` exists (uncommitted) with `"type": "module"` and scripts `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `test`. Dependencies are **not installed yet**.

## Refactor plan

Phase 1 (in progress): Vite + TypeScript + Vitest, MVC-style modules.

1. ~~`npm init -y`, set scripts and `"type": "module"`~~ (done)
2. `npm install -D vite typescript vitest`
3. `tsconfig.json`: target ES2022, module ESNext, moduleResolution bundler, lib ES2022 + DOM, `strict: true`, `noEmit: true`, `skipLibCheck: true`, include `src` and `tests`.
4. `vite.config.ts` with `base: '/carry-the-one/'`. Required: the site is served from `b-lilley.github.io/carry-the-one/`, and without it the built page loads blank.
5. `.gitignore`: `node_modules/`, `dist/`.
6. Move the `<style>` contents to `src/styles.css` and the `<script>` contents to `src/main.ts` (importing the CSS). `index.html` keeps the `<head>` and `<div id="app">` and loads `<script type="module" src="/src/main.ts">`.
7. Confirm `npm run dev` runs the game unchanged, then add types (`Problem`, `Round`, daily state) and split into modules:

```
src/
  main.ts                 wires everything up
  model/                  pure logic, no DOM
    rng.ts                hash + mulberry32 seeded random
    generators.ts         problem generators and tips (add, sub, mul, div, pct, special)
    grading.ts            digit grading, scoring, share marks
    daily.ts              buildDaily, todayKey, puzzleNo
    stats.ts              streaks, distribution
    storage.ts            localStorage load/save
  controller/game.ts      state + actions: press, submit, next, mode/category/level changes
  view/                   header, ladder, sheet, keypad, overlays (render from state only)
  styles/                 tokens.css (theme), components.css
tests/                    Vitest tests for generators (every tip ends with the right answer, answers are integers, digit counts) and grading
.github/workflows/deploy.yml   build and publish dist/ to Pages
```

8. Merge to `main` only when the build, tests and deploy work.

Phase 2 (later): replace `view/` (and the render/event parts of `controller/`) with React + TypeScript. `model/` should not need to change. React was chosen over Svelte for job-market value.

## Commands

```bash
npm run dev       # local dev server with live reload (http://localhost:5173/carry-the-one/)
npm run build     # type-check, then build to dist/
npm run preview   # serve the built dist/ locally
npm test          # Vitest
```
