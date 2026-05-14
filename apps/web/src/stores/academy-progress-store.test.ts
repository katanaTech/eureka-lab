import { describe, it, expect, beforeEach } from 'vitest';
import { useAcademyProgressStore } from './academy-progress-store';

describe('academy-progress-store', () => {
  beforeEach(() => useAcademyProgressStore.getState().reset());

  it('starts with empty arrays', () => {
    expect(useAcademyProgressStore.getState().completedLessonIds).toEqual([]);
    expect(useAcademyProgressStore.getState().watchedVideoIds).toEqual([]);
  });

  it('completeLesson adds id to the list (idempotent)', () => {
    useAcademyProgressStore.getState().completeLesson('lesson-prompts-1');
    useAcademyProgressStore.getState().completeLesson('lesson-prompts-1');
    expect(useAcademyProgressStore.getState().completedLessonIds).toEqual(['lesson-prompts-1']);
  });

  it('watchVideo adds id to the list (idempotent)', () => {
    useAcademyProgressStore.getState().watchVideo('vid-prompts-1');
    useAcademyProgressStore.getState().watchVideo('vid-prompts-1');
    expect(useAcademyProgressStore.getState().watchedVideoIds).toEqual(['vid-prompts-1']);
  });

  it('reset clears both lists', () => {
    useAcademyProgressStore.getState().completeLesson('a');
    useAcademyProgressStore.getState().watchVideo('b');
    useAcademyProgressStore.getState().reset();
    expect(useAcademyProgressStore.getState().completedLessonIds).toEqual([]);
    expect(useAcademyProgressStore.getState().watchedVideoIds).toEqual([]);
  });
});
