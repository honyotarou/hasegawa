# Performance Review (診療記録くん v11)

## Measured Results
- Unit/UI: 93 tests pass
- E2E: 2 scenarios pass（前回計測値）
- Coverage: 96.56% (statement)
- Bench:
  - `sendBatch` 40件 payload 生成+応答parse: 約50,604 ops/s
  - `extractPatients` 40件 parse: 約17,170 ops/s
- Evidence: latest local run (`npm run test`, `npm run bench`)

## Findings
1. Medium: 入力中の session snapshot 書き込み頻度が高い
- Evidence: [useAppState.ts](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/popup/hooks/useAppState.ts:121)
- Impact: 患者数40件で頻繁に `chrome.storage.session.set` が走り、低スペック端末で入力遅延の要因。
- Recommendation: 250-500ms debounce、または dirty flag + 画面遷移時保存。

2. Fixed in this run: GAS重複判定を hash+clientRecordId のmap参照へ変更
- Evidence: [Code.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Code.gs:90)
- Effect: hash衝突時の誤スキップを防止しつつ、lookupは map で O(1) 近傍。

3. Low: MainScreen で無条件再描画される部分が多い
- Evidence: [MainScreen.tsx](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/popup/screens/MainScreen.tsx:72)
- Impact: 患者行が多いと入力ごとに全行再描画。
- Recommendation: `PatientRow` を `React.memo` 化、dispatch callback を `useCallback` 化。

4. Low: カバレッジ未到達領域は設定画面の異常系分岐が中心
- Evidence: `test:coverage` report (`SettingsScreen.tsx`, `SetupScreen.tsx`)
- Impact: 本番障害確率は高くないが、設定保存失敗パスの検証粒度が不足。
- Recommendation: 保存失敗・無効URLの分岐テストを追加し branch を底上げする。

5. Low: 監査ログ自動追記で `recordBatch` 1回あたりシート書き込みが1回増える
- Evidence: [Code.gs](gas/Code.gs#L145), [Code.gs](gas/Code.gs#L307)
- Impact: 高トラフィック時のGAS実行時間が微増。
- Recommendation: 将来負荷増大時は `AuditEvidence` をバッチappend（`setValues`）へ変更。

## Immediate Wins
- snapshot debounce（UI）
- `PatientRow` の `React.memo` 化
