# PLAN.md

## Game

Pulse Runner is a browser-only grid game used as a seed project for AI-assisted game development. The sample is small by design: it proves the loop, controls, persistence, testing, Playwright harness, evals, and GitHub Pages deployment.

## Player Goal

Move the player from the start tile to the pulse gate while avoiding hazards and minimizing moves.

## Main Loop

1. Render the current level.
2. Accept keyboard or harness input.
3. Apply a pure state transition.
4. Render the new state.
5. Persist best scores in `localStorage`.
6. End in win or fail state, or continue playing.

## Inputs And Controls

- Arrow keys and WASD move one tile.
- Reset restarts the current level.
- Next advances through deterministic levels.
- Seeded Run creates a deterministic generated level.
- `window.__GAME_HARNESS__` mirrors those controls for Playwright and AI agents.

## Win And Fail States

- Win: player reaches the goal tile.
- Fail: player enters a hazard tile.
- Wall collision: player stays in place and receives feedback.

## Progression And Difficulty

- Shipped levels must be deterministic and solvable.
- New levels require unit-level validation and browser-level playability checks.
- Seeded levels must be reproducible for debugging.

## Visual Direction

Clear arcade board, high contrast tiles, readable HUD, no decorative complexity until a specific game concept needs it.

## Stack And Hosting

- Static HTML + JavaScript.
- Vite build.
- Vitest for model tests.
- Playwright for browser checks and artifacts.
- `localStorage` only for persistence.
- GitHub Actions for CI.
- GitHub Pages for deployment.

## Milestones

1. Keep the template green: `npm run check`.
2. Replace or expand the sample game only after defining the new game loop here.
3. Add reusable visual prompts under `.prompts/` before generating asset batches.
4. Add deterministic eval metrics for any hard game-logic or level-design task.
5. Use PR review and bug triage templates before merging larger game changes.
