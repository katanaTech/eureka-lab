'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClassroomCard } from '@/components/features/teacher/ClassroomCard';
import { CreateClassroomDialog } from '@/components/features/teacher/CreateClassroomDialog';
import { classroomsApi } from '@/lib/api-client';
import type { ClassroomSummary } from '@/lib/api-client';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Teacher dashboard — lists all classrooms with create button.
 * Teachers can click into a classroom to see student progress.
 */
export default function TeacherDashboardPage() {
  const t = useTranslations('Teacher');
  const router = useRouter();

  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  /**
   * Fetch all classrooms for the authenticated teacher.
   */
  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await classroomsApi.list();
      setClassrooms(response.classrooms);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load classrooms';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  /**
   * Handle new classroom creation.
   * @param name - Classroom name
   */
  const handleCreate = async (name: string) => {
    await classroomsApi.create(name);
    await fetchClassrooms();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboardTitle')}
        </h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('createClassroom')}
        </Button>
      </div>

      {error && (
        <div
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">{t('noClassrooms')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              onClick={() => router.push(`/teacher/${classroom.id}`)}
            />
          ))}
        </div>
      )}

      <CreateClassroomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
