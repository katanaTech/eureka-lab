import type {
  UserProfile,
  ChildSummary,
  ModuleSummary,
  ModuleProgress,
  ModuleStatus,
  PlanType,
  Badge,
  UserGamificationProfile,
  DayActivity,
  XpLevel,
  WorkflowDocument,
  WorkflowStep,
  WorkflowStreamChunk,
  CodeProjectDocument,
  CodeStreamChunk,
  CodeFileType,
  AgentDocument,
  AgentPersona,
  AgentMessage,
  AgentChatChunk,
  SubscriptionData,
  ClassroomDocument,
  ClassroomSummary,
  ClassroomDetailView,
  StudentProgressSummary,
  DeviceRegistration,
  NotificationPreferences,
  DevicePlatform,
  PushSubscriptionKeys,
} from '@eureka-lab/shared-types';
import { auth } from './firebase';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3011/api/v1';

/**
 * Get the current Firebase ID token for authenticated API calls.
 * @returns Firebase ID token or null if not authenticated
 */
async function getToken(): Promise<string | null> {
  if (!auth) return null;
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * Typed API client — the ONLY place that calls fetch.
 * CLAUDE.md Rule 15: Frontend-backend communication via typed API client only.
 * CLAUDE.md Rule 1: NEVER call AI APIs from frontend code.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message, error.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** Custom API error with status code and error code */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/* ── Auth Types ────────────────────────────────────────────────── */

/** Signup response (before full profile is available) */
interface SignupResponse {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  token: string;
}

/** Login response — same as UserProfile but without streak */
type LoginResponse = Omit<UserProfile, 'streak'> & { streak?: number };

/** Add child response */
interface AddChildResponse {
  uid: string;
  displayName: string;
  role: string;
  age: number;
  parentUid: string;
  plan: string;
}

/* ── Module Types ──────────────────────────────────────────────── */

/** Module list response */
interface ModulesListResponse {
  modules: ModuleListItem[];
}

/** Module item in list view */
export interface ModuleListItem {
  id: string;
  level: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  status: ModuleStatus;
  requiredPlan: PlanType;
  xpReward: number;
}

/** Activity definition */
export interface ModuleActivity {
  title: string;
  description: string;
  type: 'lesson' | 'prompt_exercise' | 'reflection' | 'quiz' | 'workflow_exercise' | 'code_exercise' | 'agent_exercise';
  xpReward: number;
}

/** Full module detail response */
export interface ModuleDetailResponse {
  id: string;
  level: number;
  title: string;
  description: string;
  objectives: string[];
  activities: ModuleActivity[];
  status: ModuleStatus;
  progress?: {
    currentActivity: number;
    completedActivities: number[];
    score: number;
  };
}

/** Activity completion response */
interface ActivityCompletionResponse {
  xpAwarded: number;
  streakBonusXp: number;
  badgesUnlocked: Badge[];
  moduleCompleted: boolean;
  nextModuleId?: string;
  currentStreak: number;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  xp: number;
  level: XpLevel;
  streak: number;
}

/* ── AI Types ──────────────────────────────────────────────────── */

/** SSE chunk from the AI prompt endpoint */
export interface AiStreamChunk {
  type: 'token' | 'done' | 'error';
  content?: string;
  promptScore?: number;
  tokensUsed?: number;
  code?: string;
  message?: string;
}

/* ── Auth API ──────────────────────────────────────────────────── */

/** Auth API endpoints */
export const authApi = {
  /** Create a parent account */
  signup: (data: { email: string; password: string; displayName: string; role: string }) =>
    request<SignupResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  /** Exchange Firebase ID token for enriched profile */
  login: (idToken: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ idToken }) }),

  /** Get current user profile */
  getMe: () => request<UserProfile>('/auth/me'),

  /** Logout (revoke server session) */
  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  /** Add a child account */
  addChild: (data: { displayName: string; birthYear: number }) =>
    request<AddChildResponse>('/auth/add-child', { method: 'POST', body: JSON.stringify(data) }),
};

/* ── Modules API ───────────────────────────────────────────────── */

