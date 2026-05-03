# HTML Game AI Harness

`html-game-ai-harness` is a browser-only game template for building small, robust HTML + TypeScript games with test-first development and an AI-operable Playwright harness.

The included sample game, **Pulse Runner**, is intentionally small: move the player to the goal while avoiding hazards. The useful part is the harness around it.

## What This Template Gives You

- Browser-only HTML + TypeScript app with Vite.
- Typed contracts for levels, actions, game state, snapshots, and `window.__GAME_HARNESS__`.
- Game state and rules isolated as pure functions under `src/core`.
- `localStorage` persistence isolated under `src/platform`.
- Unit tests for deterministic state transitions.
- Playwright E2E tests that operate the game through keyboard and harness APIs.
- `window.__GAME_HARNESS__` for AI-assisted inspection, stepping, reset, snapshots, and level loading.
- `PLAN.md`, `.logs/`, and `.prompts/` for long-running Codex game sessions.
- Machine-readable eval reports with `npm run eval:game`.
- Browser screenshot artifacts with `npm run artifact:browser`.
- GitHub Actions CI for lint, unit tests, build, and browser tests.
- GitHub Pages deployment workflow for static hosting.
- `AGENTS.md`, Codex skill, and git hook scaffolding for repeatable AI development.

## Local Setup

```bash
npm install
npm run check
npm run dev
```

Open the local URL printed by Vite.

## Project Layout

```text
src/core/        Pure game rules, levels, deterministic RNG
src/platform/    Browser adapters such as localStorage
src/global.d.ts  Browser harness global contract
tests/unit/      Fast unit tests for stateless logic
tests/e2e/       Playwright browser verification
tests/harness/   AI-facing Playwright helpers
.github/         CI and GitHub Pages deployment
.codex/skills/   Repo-local Codex workflow skill
.logs/           Iteration logs and eval summaries
.prompts/        Reusable image-generation prompts
artifacts/       Generated eval and browser artifacts
```

## Deployment

Enable GitHub Pages in the repository settings with **Source: GitHub Actions**. The `pages.yml` workflow builds `dist/` and deploys it on pushes to `main`.

## AI Harness Contract

At runtime the page exposes:

```js
window.__GAME_HARNESS__
```

The harness supports:

- `snapshot()` returns serializable game state and visible board metadata.
- `dispatch(action)` applies a game action.
- `press(key)` applies a keyboard-equivalent move.
- `reset(seedOrState?)` starts a deterministic run.
- `loadLevel(level)` swaps in a custom level object for level-design tests.

This means an AI can change code, run deterministic unit tests, open the browser, inspect the actual game, make moves, and verify that the browser behavior matches the pure model.

## Codex Workflow

Start new games by editing `PLAN.md`. For hard level or algorithm work, run `npm run eval:game` before and after each focused change and compare `artifacts/evals/latest.json`. For visual work, save reusable image prompts under `.prompts/`, run `npm run artifact:browser`, and inspect the screenshot before stopping.
