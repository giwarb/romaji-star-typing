# PLAN.md

## Game

ローマ字スタータイピング is a browser-only typing practice game for Japanese third graders who are just starting romaji.

## Player Goal

Type the romaji shown by each hiragana prompt, collect score and combo stars, and clear stages from easy vowel sounds to short words.

## Main Loop

1. Show one hiragana prompt and its romaji slots.
2. Highlight the next expected key on the on-screen keyboard.
3. Accept physical keyboard, on-screen keyboard, or harness input.
4. If correct, fill the next slot, pulse the key, add score, and show a small celebration effect.
5. If wrong, show the pressed key in red and the expected key in yellow/green with a supportive message.
6. When the romaji is complete, award bonus score and move to the next problem.
7. When enough problems are completed, unlock the next stage.
8. Persist best scores and unlocked stages in `localStorage`.

## Inputs And Controls

- A-Z keys type letters.
- Backspace removes the last typed letter.
- Enter or Space moves to the next prompt when desired.
- On-screen keyboard buttons mirror physical key input.
- `window.__GAME_HARNESS__` exposes `snapshot`, `dispatch`, `press`, `reset`, and `loadStage`.

## Win And Fail States

- There is no hard fail state. Mistakes reset combo and add guidance.
- Stage complete: required number of prompts typed.
- Course complete: final word stage completed.

## Progression And Difficulty

1. Vowels: あいうえお.
2. か・さ・た rows.
3. な・は・ま・ら rows.
4. Dakuten and handakuten.
5. Small ゃゅょ combinations.
6. Short words such as ねこ, そら, きゅうしょく.

The generator uses deterministic challenge ordering so AI and tests can reproduce sessions.

## Visual Direction

Warm, encouraging, classroom-friendly. Large kana, clear romaji slots, tactile key states, short supportive messages, and visible feedback for both correct and wrong input.

## Stack And Hosting

- Static HTML + TypeScript.
- Vite build.
- Vitest for model tests.
- Playwright for browser and harness checks.
- `localStorage` only for persistence.
- GitHub Actions for CI.
- GitHub Pages for deployment.

## Milestones

1. Green harness: `npm run check`.
2. Core course stages and deterministic ordering.
3. Correct and wrong key visual feedback.
4. Stage unlock and persistence.
5. Screenshot artifacts for visual tuning.
