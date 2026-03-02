# Cost Estimate (ActiveUser 100人ごと)

最終確認日: 2026-03-02

## Pricing / Quota Sources
- Google Apps Script quotas:
  - https://developers.google.com/apps-script/guides/services/quotas
- Google Workspace pricing page:
  - https://workspace.google.com/pricing
- ChatGPT pricing (optional seat cost):
  - https://openai.com/chatgpt/pricing/

注記: 価格は 2026-03-02 時点で公開ページ表示値を参照。地域・税・年契約割引で変動。

## Assumptions
1. 拡張機能はクライアント実行（Chrome拡張自体の従量課金なし）
2. サーバは GAS Web App + Google Sheets
3. 1ユーザーあたり 1日 2バッチ送信、1バッチ 30件（100 usersで1日200リクエスト）
4. GAS処理は1リクエスト1秒未満（現実的な目安）

## Capacity check (100 users)
- 推定実行時間: 200 sec/day ≒ 3.3 min/day
- Apps Script quota（Workspaceアカウント）に対して十分小さい。

## Monthly Cost Model (per +100 Active Users)

### Scenario A: 既存Workspace/既存ChatGPTを流用
- Incremental infra cost: ほぼ $0 / 100 users
- 主な追加コスト: 運用工数（人件費）

### Scenario B: Workspace席を新規追加
- Workspace Business Starter: $7/user/month（表示価格、年契約割引時は $5.60 のキャンペーン表示あり）
- +100 usersごと: **$700 / month**（割引適用時は **$560 / month**）

### Scenario C: Workspace + ChatGPT Plus を新規追加
- Workspace: $7/user/month
- ChatGPT Plus: $20/user/month
- 合計: $27/user/month
- +100 usersごと: **$2,700 / month**

### Scenario D: Workspace + ChatGPT Business を新規追加
- Workspace: $7/user/month
- ChatGPT Business: $25/user/month（年払い時の表示価格）
- 合計: $32/user/month
- +100 usersごと: **$3,200 / month**

### Scenario E: Workspace + ChatGPT Pro を新規追加
- Workspace: $7/user/month
- ChatGPT Pro: $200/user/month
- 合計: $207/user/month
- +100 usersごと: **$20,700 / month**

## 参考: 100人刻みの概算
- 100 users: $700 (Workspaceのみ) / $2,700 (Workspace+Plus) / $3,200 (Workspace+Business)
- 200 users: $1,400 / $5,400 / $6,400
- 300 users: $2,100 / $8,100 / $9,600
- Pro利用時: 100 usersで $20,700 / month

## Notes
- 実際の契約単価は地域/年契約/キャンペーンで変動するため、導入時に最新価格で再見積が必要。
- GAS quota超過リスクが出る規模では、Cloud Run + DBへ移行したときの従量課金モデル再計算が必要。
- 今回の修正（mode復帰/監査fallback/送信前バリデーション）は実行コスト構造を変えないため、100人刻み試算は据え置き。
