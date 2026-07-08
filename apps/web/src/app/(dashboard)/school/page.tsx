'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { RoleGate } from '@/components/auth/RoleGate';
import { useAuth } from '@/hooks/useAuth';
import { GameButton } from '@eureka-lab/ui';
import { TeachersTable } from '@/components/features/school/TeachersTable';
import { CreateTeacherDialog } from '@/components/features/school/CreateTeacherDialog';
import { StudentsPanel } from '@/components/features/school/StudentsPanel';
import { ClassroomsPanel } from '@/components/features/school/ClassroomsPanel';
import { BillingStatusCard } from '@/components/features/school/BillingStatusCard';
import { schoolsApi } from '@/lib/api-client';
import type { SchoolTeacherSummary } from '@eureka-lab/shared-types';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/** School-admin console (teachers + students), gated to school_admin via RoleGate. */
function SchoolAdminInner() {
  const t = useTranslations('SchoolAdmin');
  const ts = useTranslations('SchoolStudents');
  const tc = useTranslations('SchoolClassrooms');
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  const [tab, setTab] = useState<'teachers' | 'students' | 'classrooms'>('teachers');
  const [teachers, setTeachers] = useState<SchoolTeacherSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await schoolsApi.listTeachers(schoolId);
      setTeachers(res.teachers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, t]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleCreate = async (values: { email: string; displayName: string; password: string }) => {
    if (!schoolId) return;
    await schoolsApi.createTeacher(schoolId, values);
    await fetchTeachers();
  };

  const handleToggle = async (teacher: SchoolTeacherSummary) => {
    if (!schoolId) return;
    const confirmMsg = teacher.active ? t('deactivateConfirm') : t('reactivateConfirm');
    if (!window.confirm(confirmMsg)) return;
    setBusyUid(teacher.uid);
    setError('');
    try {
      await schoolsApi.setTeacherActive(schoolId, teacher.uid, !teacher.active);
      await fetchTeachers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setBusyUid(null);
    }
  };

  if (!schoolId) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{t('noSchool')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <BillingStatusCard />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl text-glow-primary">{tab === 'teachers' ? t('title') : tab === 'students' ? ts('title') : tc('title')}</h1>
        {tab === 'teachers' && (
          <GameButton variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('addTeacher')}
          </GameButton>
        )}
      </div>

      <div role="tablist" aria-label={ts('tabsLabel')} className="flex gap-2 border-b border-border">
        <button
          role="tab"
          id="tab-teachers"
          aria-selected={tab === 'teachers'}
          aria-controls="panel-teachers"
          onClick={() => setTab('teachers')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'teachers' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
        >
          {ts('teachersTab')}
        </button>
        <button
          role="tab"
          id="tab-students"
          aria-selected={tab === 'students'}
          aria-controls="panel-students"
          onClick={() => setTab('students')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'students' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
        >
          {ts('tab')}
        </button>
        <button
          role="tab"
          id="tab-classrooms"
          aria-selected={tab === 'classrooms'}
          aria-controls="panel-classrooms"
          onClick={() => setTab('classrooms')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'classrooms' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
        >
          {tc('tab')}
        </button>
      </div>

      {tab === 'teachers' && (
        <div role="tabpanel" id="panel-teachers" aria-labelledby="tab-teachers" className="space-y-6">
          {error && <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>
          ) : teachers.length === 0 ? (
            <div className="panel p-8 text-center"><p className="text-muted-foreground">{t('noTeachers')}</p></div>
          ) : (
            <TeachersTable teachers={teachers} busyUid={busyUid} onToggle={handleToggle} />
          )}

          <CreateTeacherDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />
        </div>
      )}

      {tab === 'students' && (
        <div role="tabpanel" id="panel-students" aria-labelledby="tab-students">
          <StudentsPanel schoolId={schoolId} />
        </div>
      )}

      {tab === 'classrooms' && (
        <div role="tabpanel" id="panel-classrooms" aria-labelledby="tab-classrooms">
          <ClassroomsPanel schoolId={schoolId} />
        </div>
      )}
    </div>
  );
}

/** Page wrapper applying the school_admin role gate. */
export default function SchoolAdminPage() {
  return (
    <RoleGate allow={['school_admin']}>
      <SchoolAdminInner />
    </RoleGate>
  );
}
