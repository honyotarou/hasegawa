# v11 要件トレーサビリティ

| Req ID | 要件 | 実装先 | テスト先 | 状態 |
|---|---|---|---|---|
| ARCH-001 | React+TS+Vite 構成 | `chrome-extension/*` | build確認 | 未着手 |
| MAN-001 | MV3 + minChrome105 | `public/manifest.json` | 静的確認 | 未着手 |
| MAN-002 | tabs権限なし | `public/manifest.json` | 静的確認 | 未着手 |
| FLOW-001 | session復元 | `useAppState.ts` | Main/App test | 未着手 |
| FLOW-002 | DONEでsnapshot削除 | `useAppState.ts` | Confirm/Done test | 未着手 |
| FLOW-003 | canSubmit=rehab+diag+age | `useAppState.ts` | Main/hook test | 未着手 |
| UI-001 | Setup強制表示 | `App.tsx` | App/Setup test | 未着手 |
| UI-002 | gasUrlDev空でtoggle非表示 | `MainScreen.tsx` | MainScreen test | 未着手 |
| UI-003 | pendingジャンプ | `MainScreen.tsx` | MainScreen test | 未着手 |
| UI-004 | PatientRow ageエラー表示 | `PatientRow.tsx` | Main/PatientRow test | 未着手 |
| UI-005 | Confirm送信成功でDONE | `ConfirmScreen.tsx` | Confirm test | 未着手 |
| UI-006 | Doneでwritten/skipped/batch表示 | `DoneScreen.tsx` | Done test | 未着手 |
| DATA-001 | 診断名カウントは送信成功後 | `useDiagnosis.ts`,`ConfirmScreen.tsx` | Confirm/useDiagnosis test | 未着手 |
| SEND-001 | clientRecordId生成 | `sendBatch.ts` | sendBatch test | 未着手 |
| SEND-002 | timestampローカル時刻+1秒オフセット | `sendBatch.ts` | sendBatch test | 未着手 |
| SEND-003 | res.text()->JSON.parse | `sendBatch.ts` | sendBatch test | 未着手 |
| SEND-004 | non-json error message | `sendBatch.ts` | sendBatch test | 未着手 |
| EXT-001 | extract優先順+末尾探索 | `extractPatients.ts` | extractPatients test | 未着手 |
| EXT-002 | age整数契約 | `extractPatients.ts` | extractPatients test | 未着手 |
| GAS-001 | recordBatch doctorId/batchId必須 | `Code.gs` | Code.test.gs | 未着手 |
| GAS-002 | diagnoses[0]必須二重防衛 | `Validation.gs` | Code.test.gs | 未着手 |
| GAS-003 | 15列書き込み | `Code.gs` | Code.test.gs | 未着手 |
| GAS-004 | hash=clientRecordId | `Code.gs` | Code.test.gs | 未着手 |
| GAS-005 | 集計列参照 v11更新 | `Code.gs` | 手動実行 | 未着手 |
| OPS-001 | 既存デプロイ更新でURL固定 | 運用手順 | 手順確認 | 未着手 |
| OPS-002 | trigger 14時台 | `createDailyTrigger()` | 手動実行 | 未着手 |

## 運用ルール

1. 実装着手時に該当Req IDをPR/コミットへ記載する。
2. 対応完了時に状態を `完了` または `実環境確認待ち` へ更新する。
3. テストが紐づかないReqは完了扱いにしない。

