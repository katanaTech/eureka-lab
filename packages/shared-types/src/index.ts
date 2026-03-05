/**
 * Shared types for the Eureka-Lab platform.
 * Used by both frontend (apps/web) and backend (apps/api).
 */

// ── User & Auth ──────────────────────────────────────────────────────────────

/** User roles in the platform */
export type UserRole = 'child' | 'parent' | 'teacher' | 'admin';

/** Subscription plan types */
export type PlanType = 'free' | 'explorer' | 'creator';

/** Age cohort for UI/UX differentiation */
export type AgeCohort = 'junior' | 'senior';

/** Stripe subscription status values */
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'trialing';

/** Subscription data stored on the user document */
export interface SubscriptionData {
  /** Stripe customer ID (cus_...) */
  stripeCustomerId: string;
  /** Stripe subscription ID (sub_...) */
  stripeSubscriptionId: string;
  /** Current subscription status */
  status: SubscriptionStatus;
  /** Unix timestamp (seconds) when the current billing period ends */
  currentPeriodEnd: number;
  /** Whether the subscription will cancel at end of current period */
  cancelAtPeriodEnd: boolean;
}

/** User profile returned from auth endpoints */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  plan: PlanType;
  xp: number;
  /** Derived XP level number (1-6) */
  level: number;
  streak: number;
  children?: ChildSummary[];
  /** Active subscription details (undefined for free plan) */
  subscription?: SubscriptionData;
}

/** Summary of a child account (nested in parent profile) */
export interface ChildSummary {
  uid: string;
  displayName: string;
  age: number;
  plan: PlanType;
  xp: number;
}

// ── Learning Modules ─────────────────────────────────────────────────────────

/** The 4 learning levels */
export type LearningLevel = 1 | 2 | 3 | 4;

/** Module completion status */
export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';

/** Module summary for list views */
export interface ModuleSummary {
  id: string;
  level: LearningLevel;
  title: string;
  description: string;
  estimatedMinutes: number;
  status: ModuleStatus;
  requiredPlan: PlanType;
  xpReward: number;
}

/** Module progress tracking */
export interface ModuleProgress {
  moduleId: string;
  currentActivity: number;
  completedActivities: number[];
  score: number;
}

// ── AI & Moderation ──────────────────────────────────────────────────────────

/** Types of moderation flags */
export type ModerationFlagType = 'harmful' | 'adult' | 'pii' | 'off_topic' | 'jailbreak';

/** Severity levels for moderation flags */
export type ModerationSeverity = 'low' | 'medium' | 'high';

/** Moderation flag record */
export interface ModerationFlag {
  id: string;
  timestamp: string;
  flagType: ModerationFlagType;
  severity: ModerationSeverity;
  reviewStatus: 'pending' | 'reviewed' | 'dismissed';
}

/** Token budget limits per learning level (output tokens) */
export const TOKEN_BUDGETS: Record<LearningLevel, number> = {
  1: 500,
  2: 800,
  3: 1500,
  4: 1000,
};

// ── API Responses ────────────────────────────────────────────────────────────

/** Standard error response shape */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code?: string;
  errors?: FieldError[];
  timestamp: string;
}

/** Field-level validation error */
export interface FieldError {
  field: string;
  message: string;
}

// ── Feature Flags ────────────────────────────────────────────────────────────

/** Feature flag definitions — add new flags here */
export interface FeatureFlags {
  enableLevel2: boolean;
  enableLevel3: boolean;
  enableLevel4: boolean;
  enableStripePayments: boolean;
  enableOfflineMode: boolean;
  enableTeacherDashboard: boolean;
  enableGamification: boolean;
  enableMobileExperience: boolean;
}

/** Default feature flag values for MVP */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableLevel2: true,
  enableLevel3: true,
  enableLevel4: true,
  enableStripePayments: true,
  enableOfflineMode: true,
  enableTeacherDashboard: true,
  enableGamification: true,
  enableMobileExperience: true,
};

// ── Pricing Plans ────────────────────────────────────────────────────────────

/** Pricing plan definition for display */
export interface PricingPlan {
  /** Plan type identifier */
  id: PlanType;
  /** Display name (used as i18n key fallback) */
  name: string;
  /** Monthly price in USD (0 for free) */
  priceMonthly: number;
  /** Feature list (i18n keys) */
  features: string[];
  /** Whether this plan should be highlighted as popular */
  popular?: boolean;
}

/** Available pricing plans for the platform */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    features: [
      'pricing_feature_prompts_20',
      'pricing_feature_level1',
      'pricing_feature_basic_badges',
    ],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    priceMonthly: 9.99,
    features: [
      'pricing_feature_prompts_100',
      'pricing_feature_all_levels',
      'pricing_feature_all_badges',
      'pricing_feature_priority_support',
    ],
    popular: true,
  },
  {
    id: 'creator',
    name: 'Creator',
    priceMonthly: 19.99,
    features: [
      'pricing_feature_prompts_unlimited',
      'pricing_feature_all_levels',
      'pricing_feature_all_badges',
      'pricing_feature_5_children',
      'pricing_feature_priority_support',
    ],
  },
];

