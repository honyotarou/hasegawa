#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[preflight] start: $(date '+%Y-%m-%d %H:%M:%S')"
echo "[preflight] cwd: $ROOT_DIR"

echo "[preflight] 1/5 unit(ui) tests"
npm --prefix chrome-extension run test

echo "[preflight] 2/5 e2e tests"
npm --prefix chrome-extension run test:e2e

echo "[preflight] 3/5 coverage"
npm --prefix chrome-extension run test:coverage

echo "[preflight] 4/5 benchmark"
npm --prefix chrome-extension run bench

echo "[preflight] 5/5 build"
npm --prefix chrome-extension run build

echo "[preflight] done: $(date '+%Y-%m-%d %H:%M:%S')"
