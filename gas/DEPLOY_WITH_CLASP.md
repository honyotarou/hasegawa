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

## One-time Web app bootstrap
1. Apps Script UI で `Deploy > Manage deployments` を開く
2. 既存の本番 Web app deployment を確認する。無ければ `New deployment > Web app` で1本作る
3. deployment ID（`AKfy...`）を保存する
4. リポジトリ root で次を実行する

```bash
scripts/configure-gas-webapp.sh <deployment-id>
```

Notes:
- `gas/.webapp-deployment.json` はローカル専用でコミットしない。
- 以後の `scripts/deploy-gas.sh` はこの deployment ID を自動で `redeploy` する。

## Standard deploy flow
From repository root:
```bash
scripts/deploy-gas.sh
```

This does, in order:
1. Run `npm --prefix chrome-extension run test`
2. `git push origin <current-branch>`
3. `npx clasp push` from `gas/`
4. `npx clasp version`
5. `npx clasp redeploy <managed-deployment-id> -V <new-version>`

## Optional flags
```bash
# Skip tests
scripts/deploy-gas.sh --skip-tests

# Skip git push (clasp only)
scripts/deploy-gas.sh --no-git-push
```

```bash
# Override deployment ID for a single run
GAS_WEBAPP_DEPLOYMENT_ID=AKfy... scripts/deploy-gas.sh --no-git-push
```

## Safety checklist
- Working tree must be clean.
- Managed Web app deployment ID must be configured once via `scripts/configure-gas-webapp.sh`.
- `AuditEvidence` シートが自動作成されることを確認する。
- 監査同期を使う場合は `getEvidenceEvents` action が secret 認証で応答することを確認する。
- `DOCTOR_SECRET_MAP` と `EVIDENCE_SECRET` を設定する（`setupDoctorSecretMap`, `setupEvidenceSecret`）。
- `API_SECRET` は `DOCTOR_SECRET_MAP` 未設定時だけ使う migration fallback。移行後は削除対象。
