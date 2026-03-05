/**
 * Zustand store for code project state.
 * Manages user projects, code editing, and AI code generation.
 *
 * @module project-store
 */

import { create } from 'zustand';
import type {
  CodeProjectDocument,
  CodeStreamChunk,
  CodeFileType,
} from '@eureka-lab/shared-types';
import { projectsApi, streamCodeGeneration } from '../lib/api-client';

/** Project store state */
interface ProjectState {
  /** All user projects */
  projects: CodeProjectDocument[];
  /** Currently selected/editing project */
  currentProject: CodeProjectDocument | null;
  /** Whether AI code generation is in progress */
  isGenerating: boolean;
  /** Accumulated generated code from the current stream */
  generatedCode: string;
  /** Target file being generated */
  generatingFile: CodeFileType | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether the project is being saved */
  isSaving: boolean;
  /** Error from the last operation */
  error: string | null;
  /** Fetch all user projects from the backend */
  loadProjects: () => Promise<void>;
  /** Set the current project */
  setCurrentProject: (project: CodeProjectDocument | null) => void;
  /** Create a new project from a template */
  createProject: (name: string, description: string, templateId: string) => Promise<CodeProjectDocument | null>;
  /** Generate code via AI SSE streaming */
  generateCode: (prompt: string, targetFile: CodeFileType) => Promise<string | null>;
  /** Save project code to the backend */
  saveCode: (htmlCode: string, cssCode: string, jsCode: string) => Promise<void>;
  /** Update the current project's local code (for editor state) */
  updateLocalCode: (file: CodeFileType, code: string) => void;
  /** Reset the entire store */
  reset: () => void;
}

/** Initial state values */
const initialState = {
  projects: [] as CodeProjectDocument[],
  currentProject: null as CodeProjectDocument | null,
  isGenerating: false,
  generatedCode: '',
  generatingFile: null as CodeFileType | null,
  isLoading: false,
  isSaving: false,
  error: null as string | null,
};

/**
 * Project store — tracks code projects, editor state, and AI generation.
 * Call loadProjects() after auth to initialize.
 */
export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectsApi.list();
      set({ projects: response.projects, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      set({ isLoading: false, error: message });
    }
  },

  setCurrentProject: (project: CodeProjectDocument | null) => {
    set({ currentProject: project, generatedCode: '', generatingFile: null, error: null });
  },

  createProject: async (name: string, description: string, templateId: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectsApi.create({ name, description, templateId });
      set((state) => ({
        projects: [project, ...state.projects],
        currentProject: project,
        isLoading: false,
      }));
      return project;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      set({ isLoading: false, error: message });
      return null;
    }
  },

  generateCode: async (prompt: string, targetFile: CodeFileType) => {
    const { currentProject } = get();
    if (!currentProject) return null;

    set({ isGenerating: true, generatedCode: '', generatingFile: targetFile, error: null });

    try {
      const stream = streamCodeGeneration(currentProject.id, prompt, targetFile);

      for await (const chunk of stream) {
        processCodeChunk(chunk, set, get);
      }

      const code = get().generatedCode;
      set({ isGenerating: false });
      return code;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Code generation failed';
      set({ isGenerating: false, error: message });
      return null;
    }
  },

  saveCode: async (htmlCode: string, cssCode: string, jsCode: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isSaving: true, error: null });
    try {
      const updated = await projectsApi.update(currentProject.id, {
        htmlCode,
        cssCode,
        jsCode,
      });
      set((state) => ({
        currentProject: updated,
        projects: state.projects.map((p) =>
          p.id === updated.id ? updated : p,
        ),
        isSaving: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save project';
      set({ isSaving: false, error: message });
    }
  },

  updateLocalCode: (file: CodeFileType, code: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const key = file === 'html' ? 'htmlCode' : file === 'css' ? 'cssCode' : 'jsCode';
    set({
      currentProject: { ...currentProject, [key]: code },
    });
  },

  reset: () => set(initialState),
}));

/**
 * Process a single SSE chunk during code generation.
 * Updates the store state based on chunk type.
 *
 * @param chunk - The SSE chunk to process
 * @param set - Zustand set function
 * @param get - Zustand get function
 */
function processCodeChunk(
  chunk: CodeStreamChunk,
  set: (partial: Partial<ProjectState> | ((s: ProjectState) => Partial<ProjectState>)) => void,
  get: () => ProjectState,
): void {
  switch (chunk.type) {
    case 'code_start':
      set({ generatedCode: '', generatingFile: chunk.language ?? null });
      break;

    case 'code_token':
      set({ generatedCode: get().generatedCode + (chunk.content ?? '') });
      break;

    case 'code_done':
      set({
        generatedCode: chunk.fullCode ?? get().generatedCode,
        isGenerating: false,
      });
      break;

    case 'error':
      set({
        error: chunk.message ?? 'Code generation failed',
        isGenerating: false,
      });
      break;
  }
}
