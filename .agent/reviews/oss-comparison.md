# OSS Comparison (類似実装調査)

## Compared Repositories
1. `Jonghakseo/chrome-extension-boilerplate-react-vite`
- Local: `/tmp/oss-chrome-react-vite`
- Checked commit: `6fde1ac`
2. `GoogleChrome/chrome-extensions-samples`
- Local: `/tmp/oss-chrome-extensions-samples`
- Checked commit: `4ffe03c`

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

## Gap vs 診療記録くん v11
- Current app already follows key best practices:
  - `storage.session` for secret/snapshot
  - `executeScript` with active tab + allFrames false
- Additional patterns worth adopting:
  1. Restricted URL handling UX (e.g., `chrome://` injection不可時の通知)
  2. build-time manifest generation for env-specific values
