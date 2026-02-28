# Performance Review (診療記録くん v11)

## Measured Results
- Unit/UI: 63 tests pass
- Coverage: 95.05% (statement)
- Bench:
  - `sendBatch` 40件 payload 生成+応答parse: 約49,821 ops/s
  - `extractPatients` 40件 parse: 約16,383 ops/s
- Evidence: [v11-bench.log](/Users/apple/Documents/GitHub/hasegawa/.agent/logs/v11-bench.log), [v11-coverage-final.log](/Users/apple/Documents/GitHub/hasegawa/.agent/logs/v11-coverage-final.log)

## Findings
1. Medium: 入力中の session snapshot 書き込み頻度が高い
- Evidence: [useAppState.ts](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/popup/hooks/useAppState.ts:121)
- Impact: 患者数40件で頻繁に `chrome.storage.session.set` が走り、低スペック端末で入力遅延の要因。
- Recommendation: 250-500ms debounce、または dirty flag + 画面遷移時保存。

2. Fixed in this run: GAS重複判定を `Set.has` へ変更
- Evidence: [Code.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Code.gs:105)
- Effect: `RECENT_HASH_LIMIT` 拡張時でも lookup は O(1) に改善。

3. Low: MainScreen で無条件再描画される部分が多い
- Evidence: [MainScreen.tsx](/Users/apple/Documents/GitHub/hasegawa/chrome-extension/src/popup/screens/MainScreen.tsx:72)
- Impact: 患者行が多いと入力ごとに全行再描画。
- Recommendation: `PatientRow` を `React.memo` 化、dispatch callback を `useCallback` 化。

## Immediate Wins
- snapshot debounce（UI）
