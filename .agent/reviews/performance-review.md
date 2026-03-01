# Performance Review (診療記録くん v11)

## Measured Results
- Unit/UI: 76 tests pass
- Coverage: 95.20% (statement)
- Bench:
  - `sendBatch` 40件 payload 生成+応答parse: 約21,774 ops/s
  - `extractPatients` 40件 parse: 約15,691 ops/s
- Evidence: latest local run (`npm run test:coverage`, `npm run bench`)

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

## Immediate Wins
- snapshot debounce（UI）
- `PatientRow` の `React.memo` 化
