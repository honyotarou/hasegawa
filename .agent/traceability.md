# v11 要件トレーサビリティ

| Req ID | 要件 | 実装先 | テスト先 | 状態 |
|---|---|---|---|---|
| ARCH-001 | React+TS+Vite 構成 | `chrome-extension/*` | `npm run build` | 完了 |
| MAN-001 | MV3 + minChrome105 | `public/manifest.json` | 静的確認 | 完了 |
| MAN-002 | tabs権限なし | `public/manifest.json` | 静的確認 | 完了 |
| FLOW-001 | session復元 | `useAppState.ts` | `hooks/useAppState.test.ts` | 完了 |
| FLOW-002 | DONEでsnapshot削除 | `useAppState.ts` | 実機確認（DONE遷移後） | 実環境確認待ち |
| FLOW-003 | canSubmit=rehab+diag+age | `useAppState.ts` | `hooks/useAppState.test.ts`, `screens/MainScreen.test.tsx` | 完了 |
| UI-001 | Setup強制表示 | `App.tsx` | `App.test.tsx`, `screens/SetupScreen.test.tsx` | 完了 |
| UI-002 | gasUrlDev空でtoggle非表示 | `MainScreen.tsx` | `screens/MainScreen.test.tsx` | 完了 |
| UI-003 | pendingジャンプ | `MainScreen.tsx` | `screens/MainScreen.test.tsx` | 完了 |
| UI-004 | PatientRow ageエラー表示 | `PatientRow.tsx` | 実機確認（age不正入力） | 実環境確認待ち |
| UI-005 | Confirm送信成功でDONE | `ConfirmScreen.tsx` | 実機確認（送信成功フロー） | 実環境確認待ち |
| UI-006 | Doneでwritten/skipped/batch表示 | `DoneScreen.tsx` | `screens/DoneScreen.test.tsx` | 完了 |
| DATA-001 | 診断名カウントは送信成功後 | `useDiagnosis.ts`,`ConfirmScreen.tsx` | 実機確認（送信成功後カウント） | 実環境確認待ち |
| SEND-001 | clientRecordId生成 | `sendBatch.ts` | `sendBatch.test.ts` | 完了 |
| SEND-002 | timestampローカル時刻+1秒オフセット | `sendBatch.ts` | `sendBatch.test.ts` | 完了 |
| SEND-003 | res.text()->JSON.parse | `sendBatch.ts` | `sendBatch.test.ts` | 完了 |
| SEND-004 | non-json error message | `sendBatch.ts` | `sendBatch.test.ts` | 完了 |
| EXT-001 | extract優先順+末尾探索 | `extractPatients.ts` | `extractPatients.test.ts` | 完了 |
| EXT-002 | age整数契約 | `extractPatients.ts` | `extractPatients.test.ts` | 完了 |
| GAS-001 | recordBatch doctorId/batchId必須 | `Code.gs` | `Code.test.gs` 手動実行 | 実環境確認待ち |
| GAS-002 | diagnoses[0]必須二重防衛 | `Validation.gs` | `Code.test.gs` 手動実行 | 実環境確認待ち |
| GAS-003 | 15列書き込み | `Code.gs` | `Code.test.gs` + 実シート確認 | 実環境確認待ち |
| GAS-004 | hash=clientRecordId | `Code.gs` | `Code.test.gs` + 再送確認 | 実環境確認待ち |
| GAS-005 | 集計列参照 v11更新 | `Code.gs` | GAS手動実行（dailyReport/mainFlow） | 実環境確認待ち |
| OPS-001 | 既存デプロイ更新でURL固定 | 運用手順 | GASデプロイ実施ログ | 実環境確認待ち |
| OPS-002 | trigger 14時台 | `createDailyTrigger()` | トリガー一覧確認 | 実環境確認待ち |

## 運用ルール

1. 実装着手時に該当Req IDをPR/コミットへ記載する。
2. 対応完了時に状態を `完了` または `実環境確認待ち` へ更新する。
3. テストが紐づかないReqは完了扱いにしない。
