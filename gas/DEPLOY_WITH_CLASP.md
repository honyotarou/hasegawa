# GAS deploy with clasp + Git

## Why
- Keep Git commit and GAS deployed code aligned.
- Prevent accidental upload of tests/lint files via `.claspignore`.

## One-time setup
```bash
cd gas
npx clasp login
npx clasp clone <SCRIPT_ID> --rootDir .
```

Notes:
- `gas/.clasp.json` is machine/environment specific and should not be committed.
- `gas/.claspignore` allows only `.gs`, `.html`, and `appsscript.json`.

## Standard deploy flow
From repository root:
```bash
scripts/deploy-gas.sh
```

This does, in order:
1. Run `npm --prefix chrome-extension run test`
2. `git push origin <current-branch>`
3. `npx clasp push` from `gas/`
4. Remind you to update **existing Web App deployment** in GAS UI

## Optional flags
```bash
# Skip tests
scripts/deploy-gas.sh --skip-tests

# Skip git push (clasp only)
scripts/deploy-gas.sh --no-git-push
```

## Safety checklist
- Working tree must be clean.
- Use "既存のデプロイを更新" in GAS deployment UI (URL fixed).
- `AuditEvidence` シートが自動作成されることを確認する。
- 監査同期を使う場合は `getEvidenceEvents` action が secret 認証で応答することを確認する。
