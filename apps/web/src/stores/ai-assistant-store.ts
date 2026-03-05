/**
 * Zustand store for the mobile AI assistant overlay.
 * Manages chat state, streaming, and contextual awareness.
 *
 * @module ai-assistant-store
 */

import { create } from 'zustand';
import { streamAssistant } from '../lib/api-client';

/** Chat message in the assistant conversation */
export interface AssistantMessage {
  /** Message sender role */
  role: 'user' | 'assistant';
  /** Message text content */
  content: string;
  /** ISO timestamp */
  timestamp: string;
}

/** Context describing the user's current location in the app */
export interface AssistantContext {
  /** Current route path */
  currentRoute: string;
  /** Module ID if on a module page */
  moduleId?: string;
  /** Activity index if viewing an activity */
  activityIndex?: number;
}

/** AI assistant store state */
interface AiAssistantState {
  /** Whether the overlay is open */
  isOpen: boolean;
  /** Conversation messages */
  messages: AssistantMessage[];
  /** Whether the AI is currently streaming a response */
  isStreaming: boolean;
  /** Current app context for contextual suggestions */
  context: AssistantContext;
  /** Open the assistant overlay */
  open: () => void;
  /** Close the assistant overlay */
  close: () => void;
  /** Toggle the assistant overlay */
  toggle: () => void;
  /** Send a message and stream the AI response */
  sendMessage: (text: string) => Promise<void>;
  /** Clear all messages */
  clearMessages: () => void;
  /** Update the app context */
  setContext: (ctx: Partial<AssistantContext>) => void;
  /** Reset the store */
  reset: () => void;
}

/** Initial state values */
const initialState = {
  isOpen: false,
  messages: [] as AssistantMessage[],
  isStreaming: false,
  context: { currentRoute: '/m' } as AssistantContext,
};

/**
 * AI Assistant store — manages the floating assistant chat state.
 * Uses streamAssistant with Socratic system prompt via POST /ai/assistant.
 */
export const useAiAssistantStore = create<AiAssistantState>((set, get) => ({
  ...initialState,

  open: () => set({ isOpen: true }),

  close: () => set({ isOpen: false }),

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || get().isStreaming) return;

    const userMessage: AssistantMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: AssistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMessage, assistantMessage],
      isStreaming: true,
    }));

    try {
      const { context } = get();

      const stream = streamAssistant(trimmed, {
        currentRoute: context.currentRoute,
        moduleId: context.moduleId,
        activityIndex: context.activityIndex,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.content) {
          set((s) => {
            const updated = [...s.messages];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk.content,
              };
            }
            return { messages: updated };
          });
        }
        if (chunk.type === 'error') {
          set((s) => {
            const updated = [...s.messages];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                content: chunk.message ?? 'Something went wrong.',
              };
            }
            return { messages: updated };
          });
        }
      }
    } catch {
      set((s) => {
        const updated = [...s.messages];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            content: 'Something went wrong. Please try again.',
          };
        }
        return { messages: updated };
      });
    } finally {
      set({ isStreaming: false });
    }
  },

  clearMessages: () => set({ messages: [] }),

  setContext: (ctx) =>
    set((s) => ({ context: { ...s.context, ...ctx } })),

  reset: () => set(initialState),
}));
