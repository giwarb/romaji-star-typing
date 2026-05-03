# Harness Design

This repository treats the game as three layers:

1. Pure model functions in `src/core`.
2. Browser adapters for rendering, events, and persistence.
3. Playwright and `window.__GAME_HARNESS__` for external operation.
4. Eval scripts and generated artifacts for long-running improvement loops.

## Why This Helps AI Game Development

AI agents are good at iterating when they can observe failures cheaply and deterministically. The template therefore makes the model testable without a browser, then confirms the real browser separately.

## Stable Browser Contract

The browser harness is intentionally small:

- `snapshot()` provides serializable state.
- `dispatch(action)` applies model actions.
- `press(key)` mirrors keyboard input.
- `reset(seedOrState?)` restores deterministic states.
- `loadLevel(level)` verifies custom level design in the real UI.

Playwright tests should use `tests/harness/gameDriver.js` instead of reaching directly into DOM details.

## Recommended Test Ladder

1. Unit tests for pure rules.
2. Unit tests for deterministic level generation.
3. Storage adapter tests with fake storage.
4. `npm run eval:game` for machine-readable level and harness scoring.
5. Playwright smoke test for rendering.
6. Playwright playability test for each shipped level.
7. Browser screenshot artifacts for visual changes.
8. Optional visual regression checks once art direction stabilizes.
