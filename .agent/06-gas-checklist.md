# 06 GAS Checklist

## 1. 構成

- [ ] `Code.gs` は `doPost` を入口にする
- [ ] `Validation.gs` に純粋検証ロジックを分離
- [ ] `Code.test.gs` で手動テスト関数を用意

## 2. 認証とルーティング

- [ ] `doGet` を実装しない
- [ ] `doPost` で `JSON.parse(e.postData.contents)`
- [ ] ScriptProperties から `API_SECRET` を取得
- [ ] secret 不一致時は `{success:false,error:'認証失敗'}`
- [ ] action 分岐: `record` / `dailyReport` / default error

## 3. Validation.gs

- [ ] `validateAndNormalize(obj)` は副作用なし
- [ ] `age` は 1-150 の整数のみ（小数不可）
- [ ] `rehab` は boolean 必須
- [ ] `diagnoses` は配列必須
- [ ] diagnoses 要素は 100 文字制限、6 要素へ正規化
- [ ] remarks は 200 文字制限
- [ ] gender は `男性|女性|その他` へ正規化

## 4. handleRecord / appendRecord

- [ ] `answer` が文字列/オブジェクト両対応
- [ ] `validateAndNormalize` 失敗時に即エラー返却
- [ ] LockService を利用し TOCTOU を防止
- [ ] hash は `doctorId + '_' + rawAnswer` ベース
- [ ] `RECENT_HASH_LIMIT` 件のみ重複チェック
- [ ] `appendRow` 不使用
- [ ] `setValues` で 12列を明示書き込み

## 5. handleDailyReport

- [ ] `mainFlow()` 実行で集計シート更新
- [ ] 対象日デフォルトは script timezone の当日
- [ ] 全行を 1 回で読み込み、日付一致で抽出
- [ ] summary（患者数/性別/年齢統計/rehab率/診断ランキング）生成
- [ ] report JSON を Drive に保存
- [ ] 保存先フォルダは ScriptProperties の `REPORT_FOLDER_ID` で固定

## 6. mainFlow と集計関数

- [ ] `importAllJSONToSheet()` は削除
- [ ] 既存集計関数を同一仕様で移植
- [ ] ループ内 Spreadsheet 呼び出しをバッチ化

## 7. Trigger

- [ ] `createDailyTrigger()` で 14時台実行設定
- [ ] `atHour(14)` の遅延特性をコメントで明示
- [ ] `nearMinute` 未指定時ランダム性をコメントで明示
- [ ] 通知設定確認を手順化
