'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameButton } from '@/components/game/GameButton';
import { JoinCodeDisplay } from '@/components/features/teacher/JoinCodeDisplay';
import { StudentProgressTable } from '@/components/features/teacher/StudentProgressTable';
import { classroomsApi } from '@/lib/api-client';
import type { ClassroomDetailView } from '@/lib/api-client';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Classroom detail page — join code, student progress, danger-zone delete.
 * Re-skinned for the fantasy chrome. Nested JoinCodeDisplay and
 * StudentProgressTable keep their current styling (Plan 3c polish).
 */
export default function ClassroomDetailPage() {
  const t = useTranslations('Teacher');
  const router = useRouter();
  const params = useParams<{ classroomId: string }>();
  const classroomId = params.classroomId;

  const [detail, setDetail] = useState<ClassroomDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /** Fetch classroom detail with student progress. */
  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await classroomsApi.getDetail(classroomId);
      setDetail(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load classroom';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /** Regenerate the classroom join code. */
  const handleRegenerateCode = async () => {
    if (!window.confirm(t('regenerateCodeConfirm'))) return;

    try {
      setRegenerating(true);
      const { joinCode } = await classroomsApi.regenerateCode(classroomId);
      setDetail((prev) =>
        prev ? { ...prev, classroom: { ...prev.classroom, joinCode } } : prev,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to regenerate code';
      setError(message);
    } finally {
      setRegenerating(false);
    }
  };

  /**
   * Remove a student from the classroom.
   * @param studentId - UID of the student to remove
   */
  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm(t('removeStudentConfirm'))) return;

    try {
      await classroomsApi.removeStudent(classroomId, studentId);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              students: prev.students.filter((s) => s.uid !== studentId),
              classroom: {
                ...prev.classroom,
                studentIds: prev.classroom.studentIds.filter((id) => id !== studentId),
              },
            }
          : prev,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to remove student';
      setError(message);
    }
  };

  /** Delete the entire classroom and navigate back. */
  const handleDeleteClassroom = async () => {
    if (!window.confirm(t('deleteClassroomConfirm'))) return;

    try {
      setDeleting(true);
      await classroomsApi.deleteClassroom(classroomId);
      router.push('/teacher');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete classroom';
      setError(message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/teacher')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToDashboard')}
        </Button>
        <div
          className="panel border-destructive/60 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with back button — keep shadcn icon button (tertiary per recipe) */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/teacher')}
          aria-label={t('backToDashboard')}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <h1 className="font-display text-3xl text-glow-primary">
          {detail.classroom.name}
        </h1>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="panel border-destructive/60 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Join code section */}
      <div className="panel flex flex-wrap items-center gap-4 p-4">
        <div className="flex-1">
          <p className="mb-2 text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            {t('joinCode')}
          </p>
          <JoinCodeDisplay code={detail.classroom.joinCode} />
        </div>
        <GameButton
          variant="ghost"
          size="sm"
          onClick={handleRegenerateCode}
          disabled={regenerating}
        >
          <RefreshCw
            className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {t('regenerateCode')}
        </GameButton>
      </div>

      {/* Student count */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">
          {t('studentCount')}: {detail.students.length}/{detail.classroom.maxStudents}
        </h2>
      </div>

      {/* Student progress table — nested component, keeps current styling */}
      <StudentProgressTable
        students={detail.students}
        onRemoveStudent={handleRemoveStudent}
      />

      {/* Danger zone */}
      <div className="panel border-destructive/60 p-4">
        <h3 className="mb-3 text-[10px] tracking-[0.3em] uppercase text-destructive">
          {t('dangerZone')}
        </h3>
        <GameButton
          variant="danger"
          size="sm"
          onClick={handleDeleteClassroom}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('deleteClassroom')}
        </GameButton>
      </div>
    </div>
  );
}
