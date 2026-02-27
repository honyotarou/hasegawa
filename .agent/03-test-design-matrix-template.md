# 03 Test Design Matrix Template

実装前に本ファイルを埋めてから Step 1 を開始する。

## 0. 共通ルール

- 等価分割、境界値、異常系、外部依存失敗を含める
- 失敗系件数 >= 正常系件数
- 各行に `Pre`（事前条件）/`Post`（事後条件）/`Inv`（不変条件）タグを付与

## 1. content.js（vitest）

| ID | 観点 | 入力 | 期待結果 | 種別 | 契約タグ |
|---|---|---|---|---|---|
| C-01 | fenced codeblock 抽出 | ```json [...] ``` | 配列最後の1件を返す | 正常 | Pre/Post |
| C-02 | 生配列JSON抽出 | `[{...}]` | 配列最後の1件を返す | 正常 | Pre/Post |
| C-03 | 単一オブジェクト抽出 | `{age,...}` | timestamp ラップで返す | 正常 | Post |
| C-04 | JSONなし | 通常テキスト | `{success:false}` | 異常 | Post |
| C-05 | age 文字列 | `"age":"forty"` | 検証失敗 | 異常 | Pre |
| C-06 | age 上限超過 | `"age":200` | 検証失敗 | 境界 | Pre |
| C-07 | age 0 | `"age":0` | 検証失敗 | 境界 | Pre |
| C-08 | age 150 | `"age":150` | 成功 | 境界 | Pre/Post |
| C-09 | age 小数 | `"age":1.5` | 検証失敗 | 境界 | Pre |
| C-10 | diagnoses 型不正 | `"diagnoses":"捻挫"` | 検証失敗 | 異常 | Pre |
| C-11 | rehab null | `"rehab":null` | 検証失敗 | 異常 | Pre |
| C-12 | gender 未知値 | `"gender":"unknown"` | `その他` に正規化 | 異常 | Post |
| C-13 | diagnosis 101文字 | 101文字 | 100文字に切り捨て | 境界 | Post |
| C-14 | 壊れたJSON | `{age:40` | 検証失敗 | 異常 | Pre |

## 2. popup.js / sendRecord.js（vitest）

| ID | 観点 | 条件 | 期待結果 | 種別 | 契約タグ |
|---|---|---|---|---|---|
| P-01 | GAS URL未設定 | gasUrl 空 | エラー表示、fetch未実行 | 異常 | Pre |
| P-02 | 正常送信 | 条件OK | 件数更新、成功表示 | 正常 | Post |
| P-03 | 連続同一送信 | hash一致 | 確認ダイアログ表示 | 異常 | Inv |
| P-04 | 抽出失敗 | `success:false` | エラー表示、件数不変 | 異常 | Post/Inv |
| P-05 | network error | fetch throw | エラー表示、disabled解除 | 異常 | Post/Inv |
| P-06 | GAS失敗応答 | `{success:false}` | エラー内容表示 | 異常 | Post |
| P-07 | 日跨ぎリセット | `todayDate` 昨日 | `todayCount=0` | 正常 | Inv |
| P-08 | 日次レポート成功 | GAS成功 | サマリー表示 | 正常 | Post |
| P-09 | 日次レポート失敗 | fetch throw | エラー表示 | 異常 | Post |
| P-10 | 送信中連打 | disabled状態 | 再送処理が走らない | 境界 | Inv |
| P-11 | 30秒無応答 | timeout発生 | エラー表示、disabled解除 | 異常 | Post/Inv |
| P-12 | SW再起動後復元 | storage再読込 | disabled矛盾なし | 異常 | Inv |

## 3. Validation.gs（GAS手動テスト）

| ID | 観点 | 入力 | 期待結果 | 種別 | 契約タグ |
|---|---|---|---|---|---|
| V-01 | 正常入力 | 有効オブジェクト | valid:true | 正常 | Pre/Post |
| V-02 | age下限 | age=1 | valid:true | 境界 | Pre/Post |
| V-03 | age上限 | age=150 | valid:true | 境界 | Pre/Post |
| V-04 | age=0 | age=0 | valid:false | 境界 | Pre |
| V-05 | age=151 | age=151 | valid:false | 境界 | Pre |
| V-06 | age小数 | age=1.5 | valid:false | 境界 | Pre |
| V-07 | age文字列 | age="forty" | valid:false | 異常 | Pre |
| V-08 | rehab null | rehab=null | valid:false | 異常 | Pre |
| V-09 | rehab文字列 | rehab="true" | valid:false | 異常 | Pre |
| V-10 | diagnoses型不正 | diagnoses="捻挫" | valid:false | 異常 | Pre |
| V-11 | diagnosis 101文字 | 101文字要素 | 100文字で正規化 | 境界 | Post |
| V-12 | gender未知値 | gender="male" | `その他` | 異常 | Post |
| V-13 | gender正規値 | gender="男性" | `男性` | 正常 | Post |

## 4. Code.gs doPost（GAS手動テスト）

| ID | 観点 | 入力 | 期待結果 | 種別 | 契約タグ |
|---|---|---|---|---|---|
| D-01 | record正常認証 | secret正 + action:record | 正常登録 | 正常 | Pre/Post |
| D-02 | secret誤り | 不正secret | 認証失敗 | 異常 | Pre |
| D-03 | secret欠如 | secretなし | 認証失敗 | 異常 | Pre |
| D-04 | 1件登録 | 有効entry | シート1行追記 | 正常 | Post |
| D-05 | 直近重複 | 同一hash | スキップ | 異常 | Inv |
| D-06 | answer object | parse済みobj | 正常登録 | 正常 | Pre/Post |
| D-07 | postData空 | contents="" | エラー応答 | 異常 | Pre |
| D-08 | 不正JSON | `{broken` | エラー応答 | 異常 | Pre |
| D-09 | age小数 | age=1.5 | 検証失敗 | 境界 | Pre |
| D-10 | dailyReport正常 | action:dailyReport | report生成 | 正常 | Post |
| D-11 | action不正 | action="unknown" | エラー応答 | 異常 | Pre |
