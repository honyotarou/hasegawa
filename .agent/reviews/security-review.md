# Security Review (診療記録くん v11)

## Findings (Severity順)

1. Medium: 設定画面側ではGAS URLのhost検証が不足
- Evidence: [SetupScreen.tsx](chrome-extension/src/popup/screens/SetupScreen.tsx#L23), [SettingsScreen.tsx](chrome-extension/src/popup/screens/SettingsScreen.tsx#L24)
- Status:
  - Setup画面は `https://script.google.com` / `https://script.googleusercontent.com` 限定で保存可能（改善済み）。
  - Settings画面は同等の検証が未適用（残課題）。
- Recommendation:
  - Settings保存時にも同じURL検証を適用し、無効URLは保存拒否。

2. High: スプレッドシート式インジェクション対策が不足
- Evidence: [Validation.gs](gas/Validation.gs#L24), [Validation.gs](gas/Validation.gs#L38)
- Risk: `diagnoses` や `remarks` が `=` `+` `-` `@` で始まる場合、シートで式として評価され得る。
- Recommendation:
  - 保存前に先頭記号をエスケープ（例: `'` prefix）
  - GAS側で `sanitizeForSheet()` を追加

3. Low: `simpleHash` の衝突可能性は残るが誤スキップは回避済み
- Evidence: [Code.gs](gas/Code.gs#L90), [Code.gs](gas/Code.gs#L115)
- Status:
  - hash一致時に `clientRecordId` まで照合するため、衝突だけでスキップされる問題は解消済み。
- Recommendation:
  - 監査容易性向上のため将来的には SHA-256 文字列化も検討。

4. Medium: 冪等性保証は直近200件のみで、古い再送は重複書き込み余地がある
- Evidence: [Code.gs](gas/Code.gs#L5), [Code.gs](gas/Code.gs#L87)
- Risk: 再送遅延が大きい運用で重複発生。
- Recommendation:
  - hashの永続インデックスシートを別管理し全期間照合

## Good Practices確認
- `apiSecret` を `storage.session` 保持（永続化回避）: [useStorage.ts](chrome-extension/src/popup/hooks/useStorage.ts#L34)
- 送信タイムアウト（30秒）: [sendBatch.ts](chrome-extension/src/sendBatch.ts#L45)
- サーバー側二重防衛（age/rehab/diagnoses[0] + objガード）: [Validation.gs](gas/Validation.gs#L1)
- storage/session操作失敗時のcatch実装: [useAppState.ts](chrome-extension/src/popup/hooks/useAppState.ts#L112), [useDiagnosis.ts](chrome-extension/src/popup/hooks/useDiagnosis.ts#L8)