/** Modules API endpoints */
export const modulesApi = {
  /** List all modules (optionally filtered by level) */
  list: (level?: number) => {
    const query = level ? `?level=${level}` : '';
    return request<ModulesListResponse>(`/modules${query}`);
  },

  /** Get a single module with full content */
  getById: (id: string) => request<ModuleDetailResponse>(`/modules/${id}`),
};

/* ── Progress API ──────────────────────────────────────────────── */

/** Progress API endpoints */
export const progressApi = {
  /** Complete an activity within a module */
  completeActivity: (
    moduleId: string,
    data: { activityIndex: number; response?: string; score?: number },
  ) =>
    request<ActivityCompletionResponse>(
      `/progress/${moduleId}/complete`,
      { method: 'POST', body: JSON.stringify(data) },
    ),
};

/* ── Gamification API ──────────────────────────────────────────── */

/** Gamification API endpoints */
export const gamificationApi = {
  /** Get full gamification profile (XP, level, streak, badges, activity) */
  getProfile: () =>
    request<UserGamificationProfile>('/gamification/profile'),

  /** Get all earned badges */
  getBadges: () => request<Badge[]>('/gamification/badges'),

  /** Get activity calendar for heatmap */
  getActivity: (days: number = 30) =>
    request<DayActivity[]>(`/gamification/activity?days=${days}`),

  /** Use a streak freeze */
  useStreakFreeze: () =>
    request<{ message: string }>('/gamification/streak/freeze', {
      method: 'POST',
    }),

  /** Get anonymized leaderboard */
  getLeaderboard: (limit: number = 10) =>
    request<LeaderboardEntry[]>(`/gamification/leaderboard?limit=${limit}`),
};

/* ── Workflows API ────────────────────────────────────────────── */

/** Create workflow request body */
interface CreateWorkflowRequest {
  name: string;
  description: string;
  templateId: string;
  steps: WorkflowStep[];
}

/** Workflows API endpoints */
export const workflowsApi = {
  /** Create a new workflow */
  create: (data: CreateWorkflowRequest) =>
    request<WorkflowDocument>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** List user's workflows (optionally filtered by template) */
  list: (templateId?: string) => {
    const query = templateId ? `?templateId=${templateId}` : '';
    return request<WorkflowDocument[]>(`/workflows${query}`);
  },

  /** Get a single workflow by ID */
  getById: (id: string) => request<WorkflowDocument>(`/workflows/${id}`),

  /** Delete a workflow */
  remove: (id: string) =>
    request<void>(`/workflows/${id}`, { method: 'DELETE' }),
};

/* ── Projects API ────────────────────────────────────────────────── */

/** Create project request body */
interface CreateProjectRequest {
  name: string;
  description: string;
  templateId: string;
}

/** Update project request body */
interface UpdateProjectRequest {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

/** Projects API endpoints */
export const projectsApi = {
  /** Create a new code project from a template */
  create: (data: CreateProjectRequest) =>
    request<CodeProjectDocument>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** List user's projects */
  list: () =>
    request<{ projects: CodeProjectDocument[] }>('/projects'),

  /** Get a single project by ID */
  getById: (id: string) =>
    request<CodeProjectDocument>(`/projects/${id}`),

  /** Update project code */
  update: (id: string, code: UpdateProjectRequest) =>
    request<CodeProjectDocument>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(code),
    }),

  /** Delete a project */
  remove: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),
};

/* ── AI API (SSE streaming) ────────────────────────────────────── */

/**
 * Submit a prompt via SSE streaming.
 * Returns an async generator that yields AiStreamChunks.
 * CLAUDE.md Rule 1: All AI calls go through the backend.
 *
 * @param data - Prompt submission data
 * @yields AiStreamChunk objects
 */
export async function* streamPrompt(
  data: { moduleId: string; prompt: string; context?: string },
): AsyncGenerator<AiStreamChunk> {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/ai/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message, error.code);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError(500, 'No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(trimmed.slice(6)) as AiStreamChunk;
          yield chunk;
        } catch {
          /* Skip malformed SSE data */
        }
      }
    }
  }
}

/* ── AI Assistant SSE Streaming ─────────────────────────────────── */

