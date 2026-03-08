# 診療記録くん v11 仕様固定版

この文書は v11 指示書を実装可能な粒度に固定した仕様書。

## 1. 全体ワークフロー

1. スクリーンショット作成時は氏名/患者IDを含めない。
2. ChatGPTに画像貼り付けし、`[{age, gender}]` を取得する。
3. popup起動（初回SETUP強制、途中入力はsession復元）。
4. `ChatGPTから取得` で `content/extractPatients.ts` 実行し patients 化。
5. 年齢/性別編集、診断名（必須）、rehab（必須）を入力。
6. `全件送信` -> `CONFIRM` -> `送信する`。
7. GAS `recordBatch` で一括検証・重複判定・追記。
8. 送信成功後に診断名使用回数を更新。
9. 14時台トリガーで集計。

## 2. 技術スタック

1. popup: React 18 + TypeScript
2. build: Vite
3. style: CSS Modules
4. state: `useState` / `useReducer`
5. test: vitest + RTL
6. content: TypeScriptのみ（React/外部モジュール不可）
7. GAS: JavaScript

## 3. ディレクトリ（固定）

```text
chrome-extension/
├── public/
│   ├── manifest.json
│   └── icons/icon16.png icon48.png icon128.png
├── src/
│   ├── types.ts
│   ├── sendBatch.ts
│   ├── popup/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── app.module.css
│   │   ├── hooks/useAppState.ts useStorage.ts useDiagnosis.ts
│   │   ├── screens/SetupScreen.tsx MainScreen.tsx ConfirmScreen.tsx DoneScreen.tsx SettingsScreen.tsx
│   │   └── components/Header.tsx DiagDropdown.tsx RehabToggle.tsx PatientRow.tsx ModeToggle.tsx
│   └── content/extractPatients.ts
├── __tests__/
│   ├── setup.ts
│   ├── extractPatients.test.ts
│   ├── sendBatch.test.ts
│   ├── App.test.tsx
│   ├── screens/*.test.tsx
│   └── components/*.test.tsx
├── popup.html
├── vite.config.ts
├── tsconfig.json
└── package.json

gas/
├── Code.gs
├── Validation.gs
└── Code.test.gs
```

## 4. 設定固定値

## 4.1 package.json（必須）

1. `react`, `react-dom`
2. devDeps: `typescript`, `vite`, `vitest`, `@vitejs/plugin-react`, `@testing-library/*`, `jsdom`, `@types/*`, `@types/chrome`
3. scripts:
   - `dev`: `vite build --watch`
   - `build`: `vite build`
   - `test`: `vitest run`
   - `test:ui`: `vitest --ui`

## 4.2 vite.config.ts

1. plugin: `react()`
2. `outDir: dist`
3. input: `popup.html`
4. `publicDir: public`
5. vitest env: `jsdom`, setup `__tests__/setup.ts`

## 4.3 manifest（public/manifest.json）

1. `manifest_version: 3`
2. `name: 診療記録くん`
3. `minimum_chrome_version: "105"`
4. `permissions: activeTab, scripting, storage`
5. `host_permissions: script.google.com / script.googleusercontent.com`
6. `tabs` permission は付与しない

## 5. 型契約（src/types.ts）

必須定義:

1. `RawPatient`, `Patient`, `Screen`, `Mode`
2. `AppSettings`, `DiagnosisCount`
3. `AppState`（`lastSubmitResult` 含む）
4. `SubmitResult`, `SessionSnapshot`
5. `BatchRecord`, `BatchPayload`
6. `ExtractResult`, `GasResponse`

## 6. popup状態管理契約（useAppState.ts）

1. `localToday()` はローカル日付（UTCではない）。
2. 起動時に `inputSnapshot` 復元。
3. `patients/batchId/selectedDate/mode` 変更時に session 保存。
4. `DONE` 遷移時に `inputSnapshot` 削除。
5. `canSubmit` 条件:
   - 患者件数 > 0
   - `pendingRehab === 0`
   - `pendingDiag === 0`（`diagnoses[0]` 必須）
   - `hasAgeError === false`

## 7. storage契約（useStorage.ts）

1. `local`: `gasUrlProd`, `gasUrlDev`, `doctorId`, `diagnosisMaster`, `diagnosisCount`
2. `session`: `apiSecret`, `currentBatchId`, `inputSnapshot`
3. `apiSecret` は再起動後消える（仕様）
4. `isConfigured = gasUrlProd && apiSecret && doctorId`

