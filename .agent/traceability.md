# 診療記録くん v8 要件トレーサビリティ表

要件と実装・テストを1対1で追跡するための表。

| Req ID | 要件 | 実装先 | テスト先 | 状態 | エビデンス |
|---|---|---|---|---|---|
| UI-001 | 初回起動時にSETUPを強制表示 | `popup.js` | `popup.test.js` #1,#2,#4 | 完了 | vitest pass |
| UI-002 | 5画面を `showScreen()` で管理 | `popup.js` | `popup.test.js` #10,#11,#12 | 完了 | vitest pass |
| UI-003 | MAINに日付ピッカーを表示 | `popup.html`,`popup.js` | `popup.test.js` #17 | 完了 | vitest pass + popup.html |
| UI-004 | 「次の未選択へ」ジャンプ | `popup.js` | `popup.test.js` #9 | 完了 | vitest pass |
| UI-005 | `rehab` 未選択時は送信不可 | `popup.js` | `popup.test.js` #7,#8 | 完了 | vitest pass |
| UI-006 | CONFIRM画面で読み取り専用表示 | `popup.js` | `popup.test.js` #10,#11 | 完了 | vitest pass |
| UI-007 | 送信成功後にDONE遷移 | `popup.js` | `popup.test.js` #12 | 完了 | vitest pass |
| UI-008 | 設定画面でURL/secret/doctorId編集 | `popup.js` | `popup.test.js` #3,#4 | 完了 | vitest pass |
| UI-009 | 開発/本番トグル切替 | `popup.js` | `popup.test.js` #16 | 完了 | vitest pass |
| UI-010 | 診断名ドロップダウン上位5件 | `popup.js` | `popup.test.js` #18,#19,#21 | 完了 | vitest pass |
| EXT-001 | manifest v3/permission固定 | `manifest.json` | 静的確認 | 完了 | `node` でmanifest parse確認 |
| EXT-002 | アイコン 16/48/128 を設定 | `icons/*`,`manifest.json` | 静的確認 | 完了 | Pillowでサイズ検証 |
| EXT-003 | executeScriptはallFrames:false | `popup.js` | `popup.test.js` #5,#6 | 完了 | vitest pass + 実装確認 |
| EXT-004 | content抽出優先順 pre>code>pre | `content.js` | `content.test.js` #1-#5,#13 | 完了 | vitest pass |
| EXT-005 | age整数1..150、gender正規化 | `content.js` | `content.test.js` #8-#12 | 完了 | vitest pass |
| DATA-001 | batchId生成/保持/成功時クリア | `popup.js` | `popup.test.js` #5,#14,#20 | 完了 | vitest pass |
| DATA-002 | clientRecordId=`batchId_index` | `popup.js`,`sendRecord.js` | `sendRecord.test.js` #6 | 完了 | vitest pass |
| DATA-003 | 患者データはstorageへ保存しない | `popup.js` | `popup.test.js` (副作用確認) | 完了 | vitest pass + 実装確認 |
| NET-001 | 30秒timeout | `sendRecord.js` | `sendRecord.test.js` #5 | 完了 | vitest pass |
| NET-002 | network/HTTP/businessエラー分岐 | `sendRecord.js` | `sendRecord.test.js` #2,#3,#4 | 完了 | vitest pass |
| GAS-001 | doPostのみでaction分岐 | `gas/Code.gs` | `Code.test.gs` | 実装完了 | 手動実行待ち |
| GAS-002 | secret認証 | `gas/Code.gs` | `Code.test.gs` #11 | 実装完了 | 手動実行待ち |
| GAS-003 | recordBatch全件検証 | `gas/Code.gs`,`gas/Validation.gs` | `Code.test.gs` #3,#4,#5,#6,#13 | 実装完了 | 手動実行待ち |
| GAS-004 | 冪等性キーclientRecordId | `gas/Code.gs` | `Code.test.gs` #7,#8,#9,#10 | 実装完了 | 手動実行待ち |
| GAS-005 | Spreadsheet APIバッチ化 | `gas/Code.gs` | コードレビュー | 完了 | ループ外 `getRange/getValues` |
| GAS-006 | 集計関数群移植 | `gas/Code.gs` | 手動実行 | 実装完了 | GAS環境で確認待ち |
| OPS-001 | デプロイ時は既存デプロイ更新 | 運用手順 | 手順レビュー | 未着手 | GAS実環境操作が必要 |
| OPS-002 | createDailyTrigger atHour(14) | `gas/Code.gs` | 手動実行 | 実装完了 | GAS実行確認待ち |

## 運用ルール

1. 新要件追加時は必ずReq IDを採番してこの表に追記する。
2. 実装PRには、該当Req IDをコミットメッセージまたはPR本文へ記載する。
3. テスト不在のReq IDは「未完了」とみなす。
