# OSS Comparison (類似実装調査)

## Compared Repositories
1. `Jonghakseo/chrome-extension-boilerplate-react-vite`
- Local: `/tmp/oss-chrome-react-vite`
- Checked commit: `6fde1ac`
2. `GoogleChrome/chrome-extensions-samples`
- Local: `/tmp/oss-chrome-extensions-samples`
- Checked commit: `4ffe03c`
3. `wxt-dev/wxt`
- Local: `/tmp/oss-wxt`
- Checked commit: `19cebbf`
4. `PlasmoHQ/plasmo`
- Local: `/tmp/oss-plasmo`
- Checked commit: `9369e28`

## Observations

### A. Extension boilerplate (React + Vite)
- Dynamic script injection pattern:
  - Reference: [/tmp/oss-chrome-react-vite/pages/popup/src/Popup.tsx](/tmp/oss-chrome-react-vite/pages/popup/src/Popup.tsx:24)
  - Uses `chrome.scripting.executeScript({ files: [...] })` and explicit error handling for restricted URLs.
- Manifest generated from TS:
  - Reference: [/tmp/oss-chrome-react-vite/chrome-extension/manifest.ts](/tmp/oss-chrome-react-vite/chrome-extension/manifest.ts:1)
  - Advantage: env/version driven build-time generation.

### B. Official samples
- `storage.session` usage for ephemeral runtime data:
  - Reference: [/tmp/oss-chrome-extensions-samples/api-samples/idle/service-worker.js](/tmp/oss-chrome-extensions-samples/api-samples/idle/service-worker.js:5)
- Popup/workerからの `executeScript` standard pattern:
  - Reference: [/tmp/oss-chrome-extensions-samples/functional-samples/reference.mv3-content-scripts/popup.js](/tmp/oss-chrome-extensions-samples/functional-samples/reference.mv3-content-scripts/popup.js:13)
- session data handoff across extension surfaces:
  - Reference: [/tmp/oss-chrome-extensions-samples/functional-samples/sample.sidepanel-dictionary/service-worker.js](/tmp/oss-chrome-extensions-samples/functional-samples/sample.sidepanel-dictionary/service-worker.js:29)
  - Reference: [/tmp/oss-chrome-extensions-samples/functional-samples/sample.sidepanel-dictionary/sidepanel.js](/tmp/oss-chrome-extensions-samples/functional-samples/sample.sidepanel-dictionary/sidepanel.js:22)

### C. WXT
- Runtime configにsecretを入れない方針を明確化:
  - Reference: [/tmp/oss-wxt/docs/guide/essentials/config/runtime.md](/tmp/oss-wxt/docs/guide/essentials/config/runtime.md:23)
- manifest生成フックで permission を明示的に管理:
  - Reference: [/tmp/oss-wxt/packages/analytics/modules/analytics/index.ts](/tmp/oss-wxt/packages/analytics/modules/analytics/index.ts:34)

### D. Plasmo
- manifestをビルド時生成し、配布パイプラインを統合:
  - Reference: [/tmp/oss-plasmo/cli/plasmo/src/commands/build.ts](/tmp/oss-plasmo/cli/plasmo/src/commands/build.ts:10)
- ストア提出の自動化導線を公式テンプレートで提供:
  - Reference: [/tmp/oss-plasmo/packages/init/templates/README.md](/tmp/oss-plasmo/packages/init/templates/README.md:29)

## Gap vs 診療記録くん v11
- Current app already follows key best practices:
  - `storage.session` for secret/snapshot
  - `executeScript` with active tab + allFrames false
- Additional patterns worth adopting:
  1. Restricted URL handling UX (e.g., `chrome://` injection不可時の通知)
  2. build-time manifest generation for env-specific values
  3. CI上の配布/提出自動化（Plasmoのようなパイプライン）
