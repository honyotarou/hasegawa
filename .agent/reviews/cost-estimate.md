# Cost Estimate (ActiveUser 100人ごと)

最終確認日: 2026-03-03

## Pricing / Quota Sources
- Google Apps Script quotas:
  - https://developers.google.com/apps-script/guides/services/quotas
- Google Workspace pricing page:
  - https://workspace.google.com/pricing
- ChatGPT pricing (optional seat cost):
  - https://openai.com/chatgpt/pricing/

注記: 価格は 2026-03-03 時点の公開ページ表示値を参照。地域・税・年契約割引で変動。
環境によって Workspace 価格表示通貨が異なる（本実測では `¥800` 表示を確認）。

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
- Workspace Business Starter: 価格ページ表示単価を `W` とする（本実測例: `W = ¥800 / user / month`）
- +100 usersごと: **`100 * W` / month**（本実測例: **¥80,000 / month**）

### Scenario C: Workspace + ChatGPT Plus を新規追加
- Workspace: `W`
- ChatGPT Plus: 価格ページ表示単価を `P_plus` とする
- 合計: `W + P_plus`
- +100 usersごと: **`100 * (W + P_plus)` / month**

### Scenario D: Workspace + ChatGPT Business を新規追加
- Workspace: `W`
- ChatGPT Business: 価格ページ表示単価を `P_business` とする
- 合計: `W + P_business`
- +100 usersごと: **`100 * (W + P_business)` / month**

### Scenario E: Workspace + ChatGPT Pro を新規追加
- Workspace: `W`
- ChatGPT Pro: 価格ページ表示単価を `P_pro` とする
- 合計: `W + P_pro`
- +100 usersごと: **`100 * (W + P_pro)` / month**

## 参考: 100人刻みの概算（本実測通貨表示ベース）
- Workspaceのみ（`W = ¥800`の場合）:
  - 100 users: ¥80,000
  - 200 users: ¥160,000
  - 300 users: ¥240,000
- ChatGPT併用は上記に `100 * P_*` を加算（`P_*` は契約プラン単価）

## Notes
- 実際の契約単価は地域/年契約/キャンペーンで変動するため、導入時に最新価格で再見積が必要。
- GAS quota超過リスクが出る規模では、Cloud Run + DBへ移行したときの従量課金モデル再計算が必要。
- 今回の修正（mode復帰/監査fallback/送信前バリデーション）は実行コスト構造を変えないため、100人刻み試算は据え置き。