/** Context for the AI assistant */
export interface AssistantContext {
  /** Current route path */
  currentRoute?: string;
  /** Module ID if on a module page */
  moduleId?: string;
  /** Activity index if viewing an activity */
  activityIndex?: number;
}

/**
 * Send a message to the AI assistant via SSE streaming.
 * Uses the dedicated /ai/assistant endpoint with Socratic system prompt.
 * CLAUDE.md Rule 1: All AI calls go through the backend.
 *
 * @param message - User message text
 * @param context - App context for contextual responses
 * @yields AiStreamChunk objects
 */
export async function* streamAssistant(
  message: string,
  context?: AssistantContext,
): AsyncGenerator<AiStreamChunk> {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/ai/assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ message, context }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message, error.code);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError(500, 'No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(trimmed.slice(6)) as AiStreamChunk;
          yield chunk;
        } catch {
          /* Skip malformed SSE data */
        }
      }
    }
  }
}

/* ── Workflow SSE Streaming ────────────────────────────────────── */

/**
 * Run a workflow via SSE streaming.
 * Returns an async generator that yields WorkflowStreamChunks.
 * CLAUDE.md Rule 1: All AI calls go through the backend.
 *
 * @param workflowId - ID of the workflow to execute
 * @param input - User input text for the workflow
 * @yields WorkflowStreamChunk objects (step_start, step_token, step_done, workflow_done, error)
 */
export async function* streamWorkflow(
  workflowId: string,
  input: string,
): AsyncGenerator<WorkflowStreamChunk> {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message, error.code);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError(500, 'No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(trimmed.slice(6)) as WorkflowStreamChunk;
          yield chunk;
        } catch {
          /* Skip malformed SSE data */
        }
      }
    }
  }
}

/* ── Code Generation SSE Streaming ────────────────────────────── */

/**
 * Generate code via SSE streaming.
 * Returns an async generator that yields CodeStreamChunks.
 * CLAUDE.md Rule 1: All AI calls go through the backend.
 *
 * @param projectId - ID of the project to generate code for
 * @param prompt - User's description of what to change
 * @param targetFile - Which file to modify (html, css, js)
 * @yields CodeStreamChunk objects (code_start, code_token, code_done, error)
 */
export async function* streamCodeGeneration(
  projectId: string,
  prompt: string,
  targetFile: CodeFileType,
): AsyncGenerator<CodeStreamChunk> {
  const token = await getToken();

  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ prompt, targetFile }),
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message, error.code);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError(500, 'No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(trimmed.slice(6)) as CodeStreamChunk;
          yield chunk;
        } catch {
          /* Skip malformed SSE data */
        }
      }
    }
  }
}

/* ── Agents API ─────────────────────────────────────────────────── */

/** Create agent request body */
interface CreateAgentRequest {
  name: string;
  description: string;
  templateId: string;
  persona: AgentPersona;
}

/** Update agent request body */
interface UpdateAgentRequest {
  name?: string;
  description?: string;
  persona?: AgentPersona;
}

/** Agents API endpoints */
export const agentsApi = {
  /** Create a new agent from a template */
  create: (data: CreateAgentRequest) =>
    request<AgentDocument>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** List user's agents */
  list: () =>
    request<{ agents: AgentDocument[] }>('/agents'),

  /** Get a single agent by ID */
  getById: (id: string) =>
    request<AgentDocument>(`/agents/${id}`),

  /** Update agent configuration */
  update: (id: string, data: UpdateAgentRequest) =>
    request<AgentDocument>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Delete an agent */
  remove: (id: string) =>
    request<void>(`/agents/${id}`, { method: 'DELETE' }),
};

/* ── Payments API ──────────────────────────────────────────────── */

/** Checkout session response */
interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/** Portal session response */
interface PortalSessionResponse {
  url: string;
}

/** Payments API endpoints */
export const paymentsApi = {
  /** Create a Stripe Checkout session for plan upgrade */
  createCheckout: (plan: 'explorer' | 'creator') =>
    request<CheckoutSessionResponse>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  /** Create a Stripe Customer Portal session for subscription management */
  createPortal: (returnUrl: string) =>
    request<PortalSessionResponse>('/payments/portal', {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    }),
};

