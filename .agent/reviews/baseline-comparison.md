# Baseline Comparison (vs `main`)

## Requested baseline
- Target baseline: `main` branch
- Baseline commit: `e6cdfa8`
- Method: `git worktree add /tmp/hasegawa-main-baseline main` で同一環境実測
- Bench method: 各ブランチ3回計測し中央値で比較（ノイズ低減）

## Measured Comparison (main vs current working tree)

### Test scale
- `main`: 114 tests pass
- `current`: 118 tests pass
- Delta: +4 tests

### Bench (current)
- `main` median (3 runs):
  - `sendBatch`: 48,933.13 ops/s
  - `extractPatients`: 16,719.98 ops/s
- `current` median (3 runs):
  - `sendBatch`: 49,385.70 ops/s
  - `extractPatients`: 16,497.26 ops/s
- Delta (median):
  - `sendBatch`: +0.92%
  - `extractPatients`: -1.33%

## Recommendation
`extractPatients` 側は今回 -1.33% だったため、次の改善では `querySelectorAll` 回数と文字列処理量の削減を優先する。
