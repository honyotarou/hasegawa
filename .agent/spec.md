# 診療記録くん v8 確定仕様

## 1. 目的と全体フロー

整形外科クリニックの診療記録入力を半自動化する。

1. 電子カルテ一覧を画像キャプチャ
2. ChatGPTに貼り付けて `[{"age": number, "gender": string}]` を生成
3. Chrome拡張でJSONを取得し、医師が編集・補完
4. GASへ一括送信（冪等）
5. スプレッドシートへ追記
6. 毎日14時台にGAS集計を実行

## 2. ディレクトリ仕様

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

## 3. manifest.json

以下を固定値とする。

```json
{
  "manifest_version": 3,
  "name": "診療記録くん",
  "description": "電子カルテの患者一覧からリハビリ率を自動集計するツール",
  "version": "1.0.0",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": [
    "https://script.google.com/*",
    "https://script.googleusercontent.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

### アイコン仕様

1. テーマ: 医師の笑顔（白衣・聴診器）
2. ベースカラー: `#fdf8f4`
3. アクセント: `#0d9488`
4. 丸角正方形フレーム
5. `16px/48px/128px` を作成
6. 生成手段は Pillow または canvas

## 4. デザインシステム（popup）

### カラーパレット

```css
:root {
  --bg-app: #fdf8f4;
  --bg-header: #2d2520;
  --bg-toolbar: #fdf0e8;
  --bg-table: #fffaf7;
  --bg-row-alt: #fdf4ee;
  --bg-row-hov: #fef3e8;
  --bg-input: #fffcf9;
  --bg-filled: #f0faf8;
  --accent: #0d9488;
  --accent-lt: #ccfbf1;
  --accent-dk: #0f766e;
  --accent-glow: rgba(13, 148, 136, 0.15);
  --text-primary: #292118;
  --text-secondary: #7c6a5e;
  --text-muted: #b5a49a;
  --border: #ede3da;
  --border-lt: #f5ede6;
  --danger: #dc6444;
  --success: #0d9488;
  --male-bg: #e8f4fd;
  --male-txt: #1d6fa4;
  --female-bg: #fdeee8;
  --female-txt: #b84c2e;
}
```

### フォント

```css
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600&display=swap");
font-family: "Noto Sans JP", sans-serif;
```

### UIルック&フィール

1. ヘッダー: ウォームブラウン背景、左に緑ドットとタイトル、右に日付と歯車。
2. プライマリボタン: ティール背景、角丸8px、hoverで浮き。
3. テーブル: 偶数行着色、hover着色、行高36px程度、スクロール前提。
4. リハトグル:
   - 未選択: 薄い境界・淡色
   - あり: ティール塗り
   - なし: 薄橙系塗り
   - 要入力: 赤系境界
5. 性別バッジ:
   - 男性: `--male-bg/--male-txt`
   - 女性: `--female-bg/--female-txt`

## 5. データ契約

### 5.1 ChatGPT抽出JSON

```json
[
  {"age": 75, "gender": "男性"},
  {"age": 54, "gender": "女性"}
]
```

1. `age`: 整数 `1..150`
2. `gender`: `"男性"` or `"女性"`（入力揺れは正規化）
3. 診断名とrehabは含まない

### 5.2 GAS送信JSON（recordBatch）

```json
{
  "secret": "xxx",
  "action": "recordBatch",
  "doctorId": "12345",
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "records": [
    {
      "clientRecordId": "550e8400-e29b-41d4-a716-446655440000_0",
      "timestamp": "2026-02-27T20:00:00",
      "age": 75,
      "gender": "男性",
      "diagnoses": ["右変形性膝関節症", "", "", "", "", ""],
      "rehab": true,
      "remarks": ""
    }
  ]
}
```

### 5.3 冪等性ルール

1. `batchId` は「ChatGPTから取得」時にUUID生成。
2. `clientRecordId = batchId + "_" + index` を送信時に付与。
3. GAS側ハッシュキーは `simpleHash(clientRecordId)` を採用。
4. 再送時は同一 `batchId` を使うため重複追加しない。
5. 成功時のみ `currentBatchId` をクリア。失敗時は保持。

## 6. popup 画面仕様

`popup.js` が `showScreen(name)` で以下5画面を管理する。

1. `SCREEN_SETUP`
2. `SCREEN_MAIN`
3. `SCREEN_CONFIRM`
4. `SCREEN_DONE`
5. `SCREEN_SETTINGS`

### 6.1 SCREEN_SETUP

#### 表示条件

