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

## Definition Of Done

Before finishing a game change, run:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

When changing level design, also add or update a Playwright test that proves the level can be completed or that the expected failure state occurs.

## Harness Workflow

1. Model first: add or update pure functions and unit tests.
2. Browser second: wire model changes into `src/main.js`.
3. Harness third: expose only stable inspection and control operations.
4. Verify with Playwright using `tests/harness/gameDriver.js`.
5. Keep snapshots serializable so failures can be pasted into issues or PR comments.

## Level Design Guidance

- Prefer deterministic levels over random-only content.
- If randomness is required, pass a seed into pure generation functions.
- Every shipped level needs an automated solvability check.
- Tune difficulty by adding fixtures in `tests/fixtures`, then test the fixture through both the model and browser.

## GitHub Pages

The app must remain static. Build output belongs in `dist/`; deployment is handled by `.github/workflows/pages.yml`.
