/**
 * Zustand store for workflow state.
 * Manages user workflows, current workflow, execution state, and step outputs.
 *
 * @module workflow-store
 */

import { create } from 'zustand';
import type {
  WorkflowDocument,
  WorkflowStreamChunk,
} from '@eureka-lab/shared-types';
import { workflowsApi, streamWorkflow } from '../lib/api-client';

/** Workflow store state */
interface WorkflowState {
  /** All user workflows */
  workflows: WorkflowDocument[];
  /** Currently selected/viewing workflow */
  currentWorkflow: WorkflowDocument | null;
  /** Whether a workflow is currently executing */
  isRunning: boolean;
  /** Step outputs collected during execution (indexed by step index) */
  stepOutputs: Record<number, string>;
  /** Currently streaming step index */
  activeStepIndex: number;
  /** Token buffer for the currently streaming step */
  activeStepTokens: string;
  /** Error from the last operation */
  error: string | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Fetch all user workflows from the backend */
  loadWorkflows: (templateId?: string) => Promise<void>;
  /** Set the current workflow */
  setCurrentWorkflow: (workflow: WorkflowDocument | null) => void;
  /** Run a workflow via SSE streaming */
  runWorkflow: (workflowId: string, input: string) => Promise<void>;
  /** Clear step outputs (for re-running) */
  clearOutputs: () => void;
  /** Reset the entire store (on logout) */
  reset: () => void;
}

/** Initial state values */
const initialState = {
  workflows: [] as WorkflowDocument[],
  currentWorkflow: null as WorkflowDocument | null,
  isRunning: false,
  stepOutputs: {} as Record<number, string>,
  activeStepIndex: -1,
  activeStepTokens: '',
  error: null as string | null,
  isLoading: false,
};

/**
 * Workflow store — tracks user workflows, execution state, and outputs.
 * Call loadWorkflows() after auth to initialize.
 */
export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...initialState,

  loadWorkflows: async (templateId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const workflows = await workflowsApi.list(templateId);
      set({ workflows, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load workflows';
      set({ isLoading: false, error: message });
    }
  },

  setCurrentWorkflow: (workflow: WorkflowDocument | null) => {
    set({ currentWorkflow: workflow });
  },

  runWorkflow: async (workflowId: string, input: string) => {
    set({
      isRunning: true,
      stepOutputs: {},
      activeStepIndex: -1,
      activeStepTokens: '',
      error: null,
    });

    try {
      const stream = streamWorkflow(workflowId, input);

      for await (const chunk of stream) {
        processChunk(chunk, set, get);
      }

      set({ isRunning: false, activeStepIndex: -1 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Workflow execution failed';
      set({ isRunning: false, error: message, activeStepIndex: -1 });
    }
  },

  clearOutputs: () => {
    set({ stepOutputs: {}, activeStepIndex: -1, activeStepTokens: '', error: null });
  },

  reset: () => set(initialState),
}));

/**
 * Process a single SSE chunk during workflow execution.
 * Updates the store state based on chunk type.
 *
 * @param chunk - The SSE chunk to process
 * @param set - Zustand set function
 * @param get - Zustand get function
 */
function processChunk(
  chunk: WorkflowStreamChunk,
  set: (partial: Partial<WorkflowState>) => void,
  get: () => WorkflowState,
): void {
  switch (chunk.type) {
    case 'step_start':
      set({
        activeStepIndex: chunk.stepIndex ?? -1,
        activeStepTokens: '',
      });
      break;

    case 'step_token':
      set({
        activeStepTokens: get().activeStepTokens + (chunk.content ?? ''),
      });
      break;

    case 'step_done': {
      const stepIndex = chunk.stepIndex ?? get().activeStepIndex;
      const output = chunk.stepOutput ?? get().activeStepTokens;
      set({
        stepOutputs: { ...get().stepOutputs, [stepIndex]: output },
        activeStepTokens: '',
      });
      break;
    }

    case 'workflow_done':
      /* Final outputs are already captured step-by-step */
      set({ isRunning: false, activeStepIndex: -1 });
      break;

    case 'error':
      set({
        error: chunk.message ?? 'Workflow step failed',
        isRunning: false,
        activeStepIndex: -1,
      });
      break;
  }
}
