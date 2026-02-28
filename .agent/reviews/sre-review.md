# SRE Review (診療記録くん v11)

## Reliability
1. Medium: 送信失敗時の自動再試行がない
- Current: ユーザー手動再送（batchId保持）
- Recommendation: 指数バックオフ1-2回をクライアントで追加（UIに再試行回数表示）

2. Medium: GAS実行の可観測性が限定的
- Current: `Logger.log` とトリガー失敗メールのみ
- Recommendation:
  - `batchId`/`doctorId`/written/skipped を監査ログシートへ追記
  - 週次で失敗率・遅延の集計

3. Medium: 単一スプレッドシート依存
- Recommendation:
  - 日次バックアップ（CSV export / Drive複製）
  - 破損時の復旧Runbook整備

## Capacity / Quota
- Apps Scriptは同時実行や実行時間上限あり（詳細は cost-estimate.md 参照）。
- 100 Active Users規模は通常運用で吸収可能だが、ピーク時の同時送信に備えて:
  - 送信リクエスト分散（UI側ランダム遅延 0-2s）
  - 失敗時の再送間隔制御

## Operability Checklist
- [ ] Secret rotation 手順の運用テスト
- [ ] GASデプロイ更新時のURL固定確認
- [ ] 14時台トリガー監視（失敗アラート到達確認）