// ── Gamification ─────────────────────────────────────────────────────────────

/** Badge category for filtering and display */
export type BadgeCategory = 'milestone' | 'streak' | 'skill' | 'special';

/** Badge earned by a user */
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: BadgeCategory;
  unlockedAt?: string;
}

/** Badge definition (catalog entry, not user-specific) */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: BadgeCategory;
}

/** XP level tier */
export interface XpLevel {
  /** Level number (1-6) */
  level: number;
  /** Display name for this tier */
  name: string;
  /** Minimum XP to reach this level */
  minXp: number;
  /** Maximum XP before next level (Infinity for max level) */
  maxXp: number;
  /** Emoji icon for this level */
  icon: string;
}

/** XP level progression tiers */
export const XP_LEVELS: XpLevel[] = [
  { level: 1, name: 'AI Beginner', minXp: 0, maxXp: 99, icon: '🌱' },
  { level: 2, name: 'Prompt Explorer', minXp: 100, maxXp: 299, icon: '🔍' },
  { level: 3, name: 'Context Builder', minXp: 300, maxXp: 549, icon: '🧩' },
  { level: 4, name: 'AI Thinker', minXp: 550, maxXp: 849, icon: '🧠' },
  { level: 5, name: 'AI Builder', minXp: 850, maxXp: 1199, icon: '⚡' },
  { level: 6, name: 'AI Master', minXp: 1200, maxXp: Infinity, icon: '🏆' },
];

/**
 * Get the XP level for a given XP amount.
 * @param xp - Total XP earned
 * @returns The matching XpLevel tier
 */
export function getXpLevel(xp: number): XpLevel {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXp) {
      return XP_LEVELS[i];
    }
  }
  return XP_LEVELS[0];
}

/** Streak information for a user */
export interface StreakInfo {
  /** Current consecutive-day streak */
  current: number;
  /** Longest streak ever achieved */
  longest: number;
  /** ISO date of last activity */
  lastActiveDate: string;
  /** Remaining streak freezes this week (max 1) */
  freezesRemaining: number;
}

/** Streak milestone → bonus XP mapping */
export const STREAK_BONUSES: Record<number, number> = {
  3: 25,
  7: 50,
  14: 100,
  30: 200,
};

/** Full gamification profile for a user */
export interface UserGamificationProfile {
  /** Total XP earned */
  xp: number;
  /** Current XP level */
  level: XpLevel;
  /** Streak information */
  streak: StreakInfo;
  /** All earned badges */
  badges: Badge[];
  /** Recent daily activity (for heatmap) */
  recentActivity: DayActivity[];
}

/** Daily activity record for heatmap and parent dashboard */
export interface DayActivity {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Minutes of active usage */
  minutesActive: number;
  /** Number of AI prompts used */
  promptsUsed: number;
  /** Number of module activities worked on */
  activitiesCompleted: number;
  /** XP earned on this day */
  xpEarned: number;
}

/** Gamification event types that can trigger badge checks */
export type GamificationEventType =
  | 'activity_completed'
  | 'module_completed'
  | 'prompt_sent'
  | 'streak_milestone'
  | 'workflow_created'
  | 'workflow_run'
  | 'project_created'
  | 'code_generated'
  | 'agent_created'
  | 'agent_chat';

/** Event payload for gamification triggers */
export interface GamificationEvent {
  type: GamificationEventType;
  moduleId?: string;
  activityIndex?: number;
  promptScore?: number;
  streakDays?: number;
  templateId?: string;
}

// ── Workflows (Level 2) ─────────────────────────────────────────────────────

/** Workflow template category */
export type WorkflowCategory = 'homework' | 'study' | 'productivity';

/** A single step in a workflow */
export interface WorkflowStep {
  /** Step identifier (e.g., 'step-1') */
  id: string;
  /** AI prompt template — may contain {userInput} or {step-N} placeholders */
  prompt: string;
  /** Optional: step ID whose output feeds into this step */
  inputFrom?: string;
  /** Child-friendly description of what this step does */
  description: string;
}

/** User-owned workflow document stored in Firestore */
export interface WorkflowDocument {
  /** Auto-generated ID */
  id: string;
  /** Owner user UID */
  userId: string;
  /** User-chosen workflow name */
  name: string;
  /** What this workflow does */
  description: string;
  /** Template this workflow is based on */
  templateId: string;
  /** Ordered sequence of AI steps */
  steps: WorkflowStep[];
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last execution */
  lastRunAt?: string;
  /** Number of times executed */
  runCount: number;
}

