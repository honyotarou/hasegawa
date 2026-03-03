# SRE Review (診療記録くん v11)

## Reliability
1. Medium: 送信失敗時の自動再試行がない
- Current: ユーザー手動再送（batchId保持）
- Recommendation: 指数バックオフ1-2回をクライアントで追加（UIに再試行回数表示）

2. Low: GAS実行の可観測性は改善済みだが、アラート連携は未実装
- Current: `AuditEvidence` シートへ `record/recordBatch` の成功・失敗を自動追記（改善済み）
- Remaining Recommendation:
  - 週次で失敗率・遅延の集計を自動化（Apps Script trigger）
  - 重要エラー時の通知（メール/ChatOps）連携

3. Medium: 単一スプレッドシート依存
- Recommendation:
  - 日次バックアップ（CSV export / Drive複製）
  - 破損時の復旧Runbook整備

4. Low: クライアント側ストレージ失敗時はログのみで復旧導線が弱い
- Current: `console.error` で記録。デバウンス保存で失敗頻度は抑制。
- Recommendation:
  - status領域に「セッション保存失敗」警告を出し、再読込/再入力導線を追加

5. Medium: secret運用が2系統になり、ローテーション漏れリスクが増加
- Current: `API_SECRET` と `EVIDENCE_SECRET` を分離（改善）
- Recommendation:
  - 月次ローテーション表に2種secretを明示し、更新担当者を分離する。
  - `sync:evidence` 実行環境を限定し、平文環境変数は「即時削除」を標準運用にする。

6. Fixed in this run: `dev` モード固定化で送信不能になる経路を解消
- Current: `gasUrlDev` 未設定かつ `mode=dev` 復元時に自動で `prod` へフォールバック
- Evidence: [App.tsx](chrome-extension/src/popup/App.tsx#L23)

7. Fixed in this run: 送信成功後の `currentBatchId` 残留を解消
- Current: DONE遷移時に `inputSnapshot` と `currentBatchId` を同時削除
- Evidence: [useAppState.ts](chrome-extension/src/popup/hooks/useAppState.ts#L133)

8. Fixed in this run: 監査fallbackの過大化による二次障害リスクを縮小
- Current: `AUDIT_FALLBACK_BUFFER` は30件上限かつ8,000文字上限で切り詰め
- Evidence: [Code.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Code.gs:461), [Code.test.gs](/Users/apple/Documents/GitHub/hasegawa/gas/Code.test.gs:136)
- Effect: PropertiesServiceサイズ超過でfallback保存が再失敗する確率を下げた。

## Governance Evidence Status (準拠判定で不足しやすい項目)
- アクセス権限管理: テンプレート作成済み（`access-control-matrix.md`）、実績ログは `evidence-register.md` へ追記運用が必要。
- 監査ログ保管/定期レビュー: `audit-log-policy.md` で手順化済み、週次レビュー実績入力が未実施。
- バックアップ/復旧/訓練: `backup-recovery-runbook.md` でRTO/RPO定義済み、訓練記録は未入力。
- インシデント対応: `incident-response-playbook.md` 整備済み、初動訓練の実績化が必要。
- 端末/マルウェア/委託先: `endpoint-vendor-management.md` 整備済み、端末台帳との突合が必要。
- 規程/教育/RACI: `policy-training-raci.md` 整備済み、受講記録投入が必要。

## Capacity / Quota
- Apps Scriptは同時実行や実行時間上限あり（詳細は cost-estimate.md 参照）。
- 100 Active Users規模は通常運用で吸収可能だが、ピーク時の同時送信に備えて:
  - 送信リクエスト分散（UI側ランダム遅延 0-2s）
  - 失敗時の再送間隔制御

## Operability Checklist
- [ ] `API_SECRET`/`EVIDENCE_SECRET` のローテーション運用テスト
- [ ] GASデプロイ更新時のURL固定確認
- [ ] 14時台トリガー監視（失敗アラート到達確認）
- [ ] `npm run sync:evidence` の週次実行運用開始
- [ ] `AUDIT_FALLBACK_BUFFER` が0件であることを週次確認
