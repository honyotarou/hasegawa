# 診療記録くん v11 実行計画

この計画は「実装者が追加判断なしで実行できること」を目的に固定する。

## Phase 0: プロジェクト初期化

- [x] `chrome-extension/` Vite + React + TS を作成
- [x] `gas/` ディレクトリを作成
- [x] `public/manifest.json` とアイコン3種を配置
- [x] `src/types.ts` を仕様型で作成
- [x] `vite.config.ts`, `tsconfig.json`, `popup.html`, `__tests__/setup.ts` を作成

完了条件:

1. ディレクトリ構成が spec.md と一致
2. `npm run build` が通る

証跡:

1. 構成確認: `find chrome-extension/src -maxdepth 4 -type f | sort`, `find gas -maxdepth 2 -type f | sort`
2. buildログ: `.agent/logs/v11-build.log`, `.agent/logs/v11-build-latest.log`

## Phase 1: Red（テストのみ）

- [x] `extractPatients.test.ts` を作成
- [x] `sendBatch.test.ts` を作成
- [x] `App.test.tsx` を作成
- [x] `screens/*.test.tsx` を作成
- [x] `components/*.test.tsx` を作成
- [x] `npm test` を実行し失敗ログを保存

完了条件:

1. 実装コード未追加でテスト失敗を確認
2. 失敗ログが残っている

証跡:

1. Redログ: `.agent/logs/v11-red-vitest.log`
2. Red要約: `.agent/logs/v11-red-summary.md`

## Phase 2: テストのみコミット

- [x] テストファイルのみ差分でコミット
- [x] コミットに「test only」を含める

証跡:

1. コミット: `b7f8639`
2. メッセージ: `test only: add v11 red tests for popup/content/sendBatch`

## Phase 3: Green（テスト固定）

実装順:

1. `src/content/extractPatients.ts`
2. `src/sendBatch.ts`
3. `src/popup/hooks/useAppState.ts`
4. `src/popup/hooks/useStorage.ts`
5. `src/popup/hooks/useDiagnosis.ts`
6. `src/popup/components/*`
7. `src/popup/screens/*`
8. `src/popup/App.tsx`, `src/popup/main.tsx`
9. `gas/Validation.gs`
10. `gas/Code.gs`

実装チェック:

- [x] `diagnoses[0]` 必須
- [x] ageクライアントバリデーション
- [x] `gasUrlDev` 空なら ModeToggle 非表示
- [x] session snapshot 復元/保存/削除
- [x] send success後のみ diagnosisCount 更新
- [x] GAS 15列書き込み
- [x] 集計関数の列参照更新

完了条件:

1. テストを変更せず全PASS
2. 2〜4周の反復ログが残る

証跡:

1. Greenログ: `.agent/logs/v11-green-vitest.log`, `.agent/logs/v11-green-vitest-latest.log`
2. テスト変更なし確認: `git diff --name-only b7f8639..HEAD -- chrome-extension/__tests__` が空

## Phase 4: 過剰適合チェック

- [x] 仕様抜け道確認（diagnoses[0], age, rehab, snapshot）
- [x] エラー系（timeout, non-JSON GAS response）確認
- [x] 冪等性ベストエフォート（200件）を確認

証跡:

1. `sendBatch.test.ts`: timeout / non-json / success:false / redirect
2. `extractPatients.test.ts`: age境界・壊れJSON・優先順
3. `useAppState.ts` + `Validation.gs`: diagnoses[0]・age・snapshot契約

## Phase 5: デプロイ前確認

- [x] `npm run build` 成功
- [x] `dist/` 生成物に manifest/icons を確認
- [ ] GAS 15列ヘッダーを設定
- [x] `setupSecret()` / `createDailyTrigger()` 実行手順を記録

証跡:

1. buildログ: `.agent/logs/v11-build.log`, `.agent/logs/v11-build-latest.log`
2. dist確認: `ls -la chrome-extension/dist`, `ls -la chrome-extension/dist/icons`
3. 手順記録: `.agent/spec.md` / 最終報告「実環境確認待ち項目」

## Phase 6: 実環境確認（手動）

- [ ] SETUP入力後 MAIN遷移
- [ ] popup途中で閉じても復元
- [ ] confirm経由送信成功
- [ ] Doneで written/skipped 表示
- [ ] 同一batch再送で skipped が増える

状態:

1. 本フェーズは Chrome 実機 + GAS 実環境が必要なため `実環境確認待ち`
