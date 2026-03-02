# Baseline Comparison (vs `main`)

## Requested baseline
- Target baseline: `main` branch
- Baseline commit: `f1a27e7`
- Method: `git worktree add /tmp/hasegawa-main-baseline main` で同一環境実測

## Measured Comparison (main vs current working tree)

### Test scale
- `main`: 93 tests pass
- `current`: 112 tests pass
- Delta: +19 tests

### Coverage
- `main`: 92.71%
- `current`: 96.40%
- Delta: +3.69pt

### E2E
- `main`: 2 scenarios pass
- `current`: 3 scenarios pass
- Delta: +1 scenario

### Bench (current)
- `main`: `sendBatch` ~9,676 ops/s / `extractPatients` ~15,732 ops/s
- `current`: `sendBatch` ~29,018 ops/s / `extractPatients` ~16,629 ops/s
- Delta: `sendBatch` +199.9% / `extractPatients` +5.7%

## Recommendation
次回からは baseline 計測用に固定タグ（例: `baseline/v11.1-security`）を切り、同じベンチ回数/CPU条件で比較する。
