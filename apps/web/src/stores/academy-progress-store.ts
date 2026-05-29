'use client';

import { create } from 'zustand';
import { academyProgressApi } from '@/lib/api-client';

/**
 * Persistent academy progress (P3-18). State mirrors the server's
 * `academyProgress/{userId}` doc and is hydrated on auth via the
 * `(learner)/layout.tsx` hook.
 */
interface AcademyProgressState {
  completedLessonIds: string[];
  watchedVideoIds: string[];
  /** True after the first hydrate() resolves. */
  hasHydrated: boolean;
  /** Mark a lesson as completed (idempotent). Writes through to backend. */
  completeLesson: (lessonId: string) => Promise<void>;
  /** Mark a video as watched (idempotent). Writes through to backend. */
  watchVideo: (videoId: string) => Promise<void>;
  /** Hydrate from backend on auth. */
  hydrate: () => Promise<void>;
  /** Clear both lists — called on logout. */
  reset: () => void;
}

export const useAcademyProgressStore = create<AcademyProgressState>((set, get) => ({
  completedLessonIds: [],
  watchedVideoIds: [],
  hasHydrated: false,

  hydrate: async () => {
    try {
      const data = await academyProgressApi.getMine();
      set({
        completedLessonIds: data.completedLessonIds,
        watchedVideoIds: data.watchedVideoIds,
        hasHydrated: true,
      });
    } catch {
      // Network/offline: stay empty but mark hydrated so the UI doesn't
      // get stuck on a loading state.
      set({ hasHydrated: true });
    }
  },

  completeLesson: async (lessonId) => {
    if (get().completedLessonIds.includes(lessonId)) return;
    // Optimistic-local + server write-through.
    const previous = get().completedLessonIds;
    set({ completedLessonIds: [...previous, lessonId] });
    try {
      const updated = await academyProgressApi.completeLesson(lessonId);
      set({ completedLessonIds: updated.completedLessonIds });
    } catch {
      // Roll back on failure.
      set({ completedLessonIds: previous });
    }
  },

  watchVideo: async (videoId) => {
    if (get().watchedVideoIds.includes(videoId)) return;
    const previous = get().watchedVideoIds;
    set({ watchedVideoIds: [...previous, videoId] });
    try {
      const updated = await academyProgressApi.watchVideo(videoId);
      set({ watchedVideoIds: updated.watchedVideoIds });
    } catch {
      set({ watchedVideoIds: previous });
    }
  },

  reset: () => set({ completedLessonIds: [], watchedVideoIds: [], hasHydrated: false }),
}));