`gasUrlProd` または `apiSecret` が未設定なら起動時に強制表示。

#### 入力項目

1. GAS URL（本番） `gasUrlProd`
2. GAS URL（開発） `gasUrlDev`（任意）
3. シークレットキー `apiSecret`
4. 社員番号 `doctorId`
5. 診断名マスタ（1行1診断名）

#### 保存先

1. `chrome.storage.local`: `gasUrlProd`, `gasUrlDev`, `doctorId`, `diagnosisMaster[]`, `diagnosisCount{}`
2. `chrome.storage.session`: `apiSecret`

#### バリデーション

1. `gasUrlProd` 必須
2. `apiSecret` 必須
3. `doctorId` 必須
4. `diagnosisMaster` 1件以上必須

### 6.2 SCREEN_MAIN

#### ツールバー

1. `ChatGPTから取得` ボタン
2. 日付ピッカー（初期値: 今日）
3. 未選択件数表示
4. `次の未選択へ` ボタン（最初の `rehab === null` 行へスクロール）

#### テーブル

1. 年齢: `<input type="number" min="1" max="150">`
2. 性別: `<select>男性/女性/その他</select>`
3. 診断名: カスタムドロップダウン（検索 + 使用回数順上位5件）
4. リハ: あり/なしトグル（未選択時は強調）
5. 未選択行: 赤ボーダー表示

#### フッター

1. 本番/開発トグル（`currentMode: "prod"|"dev"`）
2. `全件送信（N件）` ボタン
3. ステータス表示領域

#### 送信ボタン有効条件

1. 患者件数 > 0
2. 全行で `rehab !== null`
3. URL/secret/doctorId が揃っている

### 6.3 SCREEN_CONFIRM

1. テーブルは読み取り専用表示。
2. 合計件数、あり/なし件数、日付、医師IDのサマリーを表示。
3. `戻って修正` で MAINへ戻る（状態維持）。
4. `送信する` 押下で即disabled、`sendRecord` 実行。

### 6.4 SCREEN_DONE

1. 成功メッセージと送信時刻を表示。
2. `currentBatchId` を session から削除。
3. `todayCount` を local に加算。
4. `ChatGPTから取得` で次バッチ開始。

### 6.5 SCREEN_SETTINGS

1. setup項目の再編集UIを提供。
2. 診断名マスタを使用回数順で表示・編集。
3. 誤送信時の対処文言を表示（スプシ直接編集）。
4. secretローテーション手順を表示。

## 7. popup.js 状態管理

```javascript
let patients = [];
let currentBatchId = null;
let currentScreen = "SETUP";
let currentMode = "prod";
```

### batchId運用

1. `ChatGPTから取得` 時に `crypto.randomUUID()` 生成して session 保存。
2. 初期化時に `chrome.storage.session.get("currentBatchId")` で復元。
3. 送信成功時に削除。
4. 送信失敗時は保持。

### clientRecordId

```javascript
clientRecordId = `${currentBatchId}_${index}`;
```

### 診断名使用回数

1. 診断名選択ごとに `diagnosisCount[name]++`。
2. local保存後、上位5件を再計算。

### 不変条件

1. `chrome.storage.session`: `apiSecret`, `currentBatchId` のみ。
2. 患者配列は永続storageに保存しない。
3. sessionのAccessLevelを変更しない。

## 8. content.js 仕様

### 実装方式

1. `chrome.runtime.onMessage` は使わない。
2. `chrome.scripting.executeScript` で純粋関数を注入して戻り値を受け取る。
3. `allFrames: false` を明示し、`results[0].result` のみ採用。

### 抽出優先順（重複取得防止）

1. `pre > code` を探索し順次パース（採用したら即終了）
2. `code` 単体を探索
3. `pre` 単体を探索
4. 全失敗で `{ success:false, error:"JSONが見つかりません" }`

### 妥当性チェック

1. パース成功かつ配列かつ `length > 0` が必須。
2. 空配列は `{ success:false, error:"患者データが空です" }`
3. 各要素:
   - `age`: `Number.isInteger(age) && age >= 1 && age <= 150`
   - `gender`: 男/男性 -> 男性、女/女性 -> 女性、それ以外 -> その他
4. 一件でも不正なら失敗レスポンス。
5. 成功時は `{ success:true, patients:[{age,gender}...] }` を返す。

## 9. sendRecord.js 仕様

1. `fetch` POST with JSON body。
2. `AbortController` 30秒タイムアウト。
3. タイムアウト/ネットワークエラー時はUIへエラー返却。
4. 成功判定は HTTP成功かつ JSON `success:true`。
5. エラー時は `currentBatchId` を消さない。

