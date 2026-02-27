# 診療記録くん v8 要件トレーサビリティ表

要件と実装・テストを1対1で追跡するための表。

| Req ID | 要件 | 実装先 | テスト先 | 合格条件 |
|---|---|---|---|---|
| UI-001 | 初回起動時にSETUPを強制表示 | `popup.js` | `popup.test.js` #1,#2,#4 | 必須設定不足ならMAINへ遷移しない |
| UI-002 | 5画面を `showScreen()` で管理 | `popup.js` | `popup.test.js` #10,#11,#12 | MAIN/CONFIRM/DONE遷移が成立 |
| UI-003 | MAINに日付ピッカーを表示 | `popup.html`,`popup.js` | `popup.test.js` #17 | 日付変更がtimestampへ反映 |
| UI-004 | 「次の未選択へ」ジャンプ | `popup.js` | `popup.test.js` #9 | 最初のnull行へスクロール |
| UI-005 | `rehab` 未選択時は送信不可 | `popup.js` | `popup.test.js` #7,#8 | nullが1件でも送信導線無効 |
| UI-006 | CONFIRM画面で読み取り専用表示 | `popup.js` | `popup.test.js` #10,#11 | 送信前に確認画面を通る |
| UI-007 | 送信成功後にDONE遷移 | `popup.js` | `popup.test.js` #12 | 成功時のみDONE表示 |
| UI-008 | 設定画面でURL/secret/doctorId編集 | `popup.js` | `popup.test.js` #3,#4 | 保存成功/失敗が分岐 |
| UI-009 | 開発/本番トグル切替 | `popup.js` | `popup.test.js` #16 | dev選択時はdev URL送信 |
| UI-010 | 診断名ドロップダウン上位5件 | `popup.js` | `popup.test.js` #18,#19,#21 | 使用回数で表示順更新 |
| EXT-001 | manifest v3/permission固定 | `manifest.json` | 手動確認 | 拡張読み込みエラーなし |
| EXT-002 | アイコン 16/48/128 を設定 | `icons/*`,`manifest.json` | 手動確認 | ツールバー/管理画面で表示 |
| EXT-003 | executeScriptはallFrames:false | `popup.js` | `popup.test.js` #5,#6 | `results[0].result` を採用 |
| EXT-004 | content抽出優先順 pre>code>pre | `content.js` | `content.test.js` #1-#5,#13 | 二重取得なしで先勝ち採用 |
| EXT-005 | age整数1..150、gender正規化 | `content.js` | `content.test.js` #8-#12 | 不正を弾き、正規化成功 |
| DATA-001 | batchId生成/保持/成功時クリア | `popup.js` | `popup.test.js` #5,#14,#20 | 再送時に同一batchId |
| DATA-002 | clientRecordId=`batchId_index` | `popup.js`,`sendRecord.js` | `sendRecord.test.js` #6 | 全recordに付与 |
| DATA-003 | 患者データはstorageへ保存しない | `popup.js` | `popup.test.js` (副作用確認) | session/localに患者本体なし |
| NET-001 | 30秒timeout | `sendRecord.js` | `sendRecord.test.js` #5 | timeout時にabortエラー |
| NET-002 | network/HTTP/businessエラー分岐 | `sendRecord.js` | `sendRecord.test.js` #2,#3,#4 | 適切なエラー文言を返す |
| GAS-001 | doPostのみでaction分岐 | `gas/Code.gs` | `Code.test.gs` | record/recordBatch/dailyReport分岐 |
| GAS-002 | secret認証 | `gas/Code.gs` | `Code.test.gs` #11 | 不正secretで拒否 |
| GAS-003 | recordBatch全件検証 | `gas/Code.gs`,`gas/Validation.gs` | `Code.test.gs` #3,#4,#5,#6,#13 | 1件NGで全体エラー |
| GAS-004 | 冪等性キーclientRecordId | `gas/Code.gs` | `Code.test.gs` #7,#8,#9,#10 | 再送時にskipped |
| GAS-005 | Spreadsheet APIバッチ化 | `gas/Code.gs` | コードレビュー | ループ内getRange/getValueなし |
| GAS-006 | 集計関数群移植 | `gas/Code.gs` | 手動実行 | mainFlowとdailyReportが動作 |
| OPS-001 | デプロイ時は既存デプロイ更新 | 運用手順 | 手順レビュー | URLが変わらない |
| OPS-002 | createDailyTrigger atHour(14) | `gas/Code.gs` | 手動実行 | 14時台トリガー作成成功 |

## 運用ルール

1. 新要件追加時は必ずReq IDを採番してこの表に追記する。
2. 実装PRには、該当Req IDをコミットメッセージまたはPR本文へ記載する。
3. テスト不在のReq IDは「未完了」とみなす。

