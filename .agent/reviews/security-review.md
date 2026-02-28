# Security Review (診療記録くん v11)

## Findings (Severity順)

1. High: GAS URLの任意入力により secret/患者データの送信先を誤設定・改ざんできる
- Evidence: [SetupScreen.tsx](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/popup/screens/SetupScreen.tsx:27), [SettingsScreen.tsx](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/popup/screens/SettingsScreen.tsx:22)
- Risk: フィッシングURLや誤入力先へ `apiSecret` と患者データが送信される。
- Recommendation:
  - URLバリデーションを追加 (`https://script.google.com/` または `https://script.googleusercontent.com/` のみ許可)
  - 保存時に `new URL()` でhost/httpsを検証

2. High: スプレッドシート式インジェクション対策が不足
- Evidence: [Validation.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Validation.gs:24), [Validation.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Validation.gs:38)
- Risk: `diagnoses` や `remarks` が `=` `+` `-` `@` で始まる場合、シートで式として評価され得る。
- Recommendation:
  - 保存前に先頭記号をエスケープ（例: `'` prefix）
  - GAS側で `sanitizeForSheet()` を追加

3. Medium: 重複キーの hash 関数が衝突耐性を持たない
- Evidence: [Code.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Code.gs:354)
- Risk: `simpleHash` の衝突で別レコードが誤ってスキップされる可能性。
- Recommendation:
  - `Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, clientRecordId)` に置換

4. Medium: 冪等性保証は直近200件のみで、古い再送は重複書き込み余地がある
- Evidence: [Code.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Code.gs:5), [Code.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Code.gs:87)
- Risk: 再送遅延が大きい運用で重複発生。
- Recommendation:
  - hashの永続インデックスシートを別管理し全期間照合

## Good Practices確認
- `apiSecret` を `storage.session` 保持（永続化回避）: [useStorage.ts](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/popup/hooks/useStorage.ts:29)
- 送信タイムアウト（30秒）: [sendBatch.ts](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/sendBatch.ts:45)
- サーバー側二重防衛（age/rehab/diagnoses[0]）: [Validation.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Validation.gs:1)
