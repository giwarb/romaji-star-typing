# 2026-05-03 サバイバルリライト作業ログ

## 変更概要

ステージクリア型6ステージ構成から、エンドレスサバイバル型に全面書き換え。

## 動機

「すぐに終わってつまらない」「落ちものゲームみたいにだんだんレベルが上がって欲しい」「キャラクター要素を小学生受けするものにして」

## 変更ファイル

| ファイル | 変更内容 |
|----------|---------|
| src/core/types.ts | GameState に level/clearedCount/drainRate 追加、StageResult を level/bestScore/bestLevel に変更、SaveData を { bestScore, bestLevel } に簡略化 |
| src/core/game.ts | 全面書き換え。bandIndexForLevel / drainRateForLevel / finishChallenge / tickClock / buildTimeUp を実装 |
| src/core/lessons.ts | 6バンドに再編成。タイミングはgame.tsが制御 |
| src/platform/storage.ts | 新保存形式。旧形式からのマイグレーション実装 |
| index.html | buddy-panel（ほしまる）、hud-grid、result-grid追加 |
| src/main.ts | buddyProfile()、ことばラッシュレンダリング、ハーネス更新 |
| src/styles.css | CSSクリーチャー実装（buddy-figure）、word-modeスタイル |
| tests/unit/*.test.ts | サバイバルモデル向けに全テスト再記述 |
| tests/e2e/smoke.spec.ts | サバイバル向けに再記述 |
| tests/e2e/level-design.spec.ts | バンド読み込み・ことばラッシュE2Eテスト |

## 検証結果

```
lint       : ✅ clean
typecheck  : ✅ clean
unit tests : ✅ 19/19 (4 suites)
eval:game  : ✅ score=1.0 (6/6 valid bands)
build      : ✅ 22.21 kB JS / 11.77 kB CSS
test:e2e   : ✅ 14/14
screenshot : artifacts/browser/current.png
```

## 修正した不具合

1. `StageId` 未使用インポート → game.ts インポートから削除
2. `buddyProfile` の引数型不一致 → `ReturnType<typeof serializeState>` に変更
3. 1文字ローマ字即完了でテスト失敗 → `typed` 代わりに `challengeIndex` で進捗確認
4. bandIndexForLevel で Lv10 が 'combo' を返していた → threshold を `>= 10` に修正

## ほしまる進化形態

| 形態ID | 条件 | 外見 |
|--------|------|------|
| seed | Lv1〜6 | 黄色い丸（げんきのたね） |
| dash | Lv7〜9 | やや変化（きらりダッシュ） |
| rocket | Lv10〜 | オレンジ（ことばロケット） |
| rest | タイムアップ | 青（ひとやすみ） |

## 次の候補

- フィーバー時の視覚演出強化
- 難度バンドへの問題追加