## 10. GAS仕様

### 10.1 CONFIG

```javascript
const CONFIG = {
  SPREADSHEET_ID: "1ECE1pPn58spv-Q5TVvkF_9fFhcBp5CcCf-qBTeHHwA8",
  MASTER_SHEET_NAME: "RehaTrueFalse",
  JSON_FOLDER_ID: "135AjBdyPjlPfMzpZurJJM1B3_6wXQa7k",
  RECENT_HASH_LIMIT: 200
};
```

### 10.2 setupSecret

```javascript
function setupSecret() {
  PropertiesService.getScriptProperties().setProperty("API_SECRET", "YOUR_SECRET_HERE");
}
```

### 10.3 Validation.gs

1. `age`: 1-150整数
2. `rehab`: Boolean必須
3. `diagnoses`: 配列必須
4. `normalizeGender`: 男/男性, 女/女性, その他
5. `diagnoses`: 各100文字まで、6件に調整
6. `remarks`: 200文字まで

### 10.4 doPost

1. secret認証
2. action分岐:
   - `record`
   - `recordBatch`
   - `dailyReport`
3. 不正actionはエラー
4. 例外はcatchして `success:false`

### 10.5 handleRecordBatch

1. `records` 非空必須
2. `batchId` 必須
3. 各recordで `clientRecordId` 必須
4. 全件検証で1件でもNGなら全体エラー
5. `LockService.getScriptLock().waitLock(30000)` で排他
6. `appendRecordBatch` で一括処理

### 10.6 appendRecordBatch

1. 直近 `RECENT_HASH_LIMIT` 件のhashを1回取得
2. 各recordを `simpleHash(clientRecordId)` で重複確認
3. 重複以外のみ `rowsToWrite` に追加
4. `setValues` は1回で実行
5. 戻り値: `{ success:true, written, skipped }`

### 10.7 互換性保持

以下は削除せず残す。

1. `handleRecord(body)`
2. `appendRecord(body, normalized)`
3. `JSON_FOLDER_ID`

### 10.8 集計関数群（v7から変更なし）

下記をそのまま移植する。

1. `handleDailyReport(date)`
2. `getOrCreateReportFolder()`
3. `mainFlow()`
4. `calcOverallRehabRateForNewPatients()`
5. `calcRehabRateByDiagnosis()`
6. `calcDailyRehabRateForNewPatients()`
7. `calcRehabRateByDiagnosisToRehaSymptom()`
8. `calcRehabRateByAgeAndSex()`
9. `normalizeDiagnosis(str)`
10. `normalizeSex(str)`
11. `getAgeBand(age)`
12. `ageBandSortKey(label)`
13. `getMonthlySheetName(prefix)`
14. `createDailyTrigger()`
15. `simpleHash(str)`
16. `jsonResponse(obj)`

### 10.9 集計実装注意

1. ループ内の `getRange/getValue` を禁止。
2. 冒頭で `getValues()` 一括取得して処理する。
3. トリガーは `atHour(14)` で14時台ランダム実行であることをコメントに明記。

## 11. デプロイ手順（確定）

### GAS

1. 新規プロジェクト作成
2. `Code.gs` / `Validation.gs` を反映
3. `setupSecret()` 実行
4. Webアプリデプロイ（実行ユーザー:自分、アクセス:全員）
5. 再デプロイ時は「既存のデプロイを更新」でURL固定
6. 発行URLを拡張設定へ入力
7. `createDailyTrigger()` 実行
8. 通知設定で失敗メール受信先を確認

### Chrome拡張

1. `chrome://extensions/` で開発者モードON
2. パッケージ化されていない拡張機能を読み込む
3. `chrome-extension/` を指定
4. 初回セットアップ入力（本番URL、必要なら開発URL、secret、doctorId、診断名マスタ）

## 12. 受け入れ基準

1. SETUP未完了時はMAINに進めない。
2. JSON抽出は `pre>code -> code -> pre` 優先で二重取得しない。
3. 年齢/性別はMAINで編集できる。
4. `rehab` 未選択が1件でもあれば送信導線が無効。
5. CONFIRMで読み取り専用サマリー確認後に送信できる。
6. 失敗時は同一 `currentBatchId` で再送できる。
7. 成功時は `currentBatchId` が消える。
8. GAS側で同一 `clientRecordId` は `skipped` となる。
9. 日次集計トリガーで14時台実行できる。
