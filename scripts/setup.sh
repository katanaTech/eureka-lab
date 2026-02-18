#!/bin/bash

# ============================================================
# setup.sh — New Developer / Agent Environment Setup
# ============================================================
# Validates that all prerequisites are installed and
# creates the correct local .env files from examples.
#
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
# ============================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RESET='\033[0m'
BOLD='\033[1m'

PASS="${GREEN}✓${RESET}"
FAIL="${RED}✗${RESET}"
WARN="${YELLOW}⚠${RESET}"

echo ""
echo -e "${BOLD}${BLUE}AI Literacy Platform — Environment Setup${RESET}"
echo -e "${BLUE}─────────────────────────────────────────${RESET}"
echo ""

ERRORS=0

# ── Prerequisite checks ───────────────────────────────────────
echo -e "${BOLD}Checking prerequisites...${RESET}"

# Node.js version
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -ge 20 ]; then
    echo -e "  $PASS Node.js $(node --version) (≥20 required)"
  else
    echo -e "  $FAIL Node.js $(node --version) — need v20+"
    ERRORS=$((ERRORS+1))
  fi
else
  echo -e "  $FAIL Node.js not found — install from nodejs.org"
  ERRORS=$((ERRORS+1))
fi

# pnpm
if command -v pnpm &> /dev/null; then
  echo -e "  $PASS pnpm $(pnpm --version)"
else
  echo -e "  $FAIL pnpm not found — run: npm install -g pnpm"
  ERRORS=$((ERRORS+1))
fi

# Git
if command -v git &> /dev/null; then
  echo -e "  $PASS git $(git --version | cut -d' ' -f3)"
else
  echo -e "  $FAIL git not found"
  ERRORS=$((ERRORS+1))
fi

# Firebase CLI
if command -v firebase &> /dev/null; then
  echo -e "  $PASS Firebase CLI $(firebase --version)"
else
  echo -e "  $WARN Firebase CLI not found — run: npm install -g firebase-tools"
  echo -e "       (Required for Firestore rules deployment)"
fi

# Vercel CLI
if command -v vercel &> /dev/null; then
  echo -e "  $PASS Vercel CLI $(vercel --version 2>/dev/null | head -1)"
else
  echo -e "  $WARN Vercel CLI not found — run: npm install -g vercel"
  echo -e "       (Required for DEVOPS agent only)"
fi

echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}${BOLD}$ERRORS prerequisite(s) failed. Fix them before continuing.${RESET}"
  exit 1
fi

# ── Env file setup ────────────────────────────────────────────
echo -e "${BOLD}Setting up environment files...${RESET}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Frontend .env.local
if [ ! -f "$REPO_ROOT/apps/web/.env.local" ]; then
  if [ -f "$REPO_ROOT/apps/web/.env.example" ]; then
    cp "$REPO_ROOT/apps/web/.env.example" "$REPO_ROOT/apps/web/.env.local"
    echo -e "  $PASS Created apps/web/.env.local from .env.example"
    echo -e "  ${YELLOW}     ➜ Fill in real values from your team password manager${RESET}"
  else
    echo -e "  $WARN apps/web/.env.example not found — create it first (run DEVOPS DEV-001)"
  fi
else
  echo -e "  $PASS apps/web/.env.local already exists"
fi

# Backend .env
if [ ! -f "$REPO_ROOT/apps/api/.env" ]; then
  if [ -f "$REPO_ROOT/apps/api/.env.example" ]; then
    cp "$REPO_ROOT/apps/api/.env.example" "$REPO_ROOT/apps/api/.env"
    echo -e "  $PASS Created apps/api/.env from .env.example"
    echo -e "  ${YELLOW}     ➜ Fill in real values from your team password manager${RESET}"
  else
    echo -e "  $WARN apps/api/.env.example not found — create it first (run DEVOPS DEV-001)"
  fi
else
  echo -e "  $PASS apps/api/.env already exists"
fi

echo ""

# ── Install dependencies ─────────────────────────────────────
echo -e "${BOLD}Installing dependencies...${RESET}"
if [ -f "$REPO_ROOT/package.json" ]; then
  cd "$REPO_ROOT"
  pnpm install --frozen-lockfile
  echo -e "  $PASS Dependencies installed"
else
  echo -e "  $WARN No root package.json found — run DEVOPS DEV-001 first to scaffold the monorepo"
  exit 0
fi

echo ""

# ── Verify builds ─────────────────────────────────────────────
echo -e "${BOLD}Verifying TypeScript compilation...${RESET}"

if pnpm tsc --noEmit 2>/dev/null; then
  echo -e "  $PASS TypeScript compiles clean"
else
  echo -e "  $WARN TypeScript errors found — run 'pnpm tsc --noEmit' to see details"
fi

echo ""

# ── Health check ─────────────────────────────────────────────
echo -e "${BOLD}Quick health check instructions:${RESET}"
echo -e "  1. Start dev servers:  ${CYAN}pnpm dev${RESET}"
echo -e "  2. Frontend:           ${CYAN}http://localhost:3000${RESET}"
echo -e "  3. Backend health:     ${CYAN}http://localhost:3001/health${RESET}"
echo -e "  4. Run tests:          ${CYAN}pnpm test${RESET}"
echo ""

echo -e "${GREEN}${BOLD}Setup complete!${RESET}"
echo ""
echo -e "Next step: Run ${CYAN}./scripts/sync-check.sh${RESET} to see current agent task status."
echo ""
