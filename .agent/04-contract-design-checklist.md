# 04 Contract Design Checklist

実装前に契約を定義し、テストで検証する。

## 1. content.js

### 事前条件（Preconditions）

- [ ] 抽出対象は `pre, code` のみ
- [ ] JSON候補は文字列として取得可能
- [ ] 単一オブジェクト時は timestamp 補完可能

### 事後条件（Postconditions）

- [ ] 成功時 `success:true` と 1件データを返す
- [ ] 失敗時 `success:false` とエラー詳細を返す
- [ ] `diagnoses` は 6 要素に正規化される
- [ ] `gender` は `男性|女性|その他` に正規化される

### 不変条件（Invariants）

- [ ] 全DOM走査（div/p等）へ回帰しない
- [ ] `chrome.runtime.onMessage` を使わない

## 2. popup.js / sendRecord.js

### 事前条件

- [ ] `gasUrl` 入力済み
- [ ] 実行中フラグが false
- [ ] active tab を取得できる

### 事後条件

- [ ] 送信開始時にボタンを即 disabled
- [ ] 成否に関わらず終了時に UI 状態整合
- [ ] 成功時のみ `lastSentAnswerHash` 更新
- [ ] エラー時にメッセージ表示

### 不変条件

- [ ] storage に患者データ本体を保存しない
- [ ] 保存キーは `gasUrl,todayCount,todayDate,lastSentAnswerHash` 限定
- [ ] secret は `chrome.storage.session` に保存
- [ ] `executeScript` は `allFrames:false` 明示

## 3. Validation.gs

### 事前条件

- [ ] 引数は JSON.parse 済み object

### 事後条件

- [ ] valid:true のとき normalized が必ず存在
- [ ] `age` は 1-150 の整数のみ
- [ ] remarks は 200 文字以内

### 不変条件

- [ ] 副作用なし（Spreadsheet/Drive/Properties未使用）

## 4. Code.gs

### 事前条件

- [ ] `doPost` から body を JSON.parse 済み
- [ ] secret は ScriptProperties の `API_SECRET`
- [ ] action が `record|dailyReport` のいずれか

### 事後条件

- [ ] `record`: 成功時に1行追記または重複スキップ応答
- [ ] `dailyReport`: report を返し Drive へ保存
- [ ] 例外時は JSON エラー応答

### 不変条件

- [ ] `doGet` 未実装
- [ ] secret を URL に含めない
- [ ] LockService で TOCTOU を防止
- [ ] Spreadsheet 呼び出しをループ内で繰り返さない
