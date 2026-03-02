# Backup & Recovery Runbook

更新日: 2026-03-02

## バックアップ対象
- RehaTrueFalse シート
- GAS Code.gs / Validation.gs（Git）
- 設定手順書と運用証跡

## 日次バックアップ
1. スプレッドシートをDriveコピー（命名: `RehaTrueFalse_YYYYMMDD`）
2. 週次でCSVエクスポート保存
3. 実施記録を `evidence-register.md` に追記

## 復旧手順（障害時）
1. 影響範囲確認（期間/doctorId/batchId）
2. 最新正常バックアップを特定
3. シート復元（全体復元 or 対象行のみ）
4. 日次集計を再実行（mainFlow）
5. 復旧確認（集計値・件数照合）

## 復旧訓練（四半期）
- 目標RTO: 2時間以内
- 目標RPO: 24時間以内
- 訓練記録:
| Date | Scope | RTO(actual) | RPO(actual) | 問題点 | 改善 |
|---|---|---:|---:|---|---|
| YYYY-MM-DD |  |  |  |  |  |
