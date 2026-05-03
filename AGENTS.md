# AGENTS.md

## Mission

Build browser-only HTML games that can be tested, played, tuned, and verified by an AI agent without hidden manual steps.

## Core Rules

- Keep game rules in pure functions under `src/core`.
- Put browser effects, DOM updates, and `localStorage` behind small adapters.
- Write unit tests before changing game rules.
- Use Playwright for any claim about browser rendering, keyboard input, focus, layout, persistence, or level playability.
- Preserve `window.__GAME_HARNESS__` as the stable AI control surface.
- Do not add server-side runtime dependencies. Persistence must stay in `localStorage`.
- Use `PLAN.md` to keep the current game goal, loop, controls, win/fail states, progression, visual direction, stack assumptions, and milestones concrete.
- Log long-running work under `.logs/` and keep generated visual prompts under `.prompts/`.
- When adding visual assets with image generation, save the reusable prompt and intended style before or alongside the asset.

## Definition Of Done

Before finishing a game change, run:

```bash
npm run lint
npm run test
npm run eval:game
npm run build
npm run test:e2e
```

When changing level design, also add or update a Playwright test that proves the level can be completed or that the expected failure state occurs.

## Harness Workflow

1. Model first: add or update pure functions and unit tests.
2. Browser second: wire model changes into `src/main.js`.
3. Harness third: expose only stable inspection and control operations.
4. Run `npm run eval:game` and inspect `artifacts/evals/latest.json`.
5. Verify with Playwright using `tests/harness/gameDriver.js`.
6. For visual work, run `npm run artifact:browser` and inspect the saved screenshot.
7. Keep snapshots serializable so failures can be pasted into issues or PR comments.

## Eval-Driven Iteration

- Run baseline evals before broad gameplay or level changes.
- Make one focused change at a time, then re-run the eval command.
- Record the current best score, what changed, what improved or regressed, and the next hypothesis in `.logs/`.
- Do not stop at the first green test when the task is optimization; continue until the stated score threshold is met.
- If a visual or generated artifact matters, inspect the artifact directly instead of relying only on logs.

## Level Design Guidance

- Prefer deterministic levels over random-only content.
- If randomness is required, pass a seed into pure generation functions.
- Every shipped level needs an automated solvability check.
- Tune difficulty by adding fixtures in `tests/fixtures`, then test the fixture through both the model and browser.

## GitHub Pages

The app must remain static. Build output belongs in `dist/`; deployment is handled by `.github/workflows/pages.yml`.

## UI Tuning

- Treat UI polish as one small request at a time.
- Reuse existing CSS variables, layout primitives, DOM structure, and harness selectors.
- Verify the exact route and viewport in a browser before stopping.
- Keep behavior, game state, and routing unchanged unless the prompt explicitly asks for it.

## Bug Triage

- Gather bugs from GitHub issues, failing checks, Playwright reports, deploy logs, screenshots, and pasted reports.
- Sort findings P0 to P3.
- Group duplicates and keep observed evidence separate from guesses.
- Recommend the next action without editing, labeling, assigning, closing, rerunning, or posting unless explicitly approved.

## Review Guidelines

- Flag missing tests for game-rule, level, persistence, harness, or rendering changes.
- Flag risky behavior changes that bypass `src/core` pure functions or weaken `window.__GAME_HARNESS__`.
- Flag documentation gaps when `PLAN.md`, `.prompts/`, or `.logs/` should be updated.
- Flag security regressions, accidental secrets, new network calls, or server-side persistence.
