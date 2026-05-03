# Codex Game Development Workflows

This repo follows the OpenAI Codex game-development collection:

- Start from a concrete `PLAN.md`.
- Use Playwright to play and inspect the real browser build.
- Save image-generation prompts under `.prompts/`.
- Run hard game logic as an eval-driven improvement loop.
- Keep a running log under `.logs/`.
- Use bug triage and PR review guidance before merge.

## First Playable Loop

Before replacing the sample game, update `PLAN.md` with:

- player goal
- main loop
- controls
- win and fail states
- progression and difficulty
- visual direction
- stack and hosting assumptions
- milestone order

Then implement the smallest playable loop and verify it with:

```bash
npm run check
```

## Granular UI Loop

Use one UI note at a time. Name the exact surface, target change, viewport, and expected validation.

```text
Make this UI change in the existing game: [exact spacing, alignment, color, copy, responsive, or state adjustment].
Change only the files needed. Reuse existing CSS, DOM patterns, and harness selectors.
Start or reuse the dev server, inspect the UI in the browser, make the smallest patch, and verify the same viewport again.
Stop after this one change and summarize files changed plus the browser check.
```

## Eval-Driven Logic Loop

For hard level-design or game-algorithm work:

1. Run `npm run eval:game` on the baseline.
2. Inspect `artifacts/evals/latest.json`.
3. Make one focused change.
4. Re-run the eval.
5. Log what changed and whether the score improved in `.logs/`.
6. Continue until the target score is met.

The default target is an overall score of `0.9` with all evaluated levels solvable.

## Browser Artifact Loop

For visual work, run:

```bash
npm run build
npm run artifact:browser
```

Inspect `artifacts/browser/current.png` and `artifacts/browser/current.json` before claiming the UI is correct.
