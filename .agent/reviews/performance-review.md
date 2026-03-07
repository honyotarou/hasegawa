# Performance Review (診療記録くん v11)

最終再評価: 2026-03-08

## Measured Results
- Unit/UI: `npm test` -> 25 files / 141 tests pass
- E2E: `npm run test:e2e` -> 5 scenarios pass
- Coverage: `npm run test:coverage` -> Statements 94.60% / Branches 84.54% / Functions 82.92%
- Bench (current working tree, 3 runs median):
  - `sendBatch` 40件 payload 生成 + GAS 応答 parse: `44,043.60 ops/s`
  - `extractPatients` 40件 parse: `16,967.33 ops/s`
- Bench (`main` baseline `d3c8ecf`, 3 runs median):
  - `sendBatch`: `44,745.00 ops/s`
  - `extractPatients`: `17,031.31 ops/s`
- Delta (current vs baseline):
  - `sendBatch`: `-1.57%`
  - `extractPatients`: `-0.38%`
- Note:
  - baseline と current は production code が同一で、差分はテスト追加のみ。上記差は計測ノイズとして扱うのが妥当。

## Findings
1. Medium: `MainScreen` は入力たびに患者行全体を再描画する
- Evidence:
  - `chrome-extension/src/popup/screens/MainScreen.tsx:179`
  - `chrome-extension/src/popup/screens/MainScreen.tsx:186`
- Impact:
  - 患者数が増えると、1人分の編集でも全行が再評価される。
- Recommendation:
  - `PatientRow` を `React.memo` 化する。
  - `onPatch` を患者ごとに安定化させる。

2. Low: セッションスナップショット保存は毎回フル配列を書き戻す
- Evidence:
  - `chrome-extension/src/popup/hooks/useAppState.ts:98`
  - `chrome-extension/src/popup/hooks/useAppState.ts:126`
- Impact:
  - 250ms デバウンス済みだが、患者数に比例して `chrome.storage.session.set` の payload が増える。
- Recommendation:
  - 40件規模では現状維持でよい。
  - 100件超を想定するなら差分保存か圧縮保存を検討する。

3. Low: `extractPatients` fallback は本文全体を走査するため、長文ページでは文字列処理量が増える
- Evidence:
  - `chrome-extension/src/content/extractPatients.ts:118`
  - `chrome-extension/src/content/extractPatients.ts:135`
- Impact:
  - 現ベンチでは十分速いが、巨大な会話ログや記事ページでは text scan が支配的になる。
- Recommendation:
  - fallback root ごとに最大文字数を設ける。
  - patient らしさの高い候補セレクタを先に絞る。

## Immediate Wins
- `PatientRow` の memo 化
- `pending*` 集計と confirm summary を 1 pass に寄せる
- `extractPatients` fallback の入力テキスト上限を決める

## Overall
今回追加した 3 unit tests と 1 E2E test は production hot path を変えていない。現時点のボトルネックはアルゴリズムではなく React 再描画と session snapshot の書き戻し頻度で、いずれも患者件数が増えたときに初めて効いてくる類のもの。