/** Pre-built workflow template definition */
export interface WorkflowTemplate {
  /** Template identifier (e.g., 'homework-helper') */
  id: string;
  /** Display name */
  name: string;
  /** What this template helps with */
  description: string;
  /** Template category */
  category: WorkflowCategory;
  /** Pre-configured steps */
  defaultSteps: WorkflowStep[];
  /** Example input for testing */
  sampleInput: string;
}

/** SSE chunk types for workflow execution streaming */
export type WorkflowStreamType =
  | 'step_start'
  | 'step_token'
  | 'step_done'
  | 'workflow_done'
  | 'error';

/** SSE chunk payload during workflow execution */
export interface WorkflowStreamChunk {
  /** Event type */
  type: WorkflowStreamType;
  /** Current step index (0-based) */
  stepIndex?: number;
  /** Current step ID */
  stepId?: string;
  /** Token content (for step_token) */
  content?: string;
  /** Full step output (for step_done) */
  stepOutput?: string;
  /** All step outputs (for workflow_done) */
  outputs?: string[];
  /** Error code (for error) */
  code?: string;
  /** Error message (for error) */
  message?: string;
}

// ── Workflow Templates (re-exported) ────────────────────────────────────────
export { WORKFLOW_TEMPLATES, findTemplateById } from './workflow-templates';

// ── Code Projects (Level 3) ─────────────────────────────────────────────────

/** Code template category */
export type CodeCategory = 'game' | 'animation' | 'app' | 'art';

/** Target code file for AI generation */
export type CodeFileType = 'html' | 'css' | 'js';

/** User-owned code project stored in Firestore */
export interface CodeProjectDocument {
  /** Auto-generated ID */
  id: string;
  /** Owner user UID */
  userId: string;
  /** User-chosen project name */
  name: string;
  /** What this project does */
  description: string;
  /** Template this project is based on */
  templateId: string;
  /** HTML source code */
  htmlCode: string;
  /** CSS source code */
  cssCode: string;
  /** JavaScript source code */
  jsCode: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last modification */
  lastModifiedAt: string;
}

/** Pre-built code template definition */
export interface CodeTemplate {
  /** Template identifier (e.g., 'bouncing-ball') */
  id: string;
  /** Display name */
  name: string;
  /** What this template creates */
  description: string;
  /** Template category */
  category: CodeCategory;
  /** Starter HTML code */
  starterHtml: string;
  /** Starter CSS code */
  starterCss: string;
  /** Starter JavaScript code */
  starterJs: string;
  /** Example AI prompt for modifying this template */
  samplePrompt: string;
}

/** SSE chunk types for AI code generation streaming */
export type CodeStreamType =
  | 'code_start'
  | 'code_token'
  | 'code_done'
  | 'error';

/** SSE chunk payload during AI code generation */
export interface CodeStreamChunk {
  /** Event type */
  type: CodeStreamType;
  /** Target file being generated */
  language?: CodeFileType;
  /** Token content (for code_token) */
  content?: string;
  /** Full generated code (for code_done) */
  fullCode?: string;
  /** Error code (for error) */
  code?: string;
  /** Error message (for error) */
  message?: string;
}

// ── Code Templates (re-exported) ────────────────────────────────────────────
export { CODE_TEMPLATES, findCodeTemplateById } from './code-templates';

// ── Buddy Agents (Level 4) ──────────────────────────────────────────────────

/** Agent template category */
export type AgentCategory = 'learning' | 'creativity' | 'science' | 'general';

/** Agent persona configuration — defines the agent's personality and behavior */
export interface AgentPersona {
  /** Display name for the agent persona */
  name: string;
  /** Custom system prompt describing the agent's personality */
  systemPrompt: string;
  /** Knowledge base — what the agent knows about */
  knowledgeBase: string;
  /** Agent goals — what it tries to help with */
  goals: string[];
  /** Agent guardrails — what it should never do */
  guardrails: string[];
}

/** User-owned agent document stored in Firestore */
export interface AgentDocument {
  /** Auto-generated ID */
  id: string;
  /** Owner user UID */
  userId: string;
  /** User-chosen agent name */
  name: string;
  /** What this agent does */
  description: string;
  /** Template this agent is based on */
  templateId: string;
  /** Agent personality configuration */
  persona: AgentPersona;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last chat */
  lastChatAt?: string;
  /** Number of chat exchanges */
  chatCount: number;
}

/** A single message in an agent conversation */
export interface AgentMessage {
  /** Message sender */
  role: 'user' | 'assistant';
  /** Message text content */
  content: string;
  /** ISO timestamp of the message */
  timestamp: string;
}

