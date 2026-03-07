# Baseline Comparison (vs `main`)

最終確認日: 2026-03-08

## Requested Baseline
- Baseline branch: `main`
- Baseline commit: `d3c8ecf`
- Method:
  - `git worktree add /tmp/hasegawa-main-baseline-20260308 HEAD`
  - baseline / current をそれぞれ 3 回 `npm run bench`
  - 中央値で比較

## Important Context
- current working tree の production code は baseline commit と同一
- 今回の差分は test / e2e / review docs のみ
- したがって perf 差が出ても、まずノイズとして解釈するのが正しい

## Bench Results
### Baseline median (3 runs)
- `sendBatch`: `44,745.00 ops/s`
- `extractPatients`: `17,031.31 ops/s`

### Current median (3 runs)
- `sendBatch`: `44,043.60 ops/s`
- `extractPatients`: `16,967.33 ops/s`

### Delta (current vs baseline)
- `sendBatch`: `-1.57%`
- `extractPatients`: `-0.38%`

## Interpretation
- baseline と current が同一 production code でこの程度ぶれるため、このベンチ環境では `±3%` 程度はノイズ帯として扱うのが妥当。
- 今回の test 追加は hot path に影響していない。

## Testing Delta
- Unit/UI:
  - baseline state at start of this run: `138 tests`
  - current: `141 tests`
- E2E:
  - baseline state at start of this run: `4 scenarios`
  - current: `5 scenarios`
- Added coverage in this run:
  - generic network error handling on Confirm
  - `extractPatients` fallback candidate selection
  - restored session without `API_SECRET` on E2E

## Recommendation
次回 perf compare は production code を触ったタイミングだけで十分。test-only change に対して毎回 bench 差分を厳密に読む必要はない。
