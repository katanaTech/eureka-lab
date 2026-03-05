/**
 * Badge definitions for the Eureka-Lab platform.
 * Each badge has conditions that are evaluated on gamification events.
 *
 * @module badge-definitions
 */

import type { BadgeCategory } from '@eureka-lab/shared-types';

/** Condition context passed to badge evaluators */
export interface BadgeConditionContext {
  /** Total prompts sent by the user (all time) */
  totalPrompts: number;
  /** Total modules completed by the user */
  totalModulesCompleted: number;
  /** Current streak in days */
  currentStreak: number;
  /** Set of completed module IDs */
  completedModuleIds: Set<string>;
  /** Total activities completed (all modules) */
  totalActivitiesCompleted: number;
  /** Best prompt score (0-1) ever achieved */
  bestPromptScore: number;
  /** Number of prompts that included context */
  promptsWithContext: number;
  /** Set of distinct activity types completed */
  activityTypesCompleted: Set<string>;
  /** Total workflows created by the user */
  totalWorkflowsCreated: number;
  /** Total workflow executions */
  totalWorkflowRuns: number;
  /** Number of workflows where user edited template steps */
  customizedWorkflows: number;
  /** Map of template ID → run count */
  workflowRunsByTemplate: Map<string, number>;
  /** Total code projects created by the user */
  totalProjectsCreated: number;
  /** Total AI code generations performed */
  totalCodeGenerations: number;
  /** Number of times user updated project code */
  totalProjectUpdates: number;
  /** Total buddy agents created by the user */
  totalAgentsCreated: number;
  /** Total chat exchanges with agents */
  totalAgentChats: number;
  /** Number of agent persona customisations */
  agentPersonaCustomizations: number;
}

/** Internal badge definition with condition evaluator */
export interface InternalBadgeDefinition {
  /** Unique badge identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description shown to the child */
  description: string;
  /** Emoji icon URL/path */
  iconUrl: string;
  /** Badge category for filtering */
  category: BadgeCategory;
  /**
   * Evaluate whether the badge should be awarded.
   * @param ctx - Current user stats context
   * @returns true if the badge conditions are met
   */
  condition: (ctx: BadgeConditionContext) => boolean;
}

