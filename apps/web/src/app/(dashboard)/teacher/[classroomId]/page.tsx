'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JoinCodeDisplay } from '@/components/features/teacher/JoinCodeDisplay';
import { StudentProgressTable } from '@/components/features/teacher/StudentProgressTable';
import { classroomsApi } from '@/lib/api-client';
import type { ClassroomDetailView } from '@/lib/api-client';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Classroom detail page — shows join code, student progress table,
 * and management actions (regenerate code, remove students, delete).
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

  /**
   * Fetch classroom detail with student progress.
   */
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

  /**
   * Regenerate the classroom join code.
   */
  const handleRegenerateCode = async () => {
    if (!window.confirm(t('regenerateCodeConfirm'))) return;

    try {
      setRegenerating(true);
      const { joinCode } = await classroomsApi.regenerateCode(classroomId);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              classroom: { ...prev.classroom, joinCode },
            }
          : prev,
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
                studentIds: prev.classroom.studentIds.filter(
                  (id) => id !== studentId,
                ),
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

  /**
   * Delete the entire classroom and navigate back.
   */
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
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/teacher')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToDashboard')}
        </Button>
        <div
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/teacher')}
          aria-label={t('backToDashboard')}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {detail.classroom.name}
        </h1>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Join code section */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-4">
        <div className="flex-1">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t('joinCode')}
          </p>
          <JoinCodeDisplay code={detail.classroom.joinCode} />
        </div>
        <Button
          variant="outline"
          onClick={handleRegenerateCode}
          disabled={regenerating}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {t('regenerateCode')}
        </Button>
      </div>

      {/* Student count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t('studentCount')}: {detail.students.length}/
          {detail.classroom.maxStudents}
        </h2>
      </div>

      {/* Student progress table */}
      <StudentProgressTable
        students={detail.students}
        onRemoveStudent={handleRemoveStudent}
      />

      {/* Danger zone — delete classroom */}
      <div className="rounded-lg border border-red-200 p-4 dark:border-red-900">
        <h3 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">
          {t('dangerZone')}
        </h3>
        <Button
          variant="destructive"
          onClick={handleDeleteClassroom}
          disabled={deleting}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('deleteClassroom')}
        </Button>
      </div>
    </div>
  );
}
