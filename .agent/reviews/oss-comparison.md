# OSS Comparison (類似実装調査)

最終確認日: 2026-03-08

## Compared Repositories
1. `Jonghakseo/chrome-extension-boilerplate-react-vite`
- Local: `/tmp/hasegawa-oss-20260308/chrome-extension-boilerplate-react-vite`
- Commit: `6fde1ac`
2. `GoogleChrome/chrome-extensions-samples`
- Local: `/tmp/hasegawa-oss-20260308/chrome-extensions-samples`
- Commit: `c439386`
3. `wxt-dev/wxt`
- Local: `/tmp/hasegawa-oss-20260308/wxt`
- Commit: `5fe4681`
4. `PlasmoHQ/plasmo`
- Local: `/tmp/hasegawa-oss-20260308/plasmo`
- Commit: `9369e28`

## Observations

### A. `chrome-extension-boilerplate-react-vite`
- Restricted URL (`chrome://`, `about:`) での script injection 失敗を popup 側で通知している。
- Reference:
  - `/tmp/hasegawa-oss-20260308/chrome-extension-boilerplate-react-vite/pages/popup/src/Popup.tsx:20`
- 学び:
  - 本 repo でも `ChatGPTから取得` 実行時に restricted URL を明示通知すると、運用問い合わせが減る。

### B. `chrome-extensions-samples`
- `chrome.scripting.executeScript` の最小構成サンプルが明快で、`storage.session` の surface 間受け渡し例もある。
- Reference:
  - `/tmp/hasegawa-oss-20260308/chrome-extensions-samples/functional-samples/reference.mv3-content-scripts/popup.js:10`
  - `/tmp/hasegawa-oss-20260308/chrome-extensions-samples/functional-samples/sample.sidepanel-dictionary/service-worker.js:27`
- 学び:
  - 現在の `activeTab + scripting + storage.session` 構成は公式サンプルの最小方針と整合している。

### C. `wxt`
- runtime config に secret を置くな、と公式ドキュメントで明示している。
- manifest 生成 hook で必要 permission だけを注入する設計を採っている。
- Reference:
  - `/tmp/hasegawa-oss-20260308/wxt/docs/guide/essentials/config/runtime.md:22`
  - `/tmp/hasegawa-oss-20260308/wxt/packages/analytics/modules/analytics/index.ts:33`
- 学び:
  - 本 repo は既に `API_SECRET` を `storage.session` に逃がしていて方向は正しい。
  - ただし manifest を静的 JSON で持っているため、将来環境別差分が増えるなら build-time 生成へ寄せる価値がある。

### D. `plasmo`
- build と zip、さらに store submission まで配布導線が揃っている。
- Reference:
  - `/tmp/hasegawa-oss-20260308/plasmo/cli/plasmo/src/commands/build.ts:13`
  - `/tmp/hasegawa-oss-20260308/plasmo/packages/init/templates/README.md:31`
- 学び:
  - 本 repo に欠けているのは extension 本体の実装力ではなく、release pipeline の自動化。

## Gap vs 診療記録くん v11
- Better than generic boilerplates:
  - 権限面はかなり絞れている。
  - `tabs` permission を取らず、`activeTab` で済ませている。
  - host permission も `script.google.com` / `script.googleusercontent.com` に限定している。
- Weaker than specialized frameworks:
  - restricted URL UX がまだ薄い
  - manifest 生成と配布 pipeline が手動寄り
  - store 提出や release artifact の自動化がない

## Concrete Adoptions Worth Doing
1. `ChatGPTから取得` 実行時の restricted URL エラー表示を追加する
2. manifest を build-time 生成に寄せ、環境差分をコード化する
3. GitHub Actions で build + zip + release artifact 生成を自動化する
