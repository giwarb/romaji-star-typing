# 2026-05-03 — タワーディフェンス完全リライト

## 概要

サバイバルタイピングゲームをタワーディフェンス型に全面リライト。

## 変更ファイル

- `src/core/types.ts` — Enemy・GameState・GameResult・HarnessSnapshot 再定義
- `src/core/lessons.ts` — 全バンド拡充（words 40問）
- `src/core/game.ts` — TD ロジック（spawn/move/target/kill/wave/backspace-release）
- `index.html` — battle-lane・base-zone・hp-display レイアウト
- `src/styles.css` — ダーク TD 配色・CSS クリーチャー敵・ほしまる基地キャラ
- `src/main.ts` — renderEnemies/renderHpDisplay/renderTargetInfo/harness

## Wave 設計

```
spawnInterval = max(1400, 4200 - wave*200) ms
speed = 0.036 + wave*0.004 pos/sec (±20%)
maxConcurrent = min(2 + floor((wave-1)/2), 7)
waveTarget = 6 + wave*2
bandForWave: 1-2→vowels, 3-4→k-row, 5-6→mixed, 7-8→dakuten, 9-10→combo, 11+→words
```

## バグ修正

1. `spawnEnemy()` で `challenge` フィールドが Enemy オブジェクトに含まれていなかった
   → `challenge,` を追加して解消
2. `handleBackspace()` が typed を空にしたときターゲットを解除しなかった
   → `newTyped.length === 0` でステータスを releasing に変更
3. 単母音（1文字 romaji）は最初のキーで即撃破されるため、テストでターゲット維持が確認できなかった
   → テストで `stageIndex:1`（k-row、2文字）を使用して解消
4. E2E smoke test の「targets enemy」チェックで vowel instant-kill を考慮
   → `isTargeted || isKilled` 条件に変更

## 検証結果

- lint: ✅ clean
- typecheck: ✅ clean
- unit: 25/25 ✅
- eval: 6/6, score=1.0 ✅
- build: 24.48 kB JS, 11.42 kB CSS ✅
- e2e: 14/14 ✅ (chromium + mobile, 5.5s)

## 次の仮説

- 敵クリーチャーにホバー・ヒットフレームアニメを追加
- 高Waveのモバイル操作性（タップ）改善
- ターゲット取得音・撃破エフェクトの視覚的強化
