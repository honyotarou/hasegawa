#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GAS_DIR="$ROOT_DIR/gas"
DEPLOY_LIB="$ROOT_DIR/chrome-extension/scripts/gas-deploy-lib.mjs"
DEPLOYMENT_CONFIG_PATH="$ROOT_DIR/gas/.webapp-deployment.json"

RUN_TESTS=1
RUN_GIT_PUSH=1

usage() {
  cat <<USAGE
Usage: scripts/deploy-gas.sh [--skip-tests] [--no-git-push] [-h|--help]

Options:
  --skip-tests   Skip chrome-extension unit tests.
  --no-git-push  Skip git push and only run clasp push.
  -h, --help     Show this help message.

One-time bootstrap:
  1. Create or identify a valid Web app deployment in the Apps Script UI.
  2. Save its deployment ID locally:
     scripts/configure-gas-webapp.sh <deployment-id>

Environment:
  GAS_WEBAPP_DEPLOYMENT_ID  Override the managed Web app deployment ID for this run.
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --skip-tests)
      RUN_TESTS=0
      ;;
    --no-git-push)
      RUN_GIT_PUSH=0
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      usage
      exit 1
      ;;
  esac
done

cd "$ROOT_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[ERROR] Working tree is not clean. Commit/stash changes first." >&2
  exit 1
fi

if [ "$RUN_TESTS" -eq 1 ]; then
  echo "[1/4] Running tests: npm --prefix chrome-extension run test"
  npm --prefix chrome-extension run test
else
  echo "[1/4] Skipped tests"
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" = "HEAD" ]; then
  echo "[ERROR] Detached HEAD state detected. Checkout a branch before deploying." >&2
  exit 1
fi
if [ "$RUN_GIT_PUSH" -eq 1 ]; then
  echo "[2/4] Pushing Git branch: $CURRENT_BRANCH"
  git push origin "$CURRENT_BRANCH"
else
  echo "[2/4] Skipped git push"
fi

if [ ! -f "$GAS_DIR/.clasp.json" ]; then
  echo "[ERROR] gas/.clasp.json not found." >&2
  echo "Run one-time setup:" >&2
  echo "  cd gas" >&2
  echo "  npx clasp login" >&2
  echo "  npx clasp clone <SCRIPT_ID> --rootDir ." >&2
  exit 1
fi

if [ ! -f "$GAS_DIR/appsscript.json" ]; then
  echo "[ERROR] gas/appsscript.json not found. Ensure GAS manifest exists." >&2
  exit 1
fi

DEPLOYMENT_ID="$(node "$DEPLOY_LIB" resolve --config "$DEPLOYMENT_CONFIG_PATH")"
if [ -z "$DEPLOYMENT_ID" ]; then
  echo "[ERROR] Managed Web app deployment ID is not configured." >&2
  echo "Run one-time bootstrap in Apps Script UI, then save it locally:" >&2
  echo "  scripts/configure-gas-webapp.sh <deployment-id>" >&2
  echo "Or override per run with GAS_WEBAPP_DEPLOYMENT_ID=<deployment-id>" >&2
  exit 1
fi

echo "[3/5] Pushing GAS sources with clasp"
(
  cd "$GAS_DIR"
  npx clasp push
)

echo "[4/5] Creating immutable GAS version"
VERSION_OUTPUT="$(
  cd "$GAS_DIR"
  npx clasp version "deploy $(git rev-parse --short HEAD)"
)"
echo "$VERSION_OUTPUT"
VERSION_NUMBER="$(printf '%s' "$VERSION_OUTPUT" | node "$DEPLOY_LIB" parse-version)"

echo "[5/5] Updating managed Web App deployment: $DEPLOYMENT_ID -> version $VERSION_NUMBER"
(
  cd "$GAS_DIR"
  npx clasp redeploy "$DEPLOYMENT_ID" -V "$VERSION_NUMBER" -d "deploy $(git rev-parse --short HEAD)"
)