/** Pre-built agent template definition */
export interface AgentTemplate {
  /** Template identifier (e.g., 'study-buddy') */
  id: string;
  /** Display name */
  name: string;
  /** What this template creates */
  description: string;
  /** Template category */
  category: AgentCategory;
  /** Default persona configuration */
  defaultPersona: AgentPersona;
  /** Example conversation starters */
  sampleConversation: string[];
}

/** SSE chunk types for agent chat streaming */
export type AgentChatStreamType =
  | 'message_start'
  | 'message_token'
  | 'message_done'
  | 'error';

/** SSE chunk payload during agent chat */
export interface AgentChatChunk {
  /** Event type */
  type: AgentChatStreamType;
  /** Token content (for message_token) */
  content?: string;
  /** Full assistant message (for message_done) */
  fullMessage?: string;
  /** Error code (for error) */
  code?: string;
  /** Error message (for error) */
  message?: string;
}

// ── Agent Templates (re-exported) ───────────────────────────────────────────
export { AGENT_TEMPLATES, findAgentTemplateById } from './agent-templates';

// ── Teacher & Classrooms (B2B) ──────────────────────────────────────────────

/** Classroom document stored in Firestore */
export interface ClassroomDocument {
  /** Auto-generated document ID */
  id: string;
  /** Teacher's Firebase UID */
  teacherId: string;
  /** Classroom display name */
  name: string;
  /** 6-character alphanumeric join code (uppercase) */
  joinCode: string;
  /** Array of student (child) UIDs enrolled in this classroom */
  studentIds: string[];
  /** Maximum number of students allowed (default 30) */
  maxStudents: number;
  /** ISO timestamp of creation */
  createdAt: string;
}

/** Classroom summary for list views (no student details) */
export interface ClassroomSummary {
  /** Classroom document ID */
  id: string;
  /** Classroom display name */
  name: string;
  /** 6-character join code */
  joinCode: string;
  /** Number of enrolled students */
  studentCount: number;
  /** ISO timestamp of creation */
  createdAt: string;
}

/** Per-student progress summary for teacher dashboard */
export interface StudentProgressSummary {
  /** Student's Firebase UID */
  uid: string;
  /** Anonymized display name (first name only) */
  displayName: string;
  /** Total XP earned */
  xp: number;
  /** Current XP level */
  level: XpLevel;
  /** Current streak in days */
  streak: number;
  /** Number of completed modules */
  modulesCompleted: number;
  /** Total number of modules available */
  totalModules: number;
  /** ISO date of last activity */
  lastActiveDate: string;
}

/** Full classroom detail with student progress (teacher view) */
export interface ClassroomDetailView {
  /** Classroom metadata */
  classroom: ClassroomDocument;
  /** Per-student progress summaries */
  students: StudentProgressSummary[];
}

// ── Push Notifications ──────────────────────────────────────────────────────

/** Push notification type identifiers */
export type NotificationType =
  | 'streak_reminder'
  | 'badge_earned'
  | 'parent_alert'
  | 'teacher_update'
  | 'weekly_report';

/** Device platform for push subscriptions */
export type DevicePlatform = 'web' | 'android' | 'ios';

/** Push subscription keys (Web Push standard) */
export interface PushSubscriptionKeys {
  /** p256dh public key */
  p256dh: string;
  /** Authentication secret */
  auth: string;
}

/** Registered device/subscription stored in Firestore */
export interface DeviceRegistration {
  /** Device/subscription identifier */
  id: string;
  /** Web Push endpoint URL */
  endpoint: string;
  /** Web Push encryption keys */
  keys: PushSubscriptionKeys;
  /** ISO timestamp of registration */
  createdAt: string;
  /** ISO timestamp of last push delivery */
  lastActiveAt: string;
  /** Device platform */
  platform: DevicePlatform;
}

/** Notification preferences stored per-user */
export interface NotificationPreferences {
  /** Master toggle for all notifications */
  notificationsEnabled: boolean;
  /** Daily streak reminders */
  streakReminders: boolean;
  /** Parent alerts about child activity */
  parentAlerts: boolean;
  /** New badge earned notifications */
  newBadges: boolean;
  /** Weekly progress report */
  weeklyReport: boolean;
  /** Quiet hours start (HH:mm format, e.g., "21:00") */
  quietHoursStart: string;
  /** Quiet hours end (HH:mm format, e.g., "07:00") */
  quietHoursEnd: string;
}

/** Default notification preferences for new users */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notificationsEnabled: false,
  streakReminders: true,
  parentAlerts: true,
  newBadges: true,
  weeklyReport: true,
  quietHoursStart: '21:00',
  quietHoursEnd: '07:00',
};

/** Push notification payload sent to client */
export interface PushNotificationPayload {
  /** Notification type */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Optional icon URL */
  icon?: string;
  /** URL to navigate to when notification is clicked */
  url?: string;
  /** Additional data for the client */
  data?: Record<string, string>;
}
