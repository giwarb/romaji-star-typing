# ローマ字スタータイピング

小学3年生がローマ字を習い始めたタイミングで遊べる、ブラウザだけで動くタイピング練習ゲームです。

ひらがなを見てローマ字を入力します。正しく打てるとカードとキーが気持ちよく反応し、間違えたときは画面上のキーボードで「押したキー」と「正しいキー」を見せます。

## Features

- HTML + TypeScript + Vite.
- 母音から単語まで段階的に進むステージ制。
- 正解キー、押したキー、次のキーが見える画面キーボード。
- 連続正解のコンボとスコア。
- `localStorage` にベストスコアと解放ステージを保存。
- 型付き `window.__GAME_HARNESS__` で AI/Playwright がゲームを操作可能。
- Vitest、Playwright、eval script、GitHub Pages CI/CD。

## Local Setup

```bash
npm install
npm run check
npm run dev
```

## Project Layout

```text
src/core/        Typed game rules, lessons, deterministic ordering
src/platform/    localStorage adapter
tests/unit/      Model and lesson tests
tests/e2e/       Browser and harness tests
tests/harness/   Playwright game driver
scripts/         Eval and browser artifact scripts
```

## AI Harness

At runtime:

```ts
window.__GAME_HARNESS__
```

Supports:

- `snapshot()`
- `dispatch(action)`
- `press(key)`
- `reset(seedOrState?)`
- `loadStage(stageIndex)`

Use `npm run eval:game` for machine-readable course quality checks and `npm run artifact:browser` to capture a screenshot for visual tuning.
