#!/bin/bash

# ============================================================
# sync-check.sh — Eureka-lab Platform Agent Sync Utility
# ============================================================
# Run this at the start of each work session to get a
# snapshot of project state before spawning any agent.
#
# Usage:
#   chmod +x scripts/sync-check.sh
#   ./scripts/sync-check.sh
#   ./scripts/sync-check.sh --full    (includes full task details)
# ============================================================

set -euo pipefail

DOCS_DIR="$(cd "$(dirname "$0")/../docs" && pwd)"
PLANNING="$DOCS_DIR/planning"
CONTEXT="$DOCS_DIR/context"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${BLUE}  Eureka-lab PLATFORM — Agent Sync Check${RESET}"
echo -e "${BOLD}${BLUE}  $(date '+%Y-%m-%d %H:%M')${RESET}"
echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════${RESET}"
echo ""

# ── Current phase ────────────────────────────────────────────
echo -e "${CYAN}${BOLD}▶ CURRENT STATE${RESET}"
grep -A5 "## 6. Current Phase" "$DOCS_DIR/CLAUDE.md" | tail -5 | sed 's/^/  /'
echo ""

# ── Task board summary ────────────────────────────────────────
echo -e "${CYAN}${BOLD}▶ TASK BOARD SUMMARY${RESET}"

TODO=$(grep -c "| TODO |" "$PLANNING/task-board.md" 2>/dev/null || echo 0)
IN_PROGRESS=$(grep -c "IN_PROGRESS" "$PLANNING/task-board.md" 2>/dev/null || echo 0)
DONE=$(grep -c "| DONE |" "$PLANNING/task-board.md" 2>/dev/null || echo 0)
BLOCKED=$(grep -c "BLOCKED" "$PLANNING/task-board.md" 2>/dev/null || echo 0)

echo -e "  ${GREEN}✓ DONE:${RESET}        $DONE tasks"
echo -e "  ${BLUE}▶ IN PROGRESS:${RESET} $IN_PROGRESS tasks"
echo -e "  ${YELLOW}○ TODO:${RESET}        $TODO tasks"
echo -e "  ${RED}✗ BLOCKED:${RESET}     $BLOCKED tasks"
echo ""

# ── In-progress tasks ─────────────────────────────────────────
echo -e "${CYAN}${BOLD}▶ IN PROGRESS${RESET}"
if grep -q "IN_PROGRESS" "$PLANNING/task-board.md" 2>/dev/null; then
  grep "IN_PROGRESS" "$PLANNING/task-board.md" | \
    sed 's/|/│/g' | \
    sed 's/^/  /' | \
    awk -F'│' '{printf "  %-12s %-40s %s\n", $3, $2, $5}'
else
  echo -e "  ${YELLOW}No tasks currently in progress${RESET}"
fi
echo ""

# ── Blockers ──────────────────────────────────────────────────
echo -e "${CYAN}${BOLD}▶ BLOCKERS${RESET}"
if [ -f "$PLANNING/blockers.md" ] && grep -q "^## BLOCKER" "$PLANNING/blockers.md" 2>/dev/null; then
  echo -e "  ${RED}⚠️  Active blockers found — see planning/blockers.md${RESET}"
  grep "^## BLOCKER" "$PLANNING/blockers.md" | sed 's/^/  /'
else
  echo -e "  ${GREEN}No active blockers${RESET}"
fi
echo ""

# ── Blocked tasks from task board ────────────────────────────
echo -e "${CYAN}${BOLD}▶ BLOCKED TASKS${RESET}"
if grep -q "BLOCKED" "$PLANNING/task-board.md" 2>/dev/null; then
  echo -e "  ${RED}Tasks with BLOCKED status:${RESET}"
  grep "BLOCKED" "$PLANNING/task-board.md" | \
    grep -v "^#" | \
    sed 's/^/  /'
else
  echo -e "  ${GREEN}No blocked tasks${RESET}"
fi
echo ""

# ── Open bugs ─────────────────────────────────────────────────
echo -e "${CYAN}${BOLD}▶ OPEN BUGS${RESET}"
if [ -f "$PLANNING/bugs.md" ]; then
  CRITICAL=$(grep -c "Severity.*CRITICAL" "$PLANNING/bugs.md" 2>/dev/null || echo 0)
  HIGH=$(grep -c "Severity.*HIGH" "$PLANNING/bugs.md" 2>/dev/null || echo 0)
  MEDIUM=$(grep -c "Severity.*MEDIUM" "$PLANNING/bugs.md" 2>/dev/null || echo 0)

  if [ "$CRITICAL" -gt 0 ]; then
    echo -e "  ${RED}${BOLD}🚨 CRITICAL: $CRITICAL (RELEASE BLOCKED)${RESET}"
  else
    echo -e "  ${GREEN}✓ No critical bugs${RESET}"
  fi
  [ "$HIGH" -gt 0 ] && echo -e "  ${RED}HIGH: $HIGH${RESET}"
  [ "$MEDIUM" -gt 0 ] && echo -e "  ${YELLOW}MEDIUM: $MEDIUM${RESET}"
else
  echo -e "  ${GREEN}No bugs filed${RESET}"
fi
echo ""

# ── Sprint exit criteria check ────────────────────────────────
echo -e "${CYAN}${BOLD}▶ SPRINT 1 EXIT CRITERIA${RESET}"
SPRINT_FILE="$PLANNING/sprint-01.md"
if [ -f "$SPRINT_FILE" ]; then
  CHECKED=$(grep -c "\- \[x\]" "$SPRINT_FILE" 2>/dev/null || echo 0)
  UNCHECKED=$(grep -c "\- \[ \]" "$SPRINT_FILE" 2>/dev/null || echo 0)
  TOTAL=$((CHECKED + UNCHECKED))
  echo -e "  ${CHECKED}/${TOTAL} exit criteria met"
  grep "\- \[ \]" "$SPRINT_FILE" | head -5 | sed 's/^/  ⬜ /'
  [ "$UNCHECKED" -gt 5 ] && echo "  ... and $((UNCHECKED-5)) more"
else
  echo -e "  ${YELLOW}Sprint file not found${RESET}"
fi
echo ""

# ── Recommended next agent actions ───────────────────────────
echo -e "${CYAN}${BOLD}▶ RECOMMENDED NEXT ACTIONS${RESET}"

# Check if DEV-001 is done (monorepo scaffold — everything depends on it)
if grep -q "DEV-001.*DONE" "$PLANNING/task-board.md" 2>/dev/null; then
  echo -e "  ${GREEN}✓ Monorepo scaffold done — FE and BE can start${RESET}"
else
  echo -e "  ${RED}⚡ DEVOPS: Start DEV-001 (monorepo scaffold) — all agents blocked on this${RESET}"
fi

# Check if ARCH-001 is done (API contracts)
if grep -q "ARCH-001.*DONE" "$PLANNING/task-board.md" 2>/dev/null; then
  echo -e "  ${GREEN}✓ API contracts done — Sprint 2 auth tasks unblocked${RESET}"
else
  echo -e "  ${YELLOW}⚡ ARCH: Complete ARCH-001 (API contracts) — needed before Sprint 2${RESET}"
fi
echo ""

# ── Full mode output ──────────────────────────────────────────
if [[ "${1:-}" == "--full" ]]; then
  echo -e "${CYAN}${BOLD}▶ FULL TASK LIST${RESET}"
  cat "$PLANNING/task-board.md" | head -100
  echo ""
fi

echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}Paste the appropriate agent prompt from docs/agents/ to continue.${RESET}"
echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════${RESET}"
echo ""
