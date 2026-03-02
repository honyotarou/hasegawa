# Baseline Comparison (vs `main`)

## Requested baseline
- Target baseline: `main` branch
- Baseline commit: `f1a27e7`
- Method: `git worktree add /tmp/hasegawa-main-baseline main` で同一環境実測

## Measured Comparison (main vs current working tree)

### Test scale
- `main`: 93 tests pass
- `current`: 102 tests pass
- Delta: +9 tests

### Coverage
- `main`: 92.71%
- `current`: 96.43%
- Delta: +3.72pt

### E2E
- `main`: 2 scenarios pass
- `current`: 3 scenarios pass
- Delta: +1 scenario

### Bench (current)
- `main`: `sendBatch` ~28,075 ops/s / `extractPatients` ~16,177 ops/s
- `current`: `sendBatch` ~47,389 ops/s / `extractPatients` ~16,350 ops/s
- Delta: `sendBatch` +68.8% / `extractPatients` +1.1%

## Recommendation
次回からは baseline 計測用に固定タグ（例: `baseline/v11.1-security`）を切り、同じベンチ回数/CPU条件で比較する。
