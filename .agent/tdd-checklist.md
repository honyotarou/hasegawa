# 診療記録くん v8 TDDチェックリスト

このファイルは「実行順」と「最低限の検証観点」を固定するための運用チェックリスト。
実装時は上から順に消化すること。

## 0. 事前準備

- [ ] `AGENTS.md` と `.agent/spec.md` を読了した
- [ ] 対象モジュールごとにテスト観点表（等価分割・境界値）を先に作成した
- [ ] テスト内に Given/When/Then コメント方針を決めた
- [ ] 正常系と同数以上の異常系ケースを定義した

## 1. Step 1 - Red（テストだけ作成）

- [ ] 実装コードは変更していない
- [ ] テストファイルのみ追加した
- [ ] テスト側の `spy/stub/vi.fn()` を準備した
- [ ] テスト実行して失敗を確認した
- [ ] 失敗ログを保存した

### Redログ記録テンプレート

```text
[date] 2026-xx-xx xx:xx
[scope] content.test.js / popup.test.js / sendRecord.test.js / Code.test.gs
[command] <実行コマンド>
[result] FAIL (期待どおり)
[key errors]
- ...
- ...
```

## 2. Step 2 - テストのみコミット

- [ ] テスト関連ファイル以外に変更がない
- [ ] コミットメッセージに「test only」を含めた
- [ ] この時点で実装コード未変更を再確認した

## 3. Step 3 - Green（テスト固定で実装）

- [ ] テストファイルを変更せず実装を進める
- [ ] 実装とテスト実行を2〜4周で反復する
- [ ] 各周回で失敗原因と対策をメモする
- [ ] 最終的に全テストが成功した

### Green反復ログテンプレート

```text
[round] 1
[change] ...
[test] FAIL/PASS
[note] ...

[round] 2
[change] ...
[test] FAIL/PASS
[note] ...
```

## 4. Step 4 - 過剰適合チェック（Refactor）

- [ ] この実装はテスト依存の抜け道を含まないか確認した
- [ ] 入力境界（age, rehab, empty records, timeout）を再評価した
- [ ] 仕様の不変条件を破る分岐がないか確認した
- [ ] リファクタ後に再度全テストを通した

## 5. Step 5 - テスト資産の取捨選択

- [ ] 将来の回帰防止に効くテストを残した
- [ ] 冗長/重複テストを薄くしたか削除した
- [ ] 変更理由を記録した

## 6. テスト観点表（等価分割・境界値）

## 6.1 content.js

| # | 観点 | 入力 | 期待 | 種別 |
|---|------|------|------|------|
| 1 | pre>code抽出成功 | `<pre><code>[...]</code></pre>` | success + patients | 正常 |
| 2 | pre>code複数 | 2ブロック | 最後の有効配列採用 | 正常 |
| 3 | code単体抽出 | `<code>[...]</code>` | success + patients | 正常 |
| 4 | pre単体抽出 | `<pre>[...]</pre>` | success + patients | 正常 |
| 5 | pre>codeとcode重複 | 両方同値 | pre>code優先で1回採用 | 正常 |
| 6 | JSONなし | テキストのみ | success:false | 異常 |
| 7 | 空配列 | `[]` | success:false + 空エラー | 異常 |
| 8 | age下限外 | `age:0` | success:false | 境界 |
| 9 | age上限 | `age:150` | success:true | 境界 |
| 10 | age小数 | `age:1.5` | success:false | 境界 |
| 11 | gender正規化 | `男` | 男性化 | 正常 |
| 12 | gender未知 | `female` | その他化 | 異常 |
| 13 | 壊れたJSON | パース不可 | 次候補遷移/失敗 | 異常 |

## 6.2 popup.js

| # | 観点 | 条件 | 期待 | 種別 |
|---|------|------|------|------|
| 1 | 初回起動未設定 | gasUrl未設定 | SETUP表示 | 正常 |
| 2 | 初回起動設定済み | 必須設定あり | MAIN表示 | 正常 |
| 3 | SETUP保存成功 | 全項目入力 | 保存後MAIN遷移 | 正常 |
| 4 | SETUP保存失敗 | 必須欠落 | エラー表示 | 異常 |
| 5 | JSON取得成功 | 10件返却 | MAINに10件表示 | 正常 |
| 6 | JSON取得失敗 | success:false | エラー表示 | 異常 |
| 7 | 全件rehab選択 | nullなし | 送信導線有効 | 正常 |
| 8 | rehab未選択あり | null含む | 送信導線無効 | 異常 |
| 9 | 次の未選択へ | null行あり | 該当行スクロール | 正常 |
| 10 | MAIN->CONFIRM | 送信ボタン押下 | CONFIRM遷移 | 正常 |
| 11 | CONFIRM戻る | 戻って修正 | MAIN復帰・状態維持 | 正常 |
| 12 | CONFIRM送信成功 | fetch success | DONE遷移 | 正常 |
| 13 | CONFIRM送信失敗 | fetch throw | エラー + batch保持 | 異常 |
| 14 | 再送時ID維持 | 失敗後再送 | 同一batchId利用 | 正常 |
| 15 | 30秒timeout | abort | エラー + 再送可能 | 異常 |
| 16 | 開発/本番切替 | dev選択 | dev URL送信 | 正常 |
| 17 | 日付変更 | 前日選択 | timestamp反映 | 正常 |
| 18 | 診断名選択 | 項目選択 | diagnosisCount増加 | 正常 |
| 19 | 上位5件更新 | count変化 | 並び順更新 | 正常 |
| 20 | SW復帰 | session復元 | batchId再利用 | 正常 |
| 21 | 診断名一括貼付 | 30行入力 | 配列保存 | 正常 |
| 22 | 0件送信導線 | patients空 | 患者なしエラー | 異常 |

