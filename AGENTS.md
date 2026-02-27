# AGENTS.md: 診療記録 自動集計システム v5 実装運用契約

このリポジトリで作業するエージェントは、本ファイルと `.agent/` 配下の手順を必ず順守する。
目的は、以下の v5 指示仕様を漏れなく再現し、実装品質を TDD と契約設計で保証すること。

## 1. 目的

- 診療中に AI 生成 JSON を Chrome 拡張の 1 クリックで Google スプレッドシートへ登録する
- 毎日 14 時台トリガーで GAS 集計を実行し、日次レポートを生成する
- セキュリティ要件（secret 非露出）と MV3 制約を満たす

## 2. 必須成果物

- `chrome-extension/`
  - `manifest.json`
  - `content.js`
  - `popup.html`
  - `popup.js`
  - `sendRecord.js`
  - `__tests__/content.test.js`
  - `__tests__/popup.test.js`
  - `__tests__/sendRecord.test.js`
- `gas/`
  - `Code.gs`
  - `Validation.gs`
  - `Code.test.gs`

## 3. 実行順序（変更禁止）

1. Red: テストのみ作成して失敗を確認（実装禁止）
2. Red コミット: テストだけをコミット
3. Green: テストを一切変更せず実装を反復し、全件パス
4. Refactor: 過剰適合・抜け道の監査
5. Test Asset Triage: 残す/薄くする/削除の判定

詳細は `.agent/02-tdd-gate.md` を使用すること。

## 4. TDD とテスト契約

- 実装前に `.agent/03-test-design-matrix-template.md` で観点表を作成する
- Given/When/Then コメントを各テストに記載する
- 事前条件・事後条件・不変条件をテストで検証する
- 正常系だけでなく異常系・境界値・型不正・外部依存失敗を含める
- 失敗系テスト数は正常系テスト数以上にする
- 分岐網羅 100% を目標に不足分岐を明示する
- 「モック実装禁止」はプロダクションコードへのダミー実装禁止を意味する
- テスト側の `vi.fn()` / spy / stub は必須で使用する

## 5. Chrome 拡張の実装制約

- Manifest V3
- `content_scripts` を使わない（on-demand `executeScript` のみ）
- `permissions`: `activeTab`, `scripting`, `storage`
- `host_permissions` に両方を記載
  - `https://script.google.com/*`
  - `https://script.googleusercontent.com/*`
- `executeScript` は `allFrames: false` を明示し、`results[0].result` のみ採用
- `chrome.runtime.onMessage` は `content.js` に作らない
- 送信中はボタン disabled（一次防衛）
- fetch 応答 30 秒超はタイムアウト扱い（AbortController）
- SW 停止を前提にグローバル状態へ依存しない

詳細は `.agent/05-chrome-mv3-checklist.md` を使用すること。

## 6. ストレージと secret の不変条件

- 患者データ本体を `chrome.storage.local/session` に保存しない
- `local` 保存キーは `gasUrl`, `todayCount`, `todayDate`, `lastSentAnswerHash` のみ
- secret は `chrome.storage.session` に保存（trusted contexts 前提）
- `local` に保存する場合は trusted-only を明示設定

## 7. GAS 実装制約

- `doGet` は実装しない。全リクエストを `doPost` に統一
- `doPost` は薄いアダプタ + `action` 分岐（`record`, `dailyReport`）
- secret は body のみ。URL クエリ・カスタムヘッダへ載せない
- secret は ScriptProperties (`API_SECRET`) 管理。コード直書き禁止
- `Validation.gs` の `validateAndNormalize` を純粋関数として分離
- `age` は 1〜150 の整数のみ（`Number.isInteger` 必須）
- 重複判定は `doctorId + rawAnswer` ベース hash
- 直近 `RECENT_HASH_LIMIT` 件のみ重複チェック
- LockService で重複判定と書込を同一クリティカルセクション化
- `appendRow` は使わず `getRange(lastRow + 1, ...).setValues()`
- ループ内 Spreadsheet 呼び出しを禁止し、`getValues` でバッチ化

詳細は `.agent/06-gas-checklist.md` を使用すること。

## 8. 日次トリガー契約

- `createDailyTrigger()` は `atHour(14)` の遅延特性（14:00-15:00）をコメントで明示
- `nearMinute` 未指定時のランダム性を明示
- 失敗時メール通知設定確認を手順に含める
- 日次ランタイム上限を超えないよう将来最適化余地を記録する

## 9. 作業時に使うドキュメント順

1. `.agent/01-mission-and-scope.md`
2. `.agent/02-tdd-gate.md`
3. `.agent/03-test-design-matrix-template.md`
4. `.agent/04-contract-design-checklist.md`
5. `.agent/05-chrome-mv3-checklist.md`
6. `.agent/06-gas-checklist.md`
7. `.agent/08-run-log-template.md`
8. `.agent/09-risk-and-overfit-review.md`
9. `.agent/07-acceptance-gate.md`（最終判定）

## 10. 完了条件

以下を満たした場合のみ「完了」とする。

- Red の失敗ログ証跡がある
- テストのみコミット証跡がある
- テスト無変更で Green 到達している
- 過剰適合レビュー結果が記録されている
- テスト資産の取捨選択が記録されている
- `.agent/07-acceptance-gate.md` の必須項目がすべて合格
