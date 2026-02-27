# 05 Chrome MV3 Checklist

## 1. manifest.json

- [ ] `manifest_version: 3`
- [ ] `permissions`: `activeTab`, `scripting`, `storage`
- [ ] `content_scripts` 未使用
- [ ] `host_permissions` に以下を両方記載
  - [ ] `https://script.google.com/*`
  - [ ] `https://script.googleusercontent.com/*`

## 2. content.js

- [ ] `extractSOAP` を純粋関数中心で実装
- [ ] 抽出対象は `document.querySelectorAll('pre, code')`
- [ ] 優先順: fenced codeblock -> 配列JSON -> 単一オブジェクト
- [ ] 配列時は最後の1件を使用
- [ ] 単一オブジェクトは timestamp ラップ
- [ ] 検証通過: `{ success: true, data }`
- [ ] 失敗: `{ success: false, error }`
- [ ] `chrome.runtime.onMessage` を実装しない

## 3. popup.js / sendRecord.js

- [ ] popup.html は UI のみ。JS は `popup.js` 外部読み込みのみ
- [ ] クリック直後に対象ボタン disabled
- [ ] `executeScript` 呼び出しで `allFrames:false` 明示
- [ ] `results[0].result` のみ使用
- [ ] メインフレーム以外の結果を無視
- [ ] `lastSentAnswerHash` で直前同一送信を確認ダイアログへ誘導
- [ ] fetch body に `{ secret, action, ... }` を含める
- [ ] `redirect: "follow"` を設定
- [ ] 30秒 timeout（AbortController）を実装
- [ ] 成否問わずボタン状態を復元

## 4. Service Worker 停止対策

- [ ] グローバル変数へ永続状態を保持しない
- [ ] 必要状態は `storage.local/session` に保存
- [ ] SW 再起動後の UI 状態矛盾を回避
- [ ] 停止条件（30秒非応答等）を前提にエラー復帰設計

## 5. Storage/Secret

- [ ] `chrome.storage.session` に secret を保存
- [ ] storage に患者本体を保存しない
- [ ] local 保存キーが許可リスト内のみ

## 6. vitest（拡張）

- [ ] chrome API は `vi.fn()` でスタブ
- [ ] fetch 成功/失敗/timeout を再現
- [ ] disabled 連打無効を検証
- [ ] SW再起動後状態復元を検証
