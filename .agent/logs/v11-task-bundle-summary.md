# v11 Task Bundle Summary (unit/e2e/coverage/bench/reviews)

## Commands executed
- `npm test`
- `npm run test:e2e`
- `npm run test:coverage`
- `npm run bench`
- `npm run build`

## Results
- Unit/UI: 63 passed / 0 failed
- E2E (Playwright): 2 passed / 0 failed
- Coverage: 95.05% statements
- Bench:
  - sendBatch(40 records): ~50,099 ops/s
  - extractPatients(40 records): ~16,452 ops/s

## Notes
- `npm audit` はネットワーク制限により実行不能（ENOTFOUND registry.npmjs.org）
- `main` ブランチは空ツリーのため、要求された main baseline 性能比較は直接実施不能