/* ── Classrooms API ────────────────────────────────────────────── */

/** Classrooms API endpoints (teacher dashboard) */
export const classroomsApi = {
  /** Create a new classroom */
  create: (name: string) =>
    request<ClassroomDocument>('/classrooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  /** List teacher's classrooms */
  list: () =>
    request<{ classrooms: ClassroomSummary[] }>('/classrooms'),

  /** Get classroom detail with student progress */
  getDetail: (id: string) =>
    request<ClassroomDetailView>(`/classrooms/${id}`),

  /** Join a classroom by code (child only) */
  joinClassroom: (joinCode: string) =>
    request<ClassroomDocument>('/classrooms/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode }),
    }),

  /** Remove a student from a classroom */
  removeStudent: (classroomId: string, studentId: string) =>
    request<void>(`/classrooms/${classroomId}/students/${studentId}`, {
      method: 'DELETE',
    }),

  /** Delete a classroom */
  deleteClassroom: (id: string) =>
    request<void>(`/classrooms/${id}`, { method: 'DELETE' }),

  /** Regenerate join code for a classroom */
  regenerateCode: (id: string) =>
    request<{ joinCode: string }>(`/classrooms/${id}/regenerate-code`, {
      method: 'POST',
    }),
};

/* ── Notifications API ─────────────────────────────────────────── */

/** Notifications API endpoints (push subscription + preferences) */
export const notificationsApi = {
  /** Register a push subscription */
  register: (data: { endpoint: string; keys: PushSubscriptionKeys; platform: DevicePlatform }) =>
    request<DeviceRegistration>('/notifications/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Unregister a push subscription */
  unregister: (endpoint: string) =>
    request<{ message: string }>('/notifications/unregister', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    }),

  /** Get notification preferences */
  getPreferences: () =>
    request<NotificationPreferences>('/notifications/preferences'),

  /** Update notification preferences */
  updatePreferences: (data: Partial<NotificationPreferences>) =>
    request<NotificationPreferences>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

/* ── Agent Chat SSE Streaming ────────────────────────────────── */

/**
 * Chat with an agent via SSE streaming.
 * Returns an async generator that yields AgentChatChunks.
 * CLAUDE.md Rule 1: All AI calls go through the backend.
 *
 * @param agentId - ID of the agent to chat with
 * @param message - New user message
 * @param history - Previous conversation messages
 * @yields AgentChatChunk objects (message_start, message_token, message_done, error)
 */
export async function* streamAgentChat(
  agentId: string,
  message: string,
  history: AgentMessage[],
): AsyncGenerator<AgentChatChunk> {
  const token = await getToken();

  const response = await fetch(
    `${API_BASE_URL}/agents/${agentId}/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ message, history }),
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message, error.code);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError(500, 'No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(trimmed.slice(6)) as AgentChatChunk;
          yield chunk;
        } catch {
          /* Skip malformed SSE data */
        }
      }
    }
  }
}

export type {
  SignupResponse,
  LoginResponse,
  AddChildResponse,
  ActivityCompletionResponse,
  ModulesListResponse,
  CreateWorkflowRequest,
  UserProfile,
  ChildSummary,
  ModuleSummary,
  ModuleProgress,
  UserGamificationProfile,
  DayActivity,
  Badge,
  XpLevel,
  WorkflowDocument,
  WorkflowStep,
  WorkflowStreamChunk,
  CodeProjectDocument,
  CodeStreamChunk,
  CodeFileType,
  CreateProjectRequest,
  UpdateProjectRequest,
  AgentDocument,
  AgentPersona,
  AgentMessage,
  AgentChatChunk,
  CreateAgentRequest,
  UpdateAgentRequest,
  SubscriptionData,
  CheckoutSessionResponse,
  PortalSessionResponse,
  ClassroomDocument,
  ClassroomSummary,
  ClassroomDetailView,
  StudentProgressSummary,
  DeviceRegistration,
  NotificationPreferences,
  DevicePlatform,
  PushSubscriptionKeys,
};
