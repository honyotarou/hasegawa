# 診療記録くん v8 実装フェーズ計画

このファイルは「何を、どの順序で、どの完了条件で」実装するかを固定する。

## Phase 0: ブートストラップ

- [ ] `chrome-extension/` と `gas/` のディレクトリを作成
- [ ] `manifest.json`, `popup.html`, `content.js`, `popup.js`, `sendRecord.js` を作成
- [ ] `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` を配置
- [ ] テスト土台 (`__tests__/*.test.js`, `Code.test.gs`) を作成

完了条件:

1. 成果物一覧のファイルが全て存在する
2. manifestのJSONが構文エラーなく読み込める

## Phase 1: Red（テストのみ）

- [ ] `content.test.js` を先に作成
- [ ] `popup.test.js` を作成（5画面遷移・状態管理）
- [ ] `sendRecord.test.js` を作成（成功/失敗/timeout）
- [ ] `Code.test.gs` / `Validation` 手動テスト関数を作成
- [ ] テスト失敗ログを記録

完了条件:

1. 実装コード未変更
2. 失敗ログが残っている

## Phase 2: テストのみコミット

- [ ] テスト以外に差分がないことを確認
- [ ] テストのみコミット

完了条件:

1. コミット履歴でテスト単体コミットを確認できる

## Phase 3: Green（実装）

実装順は固定。

1. `content.js`
2. `popup.html`
3. `popup.js`（`SETUP -> MAIN -> CONFIRM -> DONE -> SETTINGS`）
4. `sendRecord.js`
5. `gas/Validation.gs`
6. `gas/Code.gs`（`doPost`, `recordBatch`, 集計関数移植）

### 3-1. content.js

- [ ] `pre>code -> code -> pre` 順で抽出
- [ ] 空配列/不正JSON/スキーマ違反をエラー返却
- [ ] `gender` 正規化

### 3-2. popup.html

- [ ] JSは埋め込まず `popup.js` のみ読み込み
- [ ] 暖色+ティールのデザイン変数を反映
- [ ] 5画面分のコンテナを定義

### 3-3. popup.js

- [ ] 初回未設定時は `SCREEN_SETUP`
- [ ] setup保存先を `local/session` で分離
- [ ] `ChatGPTから取得` で batchId生成・session保存
- [ ] `rehab` 未選択時は送信導線を無効化
- [ ] `SCREEN_CONFIRM` で読み取り専用サマリー
- [ ] 成功で `SCREEN_DONE`、失敗でbatch維持
- [ ] 診断名カウント上位5件表示

### 3-4. sendRecord.js

- [ ] `AbortController` 30秒
- [ ] HTTP失敗・業務失敗・network失敗を区別
- [ ] 成功時のみbatchクリアを呼び出し側で実施

### 3-5. GAS

- [ ] `validateAndNormalize` を仕様どおり実装
- [ ] `doPost` で action 分岐
- [ ] `handleRecordBatch` 全件検証 + lock
- [ ] hashキーは `clientRecordId`
- [ ] 重複時は `skipped` 計上
- [ ] 集計関数群を移植し、ループ内API呼び出しを禁止

完了条件:

1. テスト変更なしで全テスト成功
2. 冪等性、再送、timeout、未選択制御が動作

## Phase 4: Refactor

- [ ] 過剰適合チェック
- [ ] 重複ロジック整理
- [ ] 可読性向上（必要最小限コメント）

完了条件:

1. 全テスト再成功
2. 不変条件違反なし

## Phase 5: デプロイ準備

- [ ] GAS `setupSecret()` 実行
- [ ] Webアプリを「既存のデプロイを更新」で反映
- [ ] 拡張SETUPに本番/開発URL, secret, doctorId, 診断名を設定
- [ ] `createDailyTrigger()` 実行

完了条件:

1. popupから送信してGAS書き込み確認
2. 再送で `written:0/skipped:N` を確認

