# v11 Phase Evidence

## Phase 0
- `find chrome-extension/src -maxdepth 4 -type f | sort`
- `find gas -maxdepth 2 -type f | sort`
- `npm run build` 成功（`.agent/logs/v11-build.log`）

## Phase 1 (Red)
- テストのみ追加
- `npm test` 失敗（exit 1）
- ログ: `.agent/logs/v11-red-vitest.log`

## Phase 2
- テストのみコミット: `b7f8639`
- message: `test only: add v11 red tests for popup/content/sendBatch`

## Phase 3 (Green)
- 実装追加（front + gas）
- テスト変更なし確認: `git diff --name-only b7f8639..HEAD -- chrome-extension/__tests__` => empty
- `npm test` 成功（`.agent/logs/v11-green-vitest.log` / `v11-green-vitest-latest.log`）

## Phase 4
- timeout / non-json / age境界 / snapshot 契約をテスト/実装で確認

## Phase 5
- `npm run build` 成功（`.agent/logs/v11-build-latest.log`）
- `dist/` 生成確認済み

## Phase 6
- Chrome実機 + GAS環境での最終確認が必要（`実環境確認待ち`）
