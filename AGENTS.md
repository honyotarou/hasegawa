# AGENTS.md - 診療記録くん v8 実行ガイド

このリポジトリは、`診療記録くん（v8・確定版）` を漏れなく実装するための運用ファイルを管理する。
実装者は本ファイルと `.agent` 配下の文書を必ず順番に読むこと。

## 1. 必読順序

1. `AGENTS.md`（このファイル）
2. `.agent/spec.md`（確定仕様）
3. `.agent/tdd-checklist.md`（実装順・検証順）
4. `.agent/execution-plan.md`（実装フェーズ手順）
5. `.agent/traceability.md`（要件トレース表）

## 2. 目的

整形外科クリニック向けに、以下を構築する。

1. ChatGPT出力の患者JSONをChrome拡張で取り込む
2. 医師がUIで診断名・リハ有無を入力する
3. GAS Webアプリへ一括送信する
4. スプレッドシートへ冪等に追記する
5. 毎日14時台にGAS集計を実行する

## 3. 主要成果物

```text
chrome-extension/
├── manifest.json
├── content.js
├── popup.html
├── popup.js
├── sendRecord.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── __tests__/
    ├── content.test.js
    ├── popup.test.js
    └── sendRecord.test.js

gas/
├── Code.gs
├── Validation.gs
└── Code.test.gs
```

## 4. 非交渉ルール（必須）

1. TDD順序を固定する（Red -> テストのみコミット -> Green -> Refactor -> テスト資産整理）。
2. 「モック実装禁止」はプロダクションコードのダミー実装禁止を意味する。テスト側の `vi.fn()` 等は使用可。
3. 各テストに Given/When/Then コメントを入れる。
4. 実装前にテスト観点表（等価分割・境界値）をMarkdownで提示する。
5. 失敗系テスト数を正常系以上にする。
6. 分岐網羅100%を目標とする。
7. 契約による設計（事前条件・事後条件・不変条件）を明示する。

## 5. データ・状態の不変条件

1. 冪等性キーは `clientRecordId`（`batchId + "_" + index`）を利用する。
2. `timestamp` は表示/並び替え用途であり、冪等性キーに使わない。
3. `rehab` は Boolean 必須。`null` は送信しない。
4. `diagnoses` は最大6要素、足りなければ空文字で埋める。
5. `chrome.storage.session` に保存してよいのは `apiSecret` と `currentBatchId` のみ。
6. 患者データ本体（age/gender/diagnoses/rehab）は storage に保存しない。
7. session の AccessLevel は変更しない（trusted-only維持）。
8. `executeScript` は `allFrames: false`、`results[0].result` のみ使用する。

## 6. UI/画面運用の必須要件

1. 画面は5つ（`SETUP`/`MAIN`/`CONFIRM`/`DONE`/`SETTINGS`）を `showScreen(name)` で切替管理する。
2. 初回起動は `SETUP` を強制表示する（`gasUrlProd` または `secret` 未設定時）。
3. MAIN画面は日付ピッカー、開発/本番トグル、未選択ジャンプを持つ。
4. CONFIRM画面で送信内容を読み取り専用表示してから送信する。
5. 送信成功後は DONE画面へ遷移し、`currentBatchId` をクリアする。

## 7. GAS運用の必須要件

1. `doGet` は作らず、`doPost` に統一する。
2. secret照合失敗は `success:false` を返す。
3. `recordBatch` は全件バリデーション後にロックを取り、一括書き込みする。
4. Spreadsheet呼び出しはループ内で行わず、`getValues/setValues` をバッチ化する。
5. `createDailyTrigger()` は `atHour(14)` の「14時台実行」であることをコメントで明記する。
6. 再デプロイ時は「既存のデプロイを更新」を使い、URLを固定する。

## 8. 完了定義

以下をすべて満たしたら完了とする。

1. `.agent/spec.md` の仕様に反する実装がない。
2. `.agent/tdd-checklist.md` の必須テストを全実施し、失敗ログ->成功ログを残す。
3. 再送時に同一 `batchId` / `clientRecordId` で冪等性が成立する。
4. UIで `rehab` 未選択が1件でもある場合、送信導線を通れない。
5. GAS集計関数群が移植され、14時台トリガー運用が可能。

## 9. 実装時参照

1. 仕様本体: `.agent/spec.md`
2. TDD運用: `.agent/tdd-checklist.md`
3. 実装フェーズ計画: `.agent/execution-plan.md`
4. 要件トレース: `.agent/traceability.md`