## 8. 診断名契約（useDiagnosis.ts）

1. `top5` は使用回数順
2. `rest` は top5 以外
3. カウント更新は「選択時」ではなく「送信成功後」

## 9. Main/PatientRow契約

1. `ChatGPTから取得`:
   - active tab query
   - `executeScript({ allFrames:false, func: extractPatientsFromDOM })`
   - `results[0].result` 採用
2. `batchId` 生成 -> session保存
3. `gasUrlDev` 空なら ModeToggle 非表示
4. `PatientRow`:
   - `isValidAge`
   - pendingは `rehab===null || !diagnoses[0].trim()`
   - age error時は送信不可

## 10. Confirm/Done契約

1. Confirm送信:
   - `SUBMIT_START`
   - `sendBatch(...)`
   - 成功時に `diagnosis.incrementCounts(sentDiagNames)`
   - `SUBMIT_SUCCESS` で `lastSubmitResult` 保存
2. Done表示:
   - `written`, `skipped`, `submittedAt`, `batchId(先頭8文字表示)`

## 11. sendBatch.ts 契約

1. 前提:
   - `currentBatchId` 必須
   - `patients` 非空
2. `timestamp`:
   - `selectedDate + local time`
   - index秒オフセット
3. `diagnoses` は6要素補完
4. fetch:
   - `POST`, `redirect: follow`, JSON body
   - `AbortController(30s)`
5. レスポンス:
   - `res.text()` -> `JSON.parse`
   - 非JSONは先頭200文字付きエラー

## 12. content/extractPatients.ts 契約

探索はグループ優先 + 各グループ末尾優先。

1. `pre > code`（末尾から）
2. `code:not(pre > code)`（末尾から）
3. `pre:not(:has(code))`（末尾から）

判定:

1. JSON parse可能
2. 配列
3. 空配列はエラー
4. age: 1..150整数
5. gender正規化: 男系->男性、女系->女性、他->その他

## 13. GAS仕様固定

## 13.1 CONFIG

```javascript
const CONFIG = {
  SPREADSHEET_ID:    "1ECE1pPn58spv-Q5TVvkF_9fFhcBp5CcCf-qBTeHHwA8",
  MASTER_SHEET_NAME: "RehaTrueFalse",
  JSON_FOLDER_ID:    "135AjBdyPjlPfMzpZurJJM1B3_6wXQa7k",
  RECENT_HASH_LIMIT: 200,
};
```

## 13.2 シート列（15列）

1. A timestamp
2. B hashKey
3. C doctorId
4. D batchId
5. E clientRecordId
6. F age
7. G gender
8. H diagnoses[0]
9. I diagnoses[1]
10. J diagnoses[2]
11. K diagnoses[3]
12. L diagnoses[4]
13. M diagnoses[5]
14. N rehab
15. O remarks

## 13.3 Validation.gs

1. age整数1..150
2. rehab Boolean
3. diagnoses配列
4. `diagnoses[0]` 必須
5. gender正規化

## 13.4 recordBatch

1. `records` 非空
2. `batchId` 必須
3. `doctorId` 必須
4. 各record `clientRecordId` 必須
5. 全件バリデーション（1件NGで全体NG）
6. lock + `SpreadsheetApp.flush()` + unlock
7. hashは `simpleHash(clientRecordId)`
8. 直近200件で重複判定
9. `setValues` は15列で一括

## 13.5 集計関数群

v10同等を移植し、列インデックスを v11 列へ更新する。

1. age: 6列目
2. gender: 7列目
3. diagnosis0: 8列目
4. rehab: 14列目

## 14. テスト対象マップ

1. content: `extractPatients.test.ts`
2. send: `sendBatch.test.ts`
3. app/screen/component: RTL tests
4. GAS: `Code.test.gs` 手動実行

## 15. デプロイ固定手順

1. `npm install`
2. `npm run build`
3. `dist/` を拡張として読み込む
4. GASへ `Code.gs`/`Validation.gs` 反映
5. RehaTrueFalse ヘッダー15列化
6. `setupDoctorSecretMap()` 実行
7. Webアプリ更新は「既存のデプロイを更新」
8. `createDailyTrigger()` 実行
