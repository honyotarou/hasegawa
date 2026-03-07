# SRE Review (診療記録くん v11)

最終再評価: 2026-03-08

## Reliability
1. Medium: 送信失敗時の自動再試行がない
- Evidence:
  - `chrome-extension/src/sendBatch.ts:79`
  - `chrome-extension/src/popup/screens/ConfirmScreen.tsx:107`
- Current:
  - 30秒タイムアウト後は手動再送。
- Recommendation:
  - 1〜2回の指数バックオフ再試行をクライアント側で追加し、最終的な失敗だけ UI へ出す。

2. Medium: 単一 Spreadsheet / 単一 GAS deployment 依存
- Evidence:
  - `gas/Code.gs:1`
  - `gas/Code.gs:219`
  - `gas/Code.gs:339`
  - `gas/Code.gs:437`
- Risk:
  - シート破損、権限変更、デプロイ事故がそのまま全停止につながる。
- Recommendation:
  - 日次バックアップと復旧 drill を運用化する。
  - デプロイ URL 固定確認を release checklist に入れる。

3. Medium: 可観測性は audit sheet 中心で、アラートや SLI が未整備
- Evidence:
  - `gas/Code.gs:266`
  - `gas/Code.gs:369`
  - `gas/Code.gs:402`
  - `gas/Code.gs:446`
- Risk:
  - `auth_error` 増加、audit fallback 発生、14時台集計失敗に気付きにくい。
- Recommendation:
  - 週次で `AuditEvidence` の `status` 集計を自動出力する。
  - 失敗件数閾値でメールまたは Chat 通知を送る。

4. Low: secret rotation は依然として手動運用
- Evidence:
  - `chrome-extension/src/popup/screens/SettingsScreen.tsx:184`
- Risk:
  - 端末ごとの更新漏れで部分障害が起きやすい。
- Recommendation:
  - rotation 日、担当者、更新済み端末一覧を `evidence-register.md` に残す。

5. Improvement in this run: 復元セッションで `API_SECRET` が消えた状態を E2E で固定化した
- Evidence:
  - `chrome-extension/e2e/popup.spec.ts:142`
- Effect:
  - 「Main までは復元されるが Confirm で必ず止まる」ことを自動で検証できるようになった。

## Capacity / Quota
- Official quotas checked on 2026-03-08:
  - Simultaneous executions per user: `30`
  - Simultaneous executions per script: `1,000`
  - Script runtime per execution: `6 min`
  - Triggers total runtime: `6 hr / day`
- Source:
  - https://developers.google.com/apps-script/guides/services/quotas
- Assumption:
  - 100 active users
  - 1 user あたり 1日 2 バッチ送信
  - 合計 `200 requests/day`
- Assessment:
  - 現構成では 100 active users 規模は十分吸収可能。
  - 危険なのは日量よりも「昼休み直後に全員が同時送信する」ような burst で、ここでは retry/backoff とランダム遅延の方が効く。

## Operability Checklist
- [ ] `API_SECRET` / `EVIDENCE_SECRET` rotation 実績を記録する
- [ ] `AuditEvidence` の `auth_error` / `exception` / `success` を週次集計する
- [ ] `AUDIT_FALLBACK_BUFFER` が 0 件であることを週次確認する
- [ ] 14時台 trigger の失敗通知を追加する
- [ ] Spreadsheet バックアップと復旧 drill を四半期で回す

## Overall
コード側の境界防御はかなり固まった。今の主要な SRE 課題は、アプリの correctness ではなく、単一シート運用と手動オペレーションをどう監視・復旧可能にするかに移っている。
