'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { GameButton } from '@/components/game/GameButton';
import { ClassroomCard } from '@/components/features/teacher/ClassroomCard';
import { CreateClassroomDialog } from '@/components/features/teacher/CreateClassroomDialog';
import { classroomsApi } from '@/lib/api-client';
import type { ClassroomSummary } from '@/lib/api-client';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Teacher dashboard — classrooms list + create.
 * Re-skinned for the fantasy chrome. ClassroomCard / CreateClassroomDialog
 * keep their current styling (Plan 3c polish).
 */
export default function TeacherDashboardPage() {
  const t = useTranslations('Teacher');
  const router = useRouter();

  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  /** Fetch all classrooms for the authenticated teacher. */
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl text-glow-primary">
          {t('dashboardTitle')}
        </h1>
        <GameButton variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('createClassroom')}
        </GameButton>
      </div>

      {error && (
        <div
          className="panel border-destructive/60 p-4 text-sm text-destructive"
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
        <div className="panel p-8 text-center">
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
