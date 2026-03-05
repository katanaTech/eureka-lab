/**
 * Zustand store for buddy agent state.
 * Manages user agents, persona editing, and AI chat streaming.
 *
 * @module agent-store
 */

import { create } from 'zustand';
import type {
  AgentDocument,
  AgentPersona,
  AgentMessage,
  AgentChatChunk,
} from '@eureka-lab/shared-types';
import { agentsApi, streamAgentChat } from '../lib/api-client';

/** Maximum messages kept in chat history */
const MAX_HISTORY = 20;

/** Agent store state */
interface AgentState {
  /** All user agents */
  agents: AgentDocument[];
  /** Currently selected agent */
  currentAgent: AgentDocument | null;
  /** Whether an AI chat response is streaming */
  isChatting: boolean;
  /** Current streaming response text (partial) */
  streamingText: string;
  /** Chat history for the current agent session (frontend only, not persisted) */
  chatHistory: AgentMessage[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether the agent is being saved */
  isSaving: boolean;
  /** Error from the last operation */
  error: string | null;
  /** Fetch all user agents from the backend */
  loadAgents: () => Promise<void>;
  /** Set the current agent */
  setCurrentAgent: (agent: AgentDocument | null) => void;
  /** Create a new agent from a template */
  createAgent: (
    name: string,
    description: string,
    templateId: string,
    persona: AgentPersona,
  ) => Promise<AgentDocument | null>;
  /** Update an agent's configuration */
  updateAgent: (
    data: { name?: string; description?: string; persona?: AgentPersona },
  ) => Promise<AgentDocument | null>;
  /** Send a message to the current agent (SSE streaming) */
  sendMessage: (message: string) => Promise<void>;
  /** Clear chat history */
  clearChat: () => void;
  /** Reset the entire store */
  reset: () => void;
}

/** Initial state values */
const initialState = {
  agents: [] as AgentDocument[],
  currentAgent: null as AgentDocument | null,
  isChatting: false,
  streamingText: '',
  chatHistory: [] as AgentMessage[],
  isLoading: false,
  isSaving: false,
  error: null as string | null,
};

/**
 * Agent store — tracks buddy agents, persona editing, and chat sessions.
 * Call loadAgents() after auth to initialize.
 * Chat history is kept in-memory only (max 20 messages, not persisted).
 */
export const useAgentStore = create<AgentState>((set, get) => ({
  ...initialState,

  loadAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await agentsApi.list();
      set({ agents: response.agents, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load agents';
      set({ isLoading: false, error: message });
    }
  },

  setCurrentAgent: (agent: AgentDocument | null) => {
    set({
      currentAgent: agent,
      chatHistory: [],
      streamingText: '',
      error: null,
    });
  },

  createAgent: async (
    name: string,
    description: string,
    templateId: string,
    persona: AgentPersona,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const agent = await agentsApi.create({
        name,
        description,
        templateId,
        persona,
      });
      set((state) => ({
        agents: [agent, ...state.agents],
        currentAgent: agent,
        chatHistory: [],
        isLoading: false,
      }));
      return agent;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create agent';
      set({ isLoading: false, error: message });
      return null;
    }
  },

  updateAgent: async (data) => {
    const { currentAgent } = get();
    if (!currentAgent) return null;

    set({ isSaving: true, error: null });
    try {
      const updated = await agentsApi.update(currentAgent.id, data);
      set((state) => ({
        currentAgent: updated,
        agents: state.agents.map((a) =>
          a.id === updated.id ? updated : a,
        ),
        isSaving: false,
      }));
      return updated;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update agent';
      set({ isSaving: false, error: message });
      return null;
    }
  },

  sendMessage: async (message: string) => {
    const { currentAgent, chatHistory } = get();
    if (!currentAgent) return;

    /* Add user message to history */
    const userMsg: AgentMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [...chatHistory, userMsg];

    /* Trim history to max length */
    const trimmedHistory =
      updatedHistory.length > MAX_HISTORY
        ? updatedHistory.slice(updatedHistory.length - MAX_HISTORY)
        : updatedHistory;

    set({
      chatHistory: trimmedHistory,
      isChatting: true,
      streamingText: '',
      error: null,
    });

    try {
      /* Build history for the API (strip timestamps) */
      const apiHistory = trimmedHistory.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      const stream = streamAgentChat(
        currentAgent.id,
        message,
        apiHistory.slice(0, -1), /* exclude the message we're sending (it goes in the 'message' field) */
      );

      let fullResponse = '';

      for await (const chunk of stream) {
        processAgentChatChunk(chunk, set, get, fullResponse);
        if (chunk.type === 'message_token' && chunk.content) {
          fullResponse += chunk.content;
        }
        if (chunk.type === 'message_done' && chunk.fullMessage) {
          fullResponse = chunk.fullMessage;
        }
      }

      /* If we accumulated a response, add assistant message */
      if (fullResponse) {
        const assistantMsg: AgentMessage = {
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString(),
        };
        set((state) => {
          const newHistory = [...state.chatHistory, assistantMsg];
          return {
            chatHistory:
              newHistory.length > MAX_HISTORY
                ? newHistory.slice(newHistory.length - MAX_HISTORY)
                : newHistory,
            isChatting: false,
            streamingText: '',
          };
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Chat failed';
      set({ isChatting: false, streamingText: '', error: message });
    }
  },

  clearChat: () => {
    set({ chatHistory: [], streamingText: '', error: null });
  },

  reset: () => set(initialState),
}));

/**
 * Process a single SSE chunk during agent chat.
 * Updates the store state based on chunk type.
 *
 * @param chunk - The SSE chunk to process
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param accumulated - Accumulated response text so far
 */
function processAgentChatChunk(
  chunk: AgentChatChunk,
  set: (
    partial:
      | Partial<AgentState>
      | ((s: AgentState) => Partial<AgentState>),
  ) => void,
  _get: () => AgentState,
  accumulated: string,
): void {
  switch (chunk.type) {
    case 'message_start':
      set({ streamingText: '' });
      break;

    case 'message_token':
      set({
        streamingText: accumulated + (chunk.content ?? ''),
      });
      break;

    case 'message_done':
      /* Final message — handled by sendMessage() after the loop */
      break;

    case 'error':
      set({
        error: chunk.message ?? 'Agent chat failed',
        isChatting: false,
        streamingText: '',
      });
      break;
  }
}
