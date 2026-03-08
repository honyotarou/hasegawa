#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_LIB="$ROOT_DIR/chrome-extension/scripts/gas-deploy-lib.mjs"
DEPLOYMENT_CONFIG_PATH="$ROOT_DIR/gas/.webapp-deployment.json"

if [ "$#" -ne 1 ]; then
  echo "Usage: scripts/configure-gas-webapp.sh <deployment-id>" >&2
  exit 1
fi

CONFIG_PATH="$(node "$DEPLOY_LIB" write-config --config "$DEPLOYMENT_CONFIG_PATH" --deployment-id "$1")"
echo "Saved managed Web app deployment ID to $CONFIG_PATH"