/** All badge definitions for Level 1, Level 2, and Level 3 */
export const BADGE_DEFINITIONS: InternalBadgeDefinition[] = [
  // ── Milestone Badges ────────────────────────────────────────────────────
  {
    id: 'first-prompt',
    name: 'First Prompt',
    description: 'Send your very first AI prompt!',
    iconUrl: '💬',
    category: 'milestone',
    condition: (ctx) => ctx.totalPrompts >= 1,
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Complete your first learning module.',
    iconUrl: '🎯',
    category: 'milestone',
    condition: (ctx) => ctx.totalModulesCompleted >= 1,
  },
  {
    id: 'halfway-there',
    name: 'Halfway There',
    description: 'Complete 4 learning modules.',
    iconUrl: '⭐',
    category: 'milestone',
    condition: (ctx) => ctx.totalModulesCompleted >= 4,
  },
  {
    id: 'level-1-complete',
    name: 'Level 1 Complete',
    description: 'Master all Level 1 modules. Amazing!',
    iconUrl: '🏅',
    category: 'milestone',
    condition: (ctx) => ctx.totalModulesCompleted >= 8,
  },

  // ── Skill Badges ────────────────────────────────────────────────────────
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Achieve a 100% prompt quality score.',
    iconUrl: '💯',
    category: 'skill',
    condition: (ctx) => ctx.bestPromptScore >= 1.0,
  },
  {
    id: 'context-master',
    name: 'Context Master',
    description: 'Use context in 10 or more prompts.',
    iconUrl: '📚',
    category: 'skill',
    condition: (ctx) => ctx.promptsWithContext >= 10,
  },
  {
    id: 'prompt-explorer',
    name: 'Prompt Pro',
    description: 'Send 20 prompts to the AI.',
    iconUrl: '🚀',
    category: 'skill',
    condition: (ctx) => ctx.totalPrompts >= 20,
  },

  // ── Streak Badges ───────────────────────────────────────────────────────
  {
    id: 'streak-3',
    name: '3-Day Streak',
    description: 'Learn for 3 days in a row!',
    iconUrl: '🔥',
    category: 'streak',
    condition: (ctx) => ctx.currentStreak >= 3,
  },
  {
    id: 'streak-7',
    name: '7-Day Streak',
    description: 'A full week of learning — incredible!',
    iconUrl: '🔥',
    category: 'streak',
    condition: (ctx) => ctx.currentStreak >= 7,
  },
  {
    id: 'streak-14',
    name: '14-Day Streak',
    description: 'Two weeks of dedication. You rock!',
    iconUrl: '🔥',
    category: 'streak',
    condition: (ctx) => ctx.currentStreak >= 14,
  },
  {
    id: 'streak-30',
    name: '30-Day Streak',
    description: 'A whole month of daily learning!',
    iconUrl: '🏆',
    category: 'streak',
    condition: (ctx) => ctx.currentStreak >= 30,
  },

  // ── Special Badges ──────────────────────────────────────────────────────
  {
    id: 'curious-mind',
    name: 'Curious Mind',
    description: 'Try all activity types: lessons, exercises, reflections, and quizzes.',
    iconUrl: '🧠',
    category: 'special',
    condition: (ctx) => ctx.activityTypesCompleted.size >= 4,
  },
  {
    id: 'portfolio-builder',
    name: 'Portfolio Builder',
    description: 'Complete the Prompt Portfolio module.',
    iconUrl: '📁',
    category: 'special',
    condition: (ctx) => ctx.completedModuleIds.has('l1-m5-prompt-portfolio'),
  },

  // ── Level 2: Workflow Badges ──────────────────────────────────────────
  {
    id: 'first-workflow',
    name: 'First Workflow',
    description: 'Create your very first AI workflow!',
    iconUrl: '⚙️',
    category: 'milestone',
    condition: (ctx) => ctx.totalWorkflowsCreated >= 1,
  },
  {
    id: 'homework-hero',
    name: 'Homework Hero',
    description: 'Use the Homework Helper workflow 5 times.',
    iconUrl: '📖',
    category: 'skill',
    condition: (ctx) =>
      (ctx.workflowRunsByTemplate.get('homework-helper') ?? 0) >= 5,
  },
  {
    id: 'study-master',
    name: 'Study Master',
    description: 'Create a personalized study planner workflow.',
    iconUrl: '📅',
    category: 'skill',
    condition: (ctx) =>
      (ctx.workflowRunsByTemplate.get('study-planner') ?? 0) >= 1,
  },
  {
    id: 'workflow-customizer',
    name: 'Workflow Customizer',
    description: 'Customize a workflow template by editing its steps.',
    iconUrl: '✏️',
    category: 'skill',
    condition: (ctx) => ctx.customizedWorkflows >= 1,
  },
  {
    id: 'workflow-master',
    name: 'Workflow Master',
    description: 'Complete all Level 2 modules. You are a workflow pro!',
    iconUrl: '🏆',
    category: 'milestone',
    condition: (ctx) =>
      ctx.completedModuleIds.has('l2-m8-workflow-master'),
  },

  // ── Level 3: Vibe Coding Badges ───────────────────────────────────────
  {
    id: 'first-project',
    name: 'First Project',
    description: 'Create your very first code project!',
    iconUrl: '💻',
    category: 'milestone',
    condition: (ctx) => ctx.totalProjectsCreated >= 1,
  },
  {
    id: 'game-builder',
    name: 'Game Builder',
    description: 'Build a game project using a game template.',
    iconUrl: '🎮',
    category: 'skill',
    condition: (ctx) => ctx.totalProjectsCreated >= 1,
  },
  {
    id: 'code-customizer',
    name: 'Code Customizer',
    description: 'Modify a project\'s code 5 times.',
    iconUrl: '🔧',
    category: 'skill',
    condition: (ctx) => ctx.totalProjectUpdates >= 5,
  },
  {
    id: 'ai-coder',
    name: 'AI Coder',
    description: 'Use AI to generate code 10 times.',
    iconUrl: '🤖',
    category: 'skill',
    condition: (ctx) => ctx.totalCodeGenerations >= 10,
  },
  {
    id: 'vibe-coder',
    name: 'Vibe Coder',
    description: 'Complete all Level 3 modules. You are a vibe coding pro!',
    iconUrl: '🌟',
    category: 'milestone',
    condition: (ctx) =>
      ctx.completedModuleIds.has('l3-m8-vibe-coder-challenge'),
  },

  // ── Level 4: Buddy Agent Badges ─────────────────────────────────────
  {
    id: 'first-agent',
    name: 'First Agent',
    description: 'Create your very first AI agent!',
    iconUrl: '🤖',
    category: 'milestone',
    condition: (ctx) => ctx.totalAgentsCreated >= 1,
  },
  {
    id: 'agent-designer',
    name: 'Agent Designer',
    description: 'Customise an agent\'s persona 5 times.',
    iconUrl: '🎨',
    category: 'skill',
    condition: (ctx) => ctx.agentPersonaCustomizations >= 5,
  },
  {
    id: 'agent-tester',
    name: 'Agent Tester',
    description: 'Chat with your agents 10 times to test them.',
    iconUrl: '🧪',
    category: 'skill',
    condition: (ctx) => ctx.totalAgentChats >= 10,
  },
  {
    id: 'persona-master',
    name: 'Persona Master',
    description: 'Create agents using all 3 templates.',
    iconUrl: '👥',
    category: 'skill',
    condition: (ctx) => ctx.totalAgentsCreated >= 3,
  },
  {
    id: 'buddy-master',
    name: 'Buddy Master',
    description: 'Complete all Level 4 modules. You are an agent designer!',
    iconUrl: '🏆',
    category: 'milestone',
    condition: (ctx) =>
      ctx.completedModuleIds.has('l4-m8-buddy-master-challenge'),
  },
];

/**
 * Find a badge definition by ID.
 * @param badgeId - Badge identifier
 * @returns Badge definition or undefined
 */
export function findBadgeDefinition(
  badgeId: string,
): InternalBadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === badgeId);
}
