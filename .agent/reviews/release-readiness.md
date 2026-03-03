# Release Readiness (Gate 1-4)

最終更新: 2026-03-03

## Gate 1: 本番GAS URL/secretで実送信スモーク
- Status: 実環境確認待ち
- Auto Evidence:
  - Unit: `npm --prefix chrome-extension run test` (114/114 PASS)
  - E2E: `npm --prefix chrome-extension run test:e2e` (4/4 PASS)
  - sendBatch validation/timeout/http error tests (PASS)
- Manual Steps:
  1. `chrome://extensions` で `dist/` を再読込
  2. popup設定に本番 `GAS URL` / `API_SECRET` / `doctorId` 入力
  3. 1件送信→同一batch再送で `written/skipped` 挙動確認
  4. タイムアウト相当時の再送導線確認

## Gate 2: 実ChatGPT画面で抽出手動確認
- Status: 実環境確認待ち
- Auto Evidence:
  - extractPatients unit tests (PASS)
  - popup e2e happy path (PASS)
- Manual Steps:
  1. ChatGPT画面の最新 JSON ブロックで「ChatGPTから取得」
  2. `pre>code` / `code` / `pre` の各パターンで取得確認
  3. 異常JSON時のエラー表示確認

## Gate 3: 運用証跡（監査・復旧・権限レビュー）
- Status: 実環境確認待ち
- Docs Ready:
  - `.agent/compliance/access-control-matrix.md`
  - `.agent/compliance/audit-log-policy.md`
  - `.agent/compliance/backup-recovery-runbook.md`
  - `.agent/compliance/incident-response-playbook.md`
  - `.agent/compliance/endpoint-vendor-management.md`
  - `.agent/compliance/policy-training-raci.md`
- Manual Steps:
  1. 実施日/担当者/証跡IDを `evidence-register.md` に入力
  2. 週次レビュー記録・復旧訓練結果を追記

## Gate 4: リリースタグ固定・再現可能性
- Status: 実施可能
- Auto Evidence:
  - `scripts/release-preflight.sh` で同一手順を再実行可能
  - coverage PASS (96.52%)
  - bench PASS (3-run median: sendBatch 49,062 / extract 16,416 ops/s)
  - build PASS (`npm --prefix chrome-extension run build`)
- Manual Steps:
  1. 変更をcommit
  2. `git tag -a release/v11.x.y -m "release v11.x.y"`
  3. タグ時点の `scripts/release-preflight.sh` 実行ログを保存
