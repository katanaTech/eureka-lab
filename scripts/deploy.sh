#!/usr/bin/env bash
# deploy.sh — Manual deployment utility for Eureka-lab Platform
# Usage: ./scripts/deploy.sh [staging|production] [web|api|all]
# Example: ./scripts/deploy.sh staging all

set -euo pipefail

ENVIRONMENT=${1:-staging}
TARGET=${2:-all}

echo "=== Eureka-lab Platform — Manual Deploy ==="
echo "Environment: $ENVIRONMENT"
echo "Target:      $TARGET"
echo ""

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "ERROR: Environment must be 'staging' or 'production'"
  exit 1
fi

if [[ "$ENVIRONMENT" == "production" ]]; then
  echo "WARNING: You are deploying to PRODUCTION."
  read -r -p "Type 'yes' to confirm: " confirm
  if [[ "$confirm" != "yes" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

deploy_web() {
  echo "Deploying apps/web to Vercel ($ENVIRONMENT)..."
  if [[ "$ENVIRONMENT" == "production" ]]; then
    vercel --prod
  else
    vercel
  fi
  echo "✓ Web deployed"
}

deploy_api() {
  echo "Deploying apps/api to Railway ($ENVIRONMENT)..."
  railway up --service api
  echo "✓ API deployed"
}

case "$TARGET" in
  web)  deploy_web ;;
  api)  deploy_api ;;
  all)  deploy_web && deploy_api ;;
  *)
    echo "ERROR: Target must be 'web', 'api', or 'all'"
    exit 1
    ;;
esac

echo ""
echo "=== Deploy complete ==="
