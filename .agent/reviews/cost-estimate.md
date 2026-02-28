# Cost Estimate (ActiveUser 100人ごと)

## Pricing / Quota Sources
- Google Apps Script quotas:
  - https://developers.google.com/apps-script/guides/services/quotas
- Google Workspace pricing page:
  - https://workspace.google.com/pricing
- ChatGPT pricing (optional seat cost):
  - https://openai.com/chatgpt/pricing/
  - https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus

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
- Workspace Business Starterを $8.40/user/month と仮定（pricing page表示値ベース）
- +100 usersごと: **$840 / month**

### Scenario C: Workspace + ChatGPT Plus を新規追加
- Workspace: $8.40/user/month
- ChatGPT Plus: $20/user/month
- 合計: $28.40/user/month
- +100 usersごと: **$2,840 / month**

## 参考: 100人刻みの概算
- 100 users: $840 (Workspaceのみ) / $2,840 (Workspace+Plus)
- 200 users: $1,680 / $5,680
- 300 users: $2,520 / $8,520

## Notes
- 実際の契約単価は地域/年契約/キャンペーンで変動するため、導入時に最新価格で再見積が必要。
- GAS quota超過リスクが出る規模では、Cloud Run + DBへ移行したときの従量課金モデル再計算が必要。
