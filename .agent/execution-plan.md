# 診療記録くん v11 実行計画

この計画は「実装者が追加判断なしで実行できること」を目的に固定する。

## Phase 0: プロジェクト初期化

- [ ] `chrome-extension/` Vite + React + TS を作成
- [ ] `gas/` ディレクトリを作成
- [ ] `public/manifest.json` とアイコン3種を配置
- [ ] `src/types.ts` を仕様型で作成
- [ ] `vite.config.ts`, `tsconfig.json`, `popup.html`, `__tests__/setup.ts` を作成

完了条件:

1. ディレクトリ構成が spec.md と一致
2. `npm run build` が通る

## Phase 1: Red（テストのみ）

- [ ] `extractPatients.test.ts` を作成
- [ ] `sendBatch.test.ts` を作成
- [ ] `App.test.tsx` を作成
- [ ] `screens/*.test.tsx` を作成
- [ ] `components/*.test.tsx` を作成
- [ ] `npm test` を実行し失敗ログを保存

完了条件:

1. 実装コード未追加でテスト失敗を確認
2. 失敗ログが残っている

## Phase 2: テストのみコミット

- [ ] テストファイルのみ差分でコミット
- [ ] コミットに「test only」を含める

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

- [ ] `diagnoses[0]` 必須
- [ ] ageクライアントバリデーション
- [ ] `gasUrlDev` 空なら ModeToggle 非表示
- [ ] session snapshot 復元/保存/削除
- [ ] send success後のみ diagnosisCount 更新
- [ ] GAS 15列書き込み
- [ ] 集計関数の列参照更新

完了条件:

1. テストを変更せず全PASS
2. 2〜4周の反復ログが残る

## Phase 4: 過剰適合チェック

- [ ] 仕様抜け道確認（diagnoses[0], age, rehab, snapshot）
- [ ] エラー系（timeout, non-JSON GAS response）確認
- [ ] 冪等性ベストエフォート（200件）を確認

## Phase 5: デプロイ前確認

- [ ] `npm run build` 成功
- [ ] `dist/` 生成物に manifest/icons を確認
- [ ] GAS 15列ヘッダーを設定
- [ ] `setupSecret()` / `createDailyTrigger()` 実行手順を記録

## Phase 6: 実環境確認（手動）

- [ ] SETUP入力後 MAIN遷移
- [ ] popup途中で閉じても復元
- [ ] confirm経由送信成功
- [ ] Doneで written/skipped 表示
- [ ] 同一batch再送で skipped が増える

