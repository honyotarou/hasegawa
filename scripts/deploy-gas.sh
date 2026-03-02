#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GAS_DIR="$ROOT_DIR/gas"

RUN_TESTS=1
RUN_GIT_PUSH=1

usage() {
  cat <<USAGE
Usage: scripts/deploy-gas.sh [--skip-tests] [--no-git-push]

Options:
  --skip-tests   Skip chrome-extension unit tests.
  --no-git-push  Skip git push and only run clasp push.
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

echo "[3/4] Pushing GAS sources with clasp"
(
  cd "$GAS_DIR"
  npx clasp push
)

echo "[4/4] Next manual step in GAS UI"
echo "Update the existing Web App deployment to keep URL fixed."
