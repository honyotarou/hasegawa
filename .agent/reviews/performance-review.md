# Performance Review (診療記録くん v11)

## Measured Results
- Unit/UI: 114 tests pass
- E2E: 4 scenarios pass
- Coverage: 96.52% (statement)
- Bench (3 runs median):
  - `sendBatch` 40件 payload 生成+応答parse: 約49,062 ops/s
  - `extractPatients` 40件 parse: 約16,416 ops/s
- Evidence: latest local run on 2026-03-03 (`npm run test`, `npm run test:e2e`, `npm run test:coverage`, `npm run bench`)

## Findings
1. Fixed in this run: session snapshot保存を250msデバウンス化
- Evidence: [useAppState.ts](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/popup/hooks/useAppState.ts:126)
- Effect: 連続入力時の `chrome.storage.session.set` 呼び出し回数を抑制。

2. Fixed in this run: `sendBatch` のURL検証をキャッシュ化してhot pathを高速化
- Evidence: [sendBatch.ts](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/sendBatch.ts:3)
- Effect: セキュリティ検証（許可ドメイン制限）を維持したまま、同一URL送信時の `new URL(...)` 反復コストを削減。

3. Fixed in this run: GAS重複判定を hash+clientRecordId + 内容照合へ強化
- Evidence: [Code.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Code.gs:260)
- Effect: 単件経路でも hash衝突だけで誤スキップされるリスクを削減。

4. Low: MainScreen で無条件再描画される部分が多い
- Evidence: [MainScreen.tsx](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/popup/screens/MainScreen.tsx:72)
- Impact: 患者行が多いと入力ごとに全行再描画。
- Recommendation: `PatientRow` を `React.memo` 化、dispatch callback を `useCallback` 化。

5. Low: カバレッジ未到達領域は `ConfirmScreen` の一部エラーパスと `sync-evidence-register` CLI分岐が中心
- Evidence: `test:coverage` report (`scripts/sync-evidence-register.mjs`)
- Impact: 実運用で問題化しづらいが、CLI entryのエラーパスが未到達。
- Recommendation: E2EのCLIテスト（spawn）を追加し、`main`直叩き分岐を検証する。

6. Low: 監査ログ自動追記で `recordBatch` 1回あたりシート書き込みが1回増える
- Evidence: [Code.gs](gas/Code.gs#L145), [Code.gs](gas/Code.gs#L351)
- Impact: 高トラフィック時のGAS実行時間が微増。
- Recommendation: 将来負荷増大時は `AuditEvidence` をバッチappend（`setValues`）へ変更。

## Immediate Wins
- `PatientRow` の `React.memo` 化
