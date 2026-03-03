# Baseline Comparison (vs `main`)

## Requested baseline
- Target baseline: `main` branch
- Baseline commit: `f1a27e7`
- Method: `git worktree add /tmp/hasegawa-main-baseline main` で同一環境実測

## Measured Comparison (main vs current working tree)

### Test scale
- `main`: 93 tests pass
- `current`: 114 tests pass
- Delta: +21 tests

### Coverage
- `main`: 92.71%
- `current`: 96.52%
- Delta: +3.81pt

### E2E
- `main`: 2 scenarios pass
- `current`: 4 scenarios pass
- Delta: +2 scenarios

### Bench (current)
- `main`: `sendBatch` ~31,157 ops/s / `extractPatients` ~15,701 ops/s
- `current`: `sendBatch` ~49,760 ops/s / `extractPatients` ~16,894 ops/s
- Delta: `sendBatch` +59.7% / `extractPatients` +7.6%

## Recommendation
次回からは baseline 計測用に固定タグ（例: `baseline/v11.1-security`）を切り、同じベンチ回数/CPU条件で比較する。