## 6.3 sendRecord.js

| # | 観点 | 条件 | 期待 | 種別 |
|---|------|------|------|------|
| 1 | 正常POST | success:true | 成功応答返却 | 正常 |
| 2 | HTTP失敗 | status>=400 | エラー返却 | 異常 |
| 3 | success:false応答 | GASエラー | メッセージ返却 | 異常 |
| 4 | ネットワーク失敗 | fetch throw | エラー返却 | 異常 |
| 5 | timeout | 30秒超過 | abortエラー返却 | 境界 |
| 6 | payload整形 | batch + records | clientRecordId保持 | 正常 |

## 6.4 Validation.gs

| # | 観点 | 入力 | 期待 | 種別 |
|---|------|------|------|------|
| 1 | 正常 | age40/rehab true | valid:true | 正常 |
| 2 | age下限外 | age0 | valid:false | 境界 |
| 3 | age最小 | age1 | valid:true | 境界 |
| 4 | age最大 | age150 | valid:true | 境界 |
| 5 | age上限外 | age151 | valid:false | 境界 |
| 6 | age小数 | age1.5 | valid:false | 境界 |
| 7 | age文字列 | age:"40" | valid:false | 異常 |
| 8 | rehab null | rehab:null | valid:false | 異常 |
| 9 | rehab文字列 | rehab:"true" | valid:false | 異常 |
| 10 | diagnoses型違い | diagnoses:"腰痛" | valid:false | 異常 |
| 11 | diagnoses超過 | 7件 | 6件に切詰め | 境界 |
| 12 | gender男 | "男" | 男性化 | 正常 |
| 13 | gender未知 | "X" | その他化 | 異常 |

## 6.5 Code.gs（recordBatch）

| # | 観点 | 入力 | 期待 | 種別 |
|---|------|------|------|------|
| 1 | 正常10件 | 有効10件 | 10行追記 | 正常 |
| 2 | 1件 | 有効1件 | 1行追記 | 正常 |
| 3 | 空配列 | records:[] | エラー | 異常 |
| 4 | batchId欠落 | batchIdなし | エラー | 異常 |
| 5 | clientRecordId欠落 | rec0欠落 | エラー | 異常 |
| 6 | 途中不正 | 1件age0 | 全体エラー | 異常 |
| 7 | 全件重複 | 同一再送 | written0/skippedN | 境界 |
| 8 | 部分重複 | 一部既存 | written/skippedが分割 | 境界 |
| 9 | 同バッチ重複 | 同ID2件 | 1件のみ書込 | 境界 |
| 10 | timestamp変更再送 | 同clientRecordId | skipped扱い | 正常 |
| 11 | secret誤り | 不正secret | 認証失敗 | 異常 |
| 12 | 空postData | contents空 | エラー | 異常 |
| 13 | rehab null混入 | rehab:null | 全体エラー | 異常 |

## 7. 契約（Design by Contract）

## 7.1 事前条件

1. SETUP必須項目が保存済み。
2. records送信時は全件 `rehab` が Boolean。
3. `currentBatchId` がある場合は再送扱い。

## 7.2 事後条件

1. 成功時は `success:true` と件数を返す。
2. 送信成功後に `currentBatchId` を削除。
3. 失敗時は `currentBatchId` を保持。

## 7.3 不変条件

1. 患者データはstorageに永続化しない。
2. 冪等性は `clientRecordId` 固定。
3. `doGet` は追加しない。

## 8. 最終確認チェック

- [ ] Redログが残っている
- [ ] テストのみコミット履歴がある
- [ ] Green後に全テストPASS
- [ ] 過剰適合レビューを実施
- [ ] 主要異常系（timeout/secret不正/空配列/未選択）を通した
- [ ] 再送時の冪等性が確認済み
- [ ] 14時台トリガー運用手順を確認済み
