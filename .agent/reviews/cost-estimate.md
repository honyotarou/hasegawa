# Cost Estimate (ActiveUser 100人ごと)

最終確認日: 2026-03-08

## Pricing / Quota Sources
- Google Workspace pricing:
  - https://workspace.google.com/pricing.html
  - official search snippet confirmed on 2026-03-08: Business Starter `USD 7.20` (1年契約換算) / `USD 8.40` (monthly option)
- Apps Script quotas:
  - https://developers.google.com/apps-script/guides/services/quotas
- ChatGPT Business pricing (optional seat cost):
  - https://help.openai.com/en/articles/8792536-manage-billing-on-the-chatgpt-business-subscription-plan
  - official help page confirmed on 2026-03-08: `USD 25/user/month` annual plan, `USD 30/user/month` monthly plan

## Assumptions
1. インフラは Chrome extension + GAS Web App + Google Sheets
2. LLM API は使わず、拡張は既存の ChatGPT UI 上で運用する
3. 1 user あたり 1日 2 batch 送信
4. 1 batch あたり 30 patients
5. 100 active users = `200 batch requests/day`
6. Spreadsheet / GAS は既存 Workspace 契約に乗る想定

## Capacity Check (100 users)
- 推定送信数: `200 requests/day`
- Apps Script official limits checked:
  - Simultaneous executions per user: `30`
  - Simultaneous executions per script: `1,000`
  - Runtime per execution: `6 min`
- Assessment:
  - この構成では 100 active users 規模の cloud runtime cost は実質問題になりにくい。
  - ボトルネックは従量課金より burst 同時実行と運用負荷。

## Monthly Cost Model (per +100 Active Users)

### Scenario A: 既存 Workspace / 既存 ChatGPT 契約を流用
- Incremental infra cost: `ほぼ USD 0 / month`
- Meaning:
  - Chrome extension 自体に課金はなく、GAS / Sheets も既存契約内で吸収される。

### Scenario B: Workspace seat を新規に 100 席追加
- Annual-commit equivalent:
  - `100 * 7.20 = USD 720 / month`
- Month-to-month:
  - `100 * 8.40 = USD 840 / month`

### Scenario C: Workspace + ChatGPT Business seat を各 100 席追加
- Annual-commit equivalent:
  - Workspace `USD 720 / month`
  - ChatGPT Business `100 * 25 = USD 2,500 / month`
  - Total `USD 3,220 / month`
- Month-to-month:
  - Workspace `USD 840 / month`
  - ChatGPT Business `100 * 30 = USD 3,000 / month`
  - Total `USD 3,840 / month`

## Cost per 100 Active Users Summary
1. この実装そのものの追加インフラ費は、既存契約があるなら `ほぼ 0`
2. 新規 Workspace だけを見るなら `USD 720-840 / month / 100 users`
3. ChatGPT seat も新規調達するなら、実コストの大半は Apps Script ではなく seat license 側になる

## Notes
- 価格は 2026-03-08 時点の公開情報。地域・通貨・年間契約・税で変動する。
- 本アプリは ChatGPT API を叩かないため、API token 従量課金は発生しない。
- 100 active users を大きく超え、同時 burst や監査要件が重くなったら、Cloud Run + DB への移行を再試算すべき。
