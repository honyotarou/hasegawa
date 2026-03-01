# Baseline Comparison (vs `main`)

## Requested baseline
- Target baseline: `main` branch
- Check command: `git ls-tree --name-only main`
- Result: tree is empty (no `chrome-extension/`, no benchmark対象コード)

## Impact
- `main` との性能比較は実行不能（同一対象が存在しないため）。

## Fallback comparison used
比較可能な最新基準として、今回作業の開始時点（v11初期実装）との差分を測定。

### Test scale
- Before extension: 39 tests
- After extension: 76 tests

### Coverage
- Baseline: 75.45% (from `v11-coverage-baseline.log`)
- Current: 95.20% (latest local run)
- Delta: +19.75pt

### E2E
- Baseline: 0 playwright scenarios
- Current: 2 scenarios pass (`setup`, `main->confirm->done`)

### Bench (current)
- `sendBatch` 40件: ~21,774 ops/s
- `extractPatients` 40件: ~15,691 ops/s

## Recommendation
mainが空のため、次回からは「比較対象タグ（例: `baseline/v11-start`）」を切って固定し、同条件で継続計測する。
