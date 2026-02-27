# 診療記録くん v8 実装フェーズ計画

このファイルは「何を、どの順序で、どの完了条件で」実装するかを固定する。

## Phase 0: ブートストラップ

- [x] `chrome-extension/` と `gas/` のディレクトリを作成
- [x] `manifest.json`, `popup.html`, `content.js`, `popup.js`, `sendRecord.js` を作成
- [x] `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` を配置
- [x] テスト土台 (`__tests__/*.test.js`, `Code.test.gs`) を作成

完了条件:

1. 成果物一覧のファイルが全て存在する
2. manifestのJSONが構文エラーなく読み込める

## Phase 1: Red（テストのみ）

- [x] `content.test.js` を先に作成
- [x] `popup.test.js` を作成（5画面遷移・状態管理）
- [x] `sendRecord.test.js` を作成（成功/失敗/timeout）
- [x] `Code.test.gs` / `Validation` 手動テスト関数を作成
- [x] テスト失敗ログを記録

完了条件:

1. 実装コード未変更
2. 失敗ログが残っている

## Phase 2: テストのみコミット

- [x] テスト以外に差分がないことを確認
- [x] テストのみコミット

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

- [x] `pre>code -> code -> pre` 順で抽出
- [x] 空配列/不正JSON/スキーマ違反をエラー返却
- [x] `gender` 正規化

### 3-2. popup.html

- [x] JSは埋め込まず `popup.js` のみ読み込み
- [x] 暖色+ティールのデザイン変数を反映
- [x] 5画面分のコンテナを定義

### 3-3. popup.js

- [x] 初回未設定時は `SCREEN_SETUP`
- [x] setup保存先を `local/session` で分離
- [x] `ChatGPTから取得` で batchId生成・session保存
- [x] `rehab` 未選択時は送信導線を無効化
- [x] `SCREEN_CONFIRM` で読み取り専用サマリー
- [x] 成功で `SCREEN_DONE`、失敗でbatch維持
- [x] 診断名カウント上位5件表示

### 3-4. sendRecord.js

- [x] `AbortController` 30秒
- [x] HTTP失敗・業務失敗・network失敗を区別
- [x] 成功時のみbatchクリアを呼び出し側で実施

### 3-5. GAS

- [x] `validateAndNormalize` を仕様どおり実装
- [x] `doPost` で action 分岐
- [x] `handleRecordBatch` 全件検証 + lock
- [x] hashキーは `clientRecordId`
- [x] 重複時は `skipped` 計上
- [x] 集計関数群を移植し、ループ内API呼び出しを禁止

完了条件:

1. テスト変更なしで全テスト成功
2. 冪等性、再送、timeout、未選択制御が動作

## Phase 4: Refactor

- [x] 過剰適合チェック
- [x] 重複ロジック整理
- [x] 可読性向上（必要最小限コメント）

完了条件:

1. 全テスト再成功
2. 不変条件違反なし

## Phase 5: デプロイ準備

- [ ] GAS `setupSecret()` 実行（ローカル環境では未実施）
- [ ] Webアプリを「既存のデプロイを更新」で反映（GASコンソール作業）
- [ ] 拡張SETUPに本番/開発URL, secret, doctorId, 診断名を設定（実機作業）
- [ ] `createDailyTrigger()` 実行（GASコンソール作業）

完了条件:

1. popupから送信してGAS書き込み確認
2. 再送で `written:0/skipped:N` を確認
