# Security Review (診療記録くん v11)

## Findings (Severity順)

1. Medium: `getEvidenceEvents` は読み取り専用secretで分離されたが、漏えい時の閲覧リスクは残る
- Evidence: [Code.gs](gas/Code.gs#L19), [Code.gs](gas/Code.gs#L42), [Code.gs](gas/Code.gs#L283), [sync-evidence-register.mjs](chrome-extension/scripts/sync-evidence-register.mjs#L14)
- Status: `API_SECRET`（送信）と `EVIDENCE_SECRET`（監査取得）を分離済み。
- Residual Risk: `EVIDENCE_SECRET` 単体漏えいで監査ログ閲覧が可能。
- Recommendation:
  - 同期専用secretを短期ローテーション運用にする。
  - 必要なら監査取得専用WebAppを別デプロイし、アクセスIPを制限する。

2. Medium: 監査同期Markdownはエスケープ実装済みだが、証跡改ざん検知までは未実装
- Evidence: [evidence-sync-lib.mjs](chrome-extension/scripts/evidence-sync-lib.mjs#L6)
- Status: 改行・`|`・HTMLタグの注入対策を追加済み。
- Residual Risk: 監査ファイル自体の改ざん検知（署名/ハッシュ鎖）は未実装。
- Recommendation:
  - 同期出力にSHA-256ハッシュを付与し、別媒体へハッシュ保存する。

3. Medium: 準拠判定で必須となる運用証跡はテンプレート整備段階
- Evidence: [.agent/compliance/access-control-matrix.md](.agent/compliance/access-control-matrix.md), [.agent/compliance/audit-log-policy.md](.agent/compliance/audit-log-policy.md), [.agent/compliance/backup-recovery-runbook.md](.agent/compliance/backup-recovery-runbook.md), [.agent/compliance/incident-response-playbook.md](.agent/compliance/incident-response-playbook.md), [.agent/compliance/endpoint-vendor-management.md](.agent/compliance/endpoint-vendor-management.md), [.agent/compliance/policy-training-raci.md](.agent/compliance/policy-training-raci.md), [.agent/compliance/evidence-register.md](.agent/compliance/evidence-register.md)
- Risk: 文書雛形のみで、実績証跡（実施日時・担当者・証跡ID）が未入力だと監査で不適合。
- Recommendation:
  - `evidence-register.md` を週次更新し、証跡ID（Drive/チケットID）を必ず記録。
  - 権限棚卸し/復旧訓練/教育受講の実施記録を初回入力。

4. Low: `simpleHash` の衝突可能性は残るが誤スキップは回避済み
- Evidence: [Code.gs](gas/Code.gs#L90), [Code.gs](gas/Code.gs#L115)
- Status:
  - hash一致時に `clientRecordId` まで照合するため、衝突だけでスキップされる問題は解消済み。
- Recommendation:
  - 監査容易性向上のため将来的には SHA-256 文字列化も検討。

5. Medium: 冪等性保証は直近200件のみで、古い再送は重複書き込み余地がある
- Evidence: [Code.gs](gas/Code.gs#L5), [Code.gs](gas/Code.gs#L87)
- Risk: 再送遅延が大きい運用で重複発生。
- Recommendation:
  - hashの永続インデックスシートを別管理し全期間照合

## Good Practices確認
- 式インジェクション対策（`= + - @` 先頭値をエスケープ）: [Validation.gs](gas/Validation.gs#L24)
- Markdown注入対策（改行/`|`/HTMLエスケープ）: [evidence-sync-lib.mjs](chrome-extension/scripts/evidence-sync-lib.mjs#L6)
- `apiSecret` を `storage.session` 保持（永続化回避）: [useStorage.ts](chrome-extension/src/popup/hooks/useStorage.ts#L34)
- 送信タイムアウト（30秒）: [sendBatch.ts](chrome-extension/src/sendBatch.ts#L45)
- サーバー側二重防衛（age/rehab/diagnoses[0] + objガード）: [Validation.gs](gas/Validation.gs#L1)
- storage/session操作失敗時のcatch実装: [useAppState.ts](chrome-extension/src/popup/hooks/useAppState.ts#L112), [useDiagnosis.ts](chrome-extension/src/popup/hooks/useDiagnosis.ts#L8)
- Setup/SettingsのGAS URL許可ドメイン検証: [SetupScreen.tsx](chrome-extension/src/popup/screens/SetupScreen.tsx#L23), [SettingsScreen.tsx](chrome-extension/src/popup/screens/SettingsScreen.tsx#L27)
- 監査ログ自動追記（AuditEvidenceシート）: [Code.gs](gas/Code.gs#L307)
