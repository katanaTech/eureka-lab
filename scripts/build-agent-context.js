#!/usr/bin/env node

// ============================================================
// build-agent-context.js — Agent Context Assembler
// ============================================================
// Builds a single context block to prepend to any agent session.
// Reads current project state (task board, blockers, contracts)
// and outputs a compact context summary an agent can read fast.
//
// Usage:
//   node scripts/build-agent-context.js [AGENT_ID]
//   node scripts/build-agent-context.js FE
//   node scripts/build-agent-context.js BE
//   node scripts/build-agent-context.js --all
//
// Output: Paste the output BEFORE the agent initiation prompt
//         in your Claude conversation.
// ============================================================

const fs = require('fs');
const path = require('path');

const AGENT_IDS = ['ARCH', 'PM', 'FE', 'BE', 'QA', 'DEVOPS'];
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const PLANNING = path.join(DOCS_DIR, 'planning');

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function extractSection(content, heading) {
  if (!content) return null;
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.includes(heading));
  if (startIdx === -1) return null;
  const endIdx = lines.findIndex((l, i) => i > startIdx && l.startsWith('## '));
  const section = lines.slice(startIdx, endIdx === -1 ? startIdx + 20 : endIdx);
  return section.join('\n');
}

function getTasksForAgent(agentId) {
  const taskBoard = readFile(path.join(PLANNING, 'task-board.md'));
  if (!taskBoard) return { inProgress: [], blocked: [], todo: [] };

  const lines = taskBoard.split('\n');
  const inProgress = lines.filter(l => l.includes(`IN_PROGRESS [${agentId}]`));
  const blocked = lines.filter(l => l.includes(`| ${agentId} |`) && l.includes('BLOCKED'));
  const todo = lines.filter(l => l.includes(`| ${agentId} |`) && l.includes('| TODO |'));

  return { inProgress, blocked, todo: todo.slice(0, 5) }; // max 5 todo items
}

function getActiveBlockers() {
  const blockers = readFile(path.join(PLANNING, 'blockers.md'));
  if (!blockers) return [];
  return blockers.split('\n').filter(l => l.startsWith('## BLOCKER')).slice(0, 3);
}

function getOpenBugs() {
  const bugs = readFile(path.join(PLANNING, 'bugs.md'));
  if (!bugs) return { critical: 0, high: 0 };
  const critical = (bugs.match(/Severity.*CRITICAL/g) || []).length;
  const high = (bugs.match(/Severity.*HIGH/g) || []).length;
  return { critical, high };
}

function buildContext(agentId) {
  const tasks = getTasksForAgent(agentId);
  const blockers = getActiveBlockers();
  const bugs = getOpenBugs();
  
  // Read current phase from CLAUDE.md
  const claudeMd = readFile(path.join(DOCS_DIR, 'CLAUDE.md'));
  const phaseSection = extractSection(claudeMd, '## 6. Current Phase');

  const lines = [
    '<!-- ══════════════════════════════════════════════════════════ -->',
    `<!-- AGENT CONTEXT SNAPSHOT — ${agentId} — ${new Date().toISOString().split('T')[0]} -->`,
    '<!-- Paste this BEFORE the agent initiation prompt -->',
    '<!-- ══════════════════════════════════════════════════════════ -->',
    '',
    '## Current Project State (Auto-generated)',
    '',
  ];

  // Phase
  if (phaseSection) {
    lines.push('### Active Phase');
    lines.push(phaseSection.split('\n').slice(1, 6).join('\n'));
    lines.push('');
  }

  // Bugs alert
  if (bugs.critical > 0) {
    lines.push(`### 🚨 CRITICAL BUG ALERT`);
    lines.push(`${bugs.critical} critical bug(s) open — check planning/bugs.md before starting any new work.`);
    lines.push('');
  }

  // Blockers
  if (blockers.length > 0) {
    lines.push('### Active Blockers');
    blockers.forEach(b => lines.push(`- ${b.replace('## ', '')}`));
    lines.push('See planning/blockers.md for details.');
    lines.push('');
  }

  // Agent-specific tasks
  lines.push(`### ${agentId} Task Status`);

  if (tasks.inProgress.length > 0) {
    lines.push('**Currently IN PROGRESS:**');
    tasks.inProgress.forEach(t => {
      const parts = t.split('|').map(p => p.trim());
      lines.push(`- ${parts[1] || t}: ${parts[2] || ''}`);
    });
    lines.push('');
  }

  if (tasks.blocked.length > 0) {
    lines.push('**BLOCKED tasks (resolve these first):**');
    tasks.blocked.forEach(t => {
      const parts = t.split('|').map(p => p.trim());
      lines.push(`- ${parts[1] || t}`);
    });
    lines.push('');
  }

  if (tasks.todo.length > 0) {
    lines.push('**Next TODO tasks available:**');
    tasks.todo.forEach(t => {
      const parts = t.split('|').map(p => p.trim());
      lines.push(`- ${parts[1] || t}: ${parts[2] || ''}`);
    });
    if (tasks.todo.length === 5) {
      lines.push('  _(more tasks in planning/task-board.md)_');
    }
    lines.push('');
  }

  if (tasks.inProgress.length === 0 && tasks.blocked.length === 0 && tasks.todo.length === 0) {
    lines.push('_No tasks currently assigned. Check planning/task-board.md for available work._');
    lines.push('');
  }

  lines.push('<!-- ══════════════════════════════════════════════════════════ -->');
  lines.push('<!-- END CONTEXT SNAPSHOT — Now read the agent initiation prompt below -->');
  lines.push('<!-- ══════════════════════════════════════════════════════════ -->');
  lines.push('');

  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log('Usage: node scripts/build-agent-context.js [AGENT_ID|--all]');
  console.log('  AGENT_ID: ARCH, PM, FE, BE, QA, DEVOPS');
  console.log('  --all: generate context for all agents');
  process.exit(0);
}

if (args[0] === '--all') {
  AGENT_IDS.forEach(id => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`AGENT: ${id}`);
    console.log('='.repeat(60));
    console.log(buildContext(id));
  });
} else {
  const agentId = args[0].toUpperCase();
  if (!AGENT_IDS.includes(agentId)) {
    console.error(`Unknown agent: ${agentId}. Valid: ${AGENT_IDS.join(', ')}`);
    process.exit(1);
  }
  console.log(buildContext(agentId));
}
