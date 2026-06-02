'use client';

import { useState, useEffect, useCallback, type FC } from 'react';
import { useTranslations } from 'next-intl';
import { ClassroomsTable } from './ClassroomsTable';
import { schoolsApi } from '@/lib/api-client';
import type { SchoolClassroomSummary } from '@eureka-lab/shared-types';

interface ClassroomsPanelProps {
  schoolId: string;
}

/** Read-only classrooms rollup panel for the /school console. */
export const ClassroomsPanel: FC<ClassroomsPanelProps> = ({ schoolId }) => {
  const t = useTranslations('SchoolClassrooms');
  const [classrooms, setClassrooms] = useState<SchoolClassroomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await schoolsApi.listClassrooms(schoolId);
      setClassrooms(res.classrooms);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, t]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return (
    <div className="space-y-6">
      {error && <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>}
      {loading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>
      ) : classrooms.length === 0 ? (
        <div className="panel p-8 text-center"><p className="text-muted-foreground">{t('noClassrooms')}</p></div>
      ) : (
        <ClassroomsTable classrooms={classrooms} />
      )}
    </div>
  );
};
