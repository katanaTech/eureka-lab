/**
 * Frontend badge catalog — mirrors backend badge-definitions.ts
 * Used for display purposes only (conditions evaluated on backend).
 *
 * @module badge-catalog
 */

import type { BadgeDefinition } from '@eureka-lab/shared-types';

/** All badge definitions for display in the badge grid */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  /* Milestone */
  {
    id: 'first-prompt',
    name: 'First Prompt',
    description: 'Send your very first AI prompt!',
    iconUrl: '💬',
    category: 'milestone',
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Complete your first learning module.',
    iconUrl: '🎯',
    category: 'milestone',
  },
  {
    id: 'halfway-there',
    name: 'Halfway There',
    description: 'Complete 4 learning modules.',
    iconUrl: '⭐',
    category: 'milestone',
  },
  {
    id: 'level-1-complete',
    name: 'Level 1 Complete',
    description: 'Master all Level 1 modules. Amazing!',
    iconUrl: '🏅',
    category: 'milestone',
  },

  /* Skill */
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Achieve a 100% prompt quality score.',
    iconUrl: '💯',
    category: 'skill',
  },
  {
    id: 'context-master',
    name: 'Context Master',
    description: 'Use context in 10 or more prompts.',
    iconUrl: '📚',
    category: 'skill',
  },
  {
    id: 'prompt-explorer',
    name: 'Prompt Pro',
    description: 'Send 20 prompts to the AI.',
    iconUrl: '🚀',
    category: 'skill',
  },

  /* Streak */
  {
    id: 'streak-3',
    name: '3-Day Streak',
    description: 'Learn for 3 days in a row!',
    iconUrl: '🔥',
    category: 'streak',
  },
  {
    id: 'streak-7',
    name: '7-Day Streak',
    description: 'A full week of learning — incredible!',
    iconUrl: '🔥',
    category: 'streak',
  },
  {
    id: 'streak-14',
    name: '14-Day Streak',
    description: 'Two weeks of dedication. You rock!',
    iconUrl: '🔥',
    category: 'streak',
  },
  {
    id: 'streak-30',
    name: '30-Day Streak',
    description: 'A whole month of daily learning!',
    iconUrl: '🏆',
    category: 'streak',
  },

  /* Level 2 — Milestones */
  {
    id: 'first-workflow',
    name: 'First Workflow',
    description: 'Create your very first AI workflow!',
    iconUrl: '🔗',
    category: 'milestone',
  },
  {
    id: 'workflow-master',
    name: 'Workflow Master',
    description: 'Complete all Level 2 modules. You are unstoppable!',
    iconUrl: '🏆',
    category: 'milestone',
  },

  /* Level 2 — Skills */
  {
    id: 'homework-hero',
    name: 'Homework Hero',
    description: 'Run the Homework Helper workflow 5 times.',
    iconUrl: '📚',
    category: 'skill',
  },
  {
    id: 'study-master',
    name: 'Study Master',
    description: 'Create a Study Planner workflow.',
    iconUrl: '📅',
    category: 'skill',
  },
  {
    id: 'workflow-customizer',
    name: 'Workflow Customizer',
    description: 'Customize a template by editing its steps.',
    iconUrl: '✏️',
    category: 'skill',
  },

  /* Level 3 — Milestones */
  {
    id: 'first-project',
    name: 'First Project',
    description: 'Create your very first code project!',
    iconUrl: '💻',
    category: 'milestone',
  },
  {
    id: 'vibe-coder',
    name: 'Vibe Coder',
    description: 'Complete all Level 3 modules. You are a vibe coding pro!',
    iconUrl: '🌟',
    category: 'milestone',
  },

  /* Level 3 — Skills */
  {
    id: 'game-builder',
    name: 'Game Builder',
    description: 'Build a game project using a game template.',
    iconUrl: '🎮',
    category: 'skill',
  },
  {
    id: 'code-customizer',
    name: 'Code Customizer',
    description: "Modify a project's code 5 times.",
    iconUrl: '🔧',
    category: 'skill',
  },
  {
    id: 'ai-coder',
    name: 'AI Coder',
    description: 'Use AI to generate code 10 times.',
    iconUrl: '🤖',
    category: 'skill',
  },

  /* Level 4 — Milestones */
  {
    id: 'first-agent',
    name: 'First Agent',
    description: 'Create your very first AI buddy agent!',
    iconUrl: '🤝',
    category: 'milestone',
  },
  {
    id: 'buddy-master',
    name: 'Buddy Master',
    description: 'Complete all Level 4 modules. You are an agent designer!',
    iconUrl: '👑',
    category: 'milestone',
  },

  /* Level 4 — Skills */
  {
    id: 'agent-designer',
    name: 'Agent Designer',
    description: "Customize an agent's persona 5 times.",
    iconUrl: '🎨',
    category: 'skill',
  },
  {
    id: 'agent-tester',
    name: 'Agent Tester',
    description: 'Chat with your agents 10 times.',
    iconUrl: '💬',
    category: 'skill',
  },
  {
    id: 'persona-master',
    name: 'Persona Master',
    description: 'Create agents using all 3 starter templates.',
    iconUrl: '🎭',
    category: 'skill',
  },

  /* Special */
  {
    id: 'curious-mind',
    name: 'Curious Mind',
    description: 'Try all activity types: lessons, exercises, reflections, and quizzes.',
    iconUrl: '🧠',
    category: 'special',
  },
  {
    id: 'portfolio-builder',
    name: 'Portfolio Builder',
    description: 'Complete the Prompt Portfolio module.',
    iconUrl: '📁',
    category: 'special',
  },
];
