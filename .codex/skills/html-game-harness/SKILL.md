---
name: html-game-harness
description: Use for developing browser-only HTML games in this repository with pure game-rule tests, Playwright verification, and the runtime AI harness.
---

# HTML Game Harness

Use this skill whenever modifying the game, levels, rendering, persistence, or tests.

## Workflow

1. Read `AGENTS.md`.
2. Put deterministic rules in `src/core`.
3. Add or update Vitest tests in `tests/unit` before changing behavior.
4. Keep DOM and storage code thin.
5. Use `tests/harness/gameDriver.js` for Playwright tests.
6. Run `npm run check` before delivery.

## Harness Requirements

The page must expose `window.__GAME_HARNESS__` with:

- `snapshot()`
- `dispatch(action)`
- `press(key)`
- `reset(seedOrState?)`
- `loadLevel(level)`

Do not expose unstable internal DOM nodes through the harness.
