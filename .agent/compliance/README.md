# Compliance Evidence Pack (3省2ガイドライン向け)

このディレクトリは、診療記録くん運用で不足しやすい統制項目の証跡テンプレートを管理する。

## 収録ドキュメント
- `access-control-matrix.md`: アクセス権限管理の運用証跡
- `audit-log-policy.md`: 監査ログの取得・保管・レビュー手順
- `backup-recovery-runbook.md`: バックアップ/復旧手順と訓練記録
- `incident-response-playbook.md`: インシデント対応手順
- `endpoint-vendor-management.md`: 端末管理/マルウェア対策/委託先管理
- `policy-training-raci.md`: 規程・教育・責任分界
- `evidence-register.md`: 実施状況トラッキング

## 準拠判定で必須となる不足しやすい点との対応
1. アクセス権限管理の運用証跡: `access-control-matrix.md` + `evidence-register.md`
2. 監査ログ・保管・定期レビュー: `audit-log-policy.md` + `evidence-register.md`
3. バックアップ/復旧手順と訓練記録: `backup-recovery-runbook.md` + `evidence-register.md`
4. インシデント対応手順: `incident-response-playbook.md`
5. 端末管理/マルウェア対策/委託先管理: `endpoint-vendor-management.md`
6. 規程・教育・責任分界: `policy-training-raci.md`

## 運用ルール
- 月次で `evidence-register.md` を更新する。
- 変更時はGit PRでレビューし、更新日と担当者を残す。
- 実体証跡（画面キャプチャ、監査ログCSV、訓練記録）は院内保管先のリンクIDのみ記載する。

## 自動同期（監査ログのみ）
- GAS `AuditEvidence` シートに `record/recordBatch` 実行結果を自動追記する。
- ローカル同期コマンドで `## AUDIT` セクションを更新できる。

```bash
cd chrome-extension
GAS_URL='https://script.google.com/macros/s/.../exec' \
GAS_EVIDENCE_SECRET='YOUR_EVIDENCE_SECRET' \
npm run sync:evidence -- --limit 200
```

- 本コマンドは `evidence-register.md` の `## AUDIT` のみを書き換える。
- ACCESS/BACKUP/INCIDENT/ENDPOINT/POLICY は人手承認で更新する。
