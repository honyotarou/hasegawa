# Baseline Comparison (vs `main`)

## Requested baseline
- Target baseline: `main` branch
- Baseline commit: `f1a27e7`
- Method: `git worktree add /tmp/hasegawa-main-baseline main` で同一環境実測
- Bench method: 各ブランチ3回計測し中央値で比較（ノイズ低減）

## Measured Comparison (main vs current working tree)

### Test scale
- `main`: 93 tests pass
- `current`: 117 tests pass
- Delta: +24 tests

### Coverage
- `main`: 92.71%
- `current`: 96.53%
- Delta: +3.82pt

### E2E
- `main`: 2 scenarios pass
- `current`: 4 scenarios pass
- Delta: +2 scenarios

### Bench (current)
- `main` median (3 runs):
  - `sendBatch`: 48,016.97 ops/s
  - `extractPatients`: 16,233.39 ops/s
- `current` median (3 runs):
  - `sendBatch`: 49,061.81 ops/s
  - `extractPatients`: 16,415.81 ops/s
- Delta (median):
  - `sendBatch`: +2.18%
  - `extractPatients`: +1.12%

## Recommendation
次回からは baseline 計測用に固定タグ（例: `baseline/v11.1-security`）を切り、同じベンチ回数/CPU条件で比較する。
