'use client';

import { create } from 'zustand';

/**
 * In-memory academy progress: which lessons the user has completed and which
 * mock videos they've watched in this session. NOT persisted — page reload
 * resets to empty. Backend persistence is a Plan 3 deliverable.
 */
interface AcademyProgressState {
  completedLessonIds: string[];
  watchedVideoIds: string[];
  /** Mark a lesson as completed (idempotent). */
  completeLesson: (lessonId: string) => void;
  /** Mark a video as watched (idempotent). */
  watchVideo: (videoId: string) => void;
  /** Clear both lists — typically called on logout. */
  reset: () => void;
}

export const useAcademyProgressStore = create<AcademyProgressState>((set, get) => ({
  completedLessonIds: [],
  watchedVideoIds: [],
  completeLesson: (lessonId) => {
    if (get().completedLessonIds.includes(lessonId)) return;
    set({ completedLessonIds: [...get().completedLessonIds, lessonId] });
  },
  watchVideo: (videoId) => {
    if (get().watchedVideoIds.includes(videoId)) return;
    set({ watchedVideoIds: [...get().watchedVideoIds, videoId] });
  },
  reset: () => set({ completedLessonIds: [], watchedVideoIds: [] }),
}));
