# HTML Game AI Harness

`html-game-ai-harness` is a browser-only game template for building small, robust HTML + JavaScript games with test-first development and an AI-operable Playwright harness.

The included sample game, **Pulse Runner**, is intentionally small: move the player to the goal while avoiding hazards. The useful part is the harness around it.

## What This Template Gives You

- Browser-only HTML + JavaScript app with Vite.
- Game state and rules isolated as pure functions under `src/core`.
- `localStorage` persistence isolated under `src/platform`.
- Unit tests for deterministic state transitions.
- Playwright E2E tests that operate the game through keyboard and harness APIs.
- `window.__GAME_HARNESS__` for AI-assisted inspection, stepping, reset, snapshots, and level loading.
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
tests/unit/      Fast unit tests for stateless logic
tests/e2e/       Playwright browser verification
tests/harness/   AI-facing Playwright helpers
.github/         CI and GitHub Pages deployment
.codex/skills/   Repo-local Codex workflow skill
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
