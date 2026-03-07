# Security Review (診療記録くん v11)

最終再評価: 2026-03-08

## Test Evidence
- `npm test`: 25 files / 141 tests pass
- `npm run test:e2e`: 5 scenarios pass
- `npm run test:coverage`: Statements 94.60% / Branches 84.54% / Functions 82.92%

## Findings (Severity順)

1. Medium: `doctorId` は監査上重要な属性なのに、認証主体へ結び付いていない
- Evidence:
  - `chrome-extension/src/popup/screens/SetupScreen.tsx:147`
  - `chrome-extension/src/popup/screens/SettingsScreen.tsx:125`
  - `chrome-extension/src/popup/hooks/useStorage.ts:39`
  - `gas/Code.gs:166`
  - `gas/Code.gs:258`
- Risk:
  - `API_SECRET` を知るクライアントは任意の `doctorId` を名乗って送信できる。
  - スプレッドシートの監査証跡は「誰が送ったか」ではなく「何と名乗ったか」になる。
- Recommendation:
  - `doctorId` を共有secretと分離し、端末別または利用者別 credential に結び付ける。
  - 少なくとも server 側で `doctorId` の正規表現制約を追加し、棚卸し済み ID 一覧と突合できる形にする。

2. Medium: 監査取得 API は `EVIDENCE_SECRET` の単独知識で監査イベント全文を読める
- Evidence:
  - `gas/Code.gs:95`
  - `gas/Code.gs:329`
  - `chrome-extension/scripts/sync-evidence-register.mjs:13`
  - `chrome-extension/scripts/sync-evidence-register.mjs:49`
- Risk:
  - `EVIDENCE_SECRET` 漏えい時に、送信成否・医師ID・batchId・エラー内容が一覧取得される。
- Recommendation:
  - 監査取得は別 Web App / 別 secret / 実行元制限付き proxy に切り出す。
  - `EVIDENCE_SECRET` は `API_SECRET` と別ローテーション表で管理する。

3. Medium: 旧 `record` action がまだ公開されており、守るべき API 契約面が増えている
- Evidence:
  - `gas/Code.gs:126`
  - `gas/Code.gs:284`
  - `gas/Code.gs:308`
- Status:
  - 永続化 core は `processRecordBatch_` に統合済みで、重複判定やサニタイズの差異は解消した。
- Residual Risk:
  - 公開 action が 2 本ある以上、今後の仕様変更・認証変更・メトリクス整備が二重化しやすい。
- Recommendation:
  - 旧クライアントが残っていないなら `record` を閉じる。
  - 残すなら `.agent/spec.md` に legacy shim として明記し、期限付き deprecation にする。

4. Low: 認証失敗や例外は監査されるが、レート制限や遮断はない
- Evidence:
  - `gas/Code.gs:114`
  - `gas/Code.gs:145`
  - `gas/Code.gs:369`
  - `gas/Code.gs:402`
- Risk:
  - 認証失敗を繰り返すクライアントがいると、監査シートや fallback buffer がノイズで埋まりやすい。
- Recommendation:
  - `auth_error` 件数の週次レビューを追加する。
  - 必要なら Web App の前段に reverse proxy / allowlist を置く。

## Good Practices確認
- シート式注入対策を master / audit の文字列列へ適用済み: `gas/Validation.gs:5`, `gas/Code.gs:19`, `gas/Code.gs:24`, `gas/Code.gs:43`
- `batchId` / `doctorId` / `clientRecordId` は server 側でも trim + non-blank 強制: `gas/Code.gs:11`, `gas/Code.gs:166`, `gas/Code.gs:177`
- `apiSecret` は `chrome.storage.session` 保持で再起動後に消える: `chrome-extension/src/popup/hooks/useStorage.ts:19`, `chrome-extension/src/popup/hooks/useStorage.ts:49`
- Confirm 画面は表示ロジックと送信可否ロジックを共通化済み: `chrome-extension/src/popup/screens/ConfirmScreen.tsx:29`, `chrome-extension/src/popup/screens/ConfirmScreen.tsx:70`, `chrome-extension/src/popup/screens/ConfirmScreen.tsx:189`
- 復元セッションで `API_SECRET` が欠けるケースを E2E で確認済み: `chrome-extension/e2e/popup.spec.ts:142`

## Overall
高優先度のコード注入・未検証入力の問題は前回までの修正でかなり解消した。残る主な論点は「共有 secret 前提の監査真正性」と「legacy action をいつ閉じるか」で、どちらもコード品質より運用設計の問題として扱うべき段階に入っている。
