# v11 TDDチェックリスト

## Step 1: Red

- [ ] 「実装を書かない」状態でテスト追加
- [ ] Given/When/Then コメントを全テストに付与
- [ ] `npm test` 失敗ログを保存

Redログテンプレート:

```text
[date]
[command]
[result] FAIL (expected)
[failed files]
- ...
```

## Step 2: テストのみコミット

- [ ] テスト以外の差分がない
- [ ] コミットメッセージに `test only`

## Step 3: Green（テスト変更禁止）

- [ ] テスト未変更で実装反復
- [ ] 2〜4周で収束
- [ ] 全テストPASSログ保存

## Step 4: 過剰適合チェック

- [ ] 仕様外入力で抜け道がない
- [ ] 非機能要件（timeout / non-json response / idempotency）確認

## テスト観点表（固定）

## 1) extractPatients

| # | 観点 | 期待 |
|---|---|---|
| 1 | pre>code抽出 | success |
| 2 | code抽出 | success |
| 3 | pre抽出 | success |
| 4 | 同一グループ複数 | 末尾採用 |
| 5 | グループ優先順 | pre>code優先 |
| 6 | JSONなし | success:false |
| 7 | 空配列 | 空エラー |
| 8 | age=0 | ageエラー |
| 9 | age=150 | success |
| 10 | age=1.5 | ageエラー |
| 11 | gender=男 | 男性化 |
| 12 | gender=female | その他化 |
| 13 | 壊れJSON | 次候補へ |

## 2) sendBatch

| # | 観点 | 期待 |
|---|---|---|
| 1 | 正常送信 | success:true |
| 2 | batchIdなし | throw |
| 3 | patients空 | throw |
| 4 | diagnoses補完 | 6要素 |
| 5 | clientRecordId | `batch_i` |
| 6 | timestampオフセット | 1秒差 |
| 7 | ローカル日付/時刻 | selectedDate準拠 |
| 8 | timeout | AbortError |
| 9 | non-json response | エラー文言 |
| 10 | GAS success:false | そのまま返却 |
| 11 | redirect follow | 正常応答 |

## 3) MainScreen / hooks

| # | 観点 | 期待 |
|---|---|---|
| 1 | JSON取得成功 | 行生成 |
| 2 | JSON取得失敗 | エラー表示 |
| 3 | 全入力済み | canSubmit=true |
| 4 | リハ未入力 | canSubmit=false |
| 5 | 診断未入力 | canSubmit=false |
| 6 | 両方未入力 | pending両方表示 |
| 7 | 送信ボタン | CONFIRM遷移 |
| 8 | 次の未選択 | scroll呼び出し |
| 9 | 日付変更 | selectedDate更新 |
| 10 | gasUrlDev空 | mode toggle非表示 |
| 11 | gasUrlDev有 | mode toggle表示 |
| 12 | session復元 | table復元 |
| 13 | age不正 | エラー表示+送信不可 |

## 4) Confirm/Done

| # | 観点 | 期待 |
|---|---|---|
| 1 | サマリー | 件数一致 |
| 2 | 戻る | MAIN復帰 |
| 3 | 送信成功 | DONE遷移 |
| 4 | 一部skipped | Done表示 |
| 5 | 成功後count更新 | incrementCounts呼び出し |
| 6 | GAS失敗 | エラー表示 |
| 7 | ネットワーク失敗 | エラー表示 |
| 8 | timeout | timeout文言 |
| 9 | 二度押し防止 | disabled |
| 10 | DONE時snapshot削除 | remove呼び出し |

## 5) GAS（手動）

| # | 観点 | 期待 |
|---|---|---|
| 1 | doctorId必須 | エラー |
| 2 | batchId必須 | エラー |
| 3 | clientRecordId必須 | エラー |
| 4 | diagnoses[0]必須 | エラー |
| 5 | 全件検証 | 1件NGで全体NG |
| 6 | 同一再送 | skipped増加 |
| 7 | 15列書込 | setValues(15列) |
| 8 | 集計列参照 | v11列位置一致 |

