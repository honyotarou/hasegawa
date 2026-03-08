# Audit Log Policy

更新日: 2026-03-02

## 目的
- 送信・失敗・再送・デプロイ更新の証跡を残し、後追い可能にする。

## 収集対象
1. アプリ送信ログ
- batchId
- doctorId
- submittedAt
- written/skipped
- mode(prod/dev)

2. 運用ログ
- GASデプロイ更新日時
- 実行者
- 変更コミットSHA
- API_SECRETローテーション実施記録

## 保管と保持期間
- 保管先: 院内共有ストレージ（監査フォルダ）
- 形式: CSV/Markdown
- 保持: 最低3年（院内規程優先）

## 定期レビュー
- 週次: 失敗率・再送率レビュー
- 月次: 異常値（skipped急増/doctorId欠落）レビュー
- 四半期: インシデント再発防止レビュー

## 実施テンプレート
| Date | Reviewer | 対象期間 | Failures | 再送率 | 所見 | Action |
|---|---|---|---:|---:|---|---|
| YYYY-MM-DD | 名前 | YYYY-MM |  |  |  |  |
