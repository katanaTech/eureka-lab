'use client';

import { useState, useEffect, useCallback, type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { GameButton } from '@eureka-lab/ui';
import { StudentsTable } from './StudentsTable';
import { AddStudentDialog } from './AddStudentDialog';
import { schoolsApi } from '@/lib/api-client';
import type { SchoolStudentSummary } from '@eureka-lab/shared-types';

interface StudentsPanelProps {
  schoolId: string;
}

/** Students management panel for the /school console. */
export const StudentsPanel: FC<StudentsPanelProps> = ({ schoolId }) => {
  const t = useTranslations('SchoolStudents');
  const [students, setStudents] = useState<SchoolStudentSummary[]>([]);
  const [loginCode, setLoginCode] = useState('');
  const [seats, setSeats] = useState<{ used: number; limit: number }>({ used: 0, limit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await schoolsApi.listStudents(schoolId);
      setStudents(res.students);
      setLoginCode(res.loginCode);
      setSeats({ used: res.seatsUsed, limit: res.seatLimit });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, t]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handleCreate = async (values: { displayName: string; username: string; password: string; birthYear: number; consentAttested: boolean }) => {
    await schoolsApi.createStudent(schoolId, values);
    await fetchRoster();
  };

  const handleToggle = async (student: SchoolStudentSummary) => {
    const confirmMsg = student.active ? t('deactivateConfirm') : t('reactivateConfirm');
    if (!window.confirm(confirmMsg)) return;
    setBusyUid(student.uid);
    setError('');
    try {
      await schoolsApi.setStudentActive(schoolId, student.uid, !student.active);
      await fetchRoster();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {loginCode && <span>{t('schoolCode')}: <span className="font-mono text-foreground">{loginCode}</span></span>}
          <span>{t('seats')}: <span className="text-foreground">{seats.used} / {seats.limit}</span></span>
        </div>
        <GameButton variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('addStudent')}
        </GameButton>
      </div>

      {error && <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>
      ) : students.length === 0 ? (
        <div className="panel p-8 text-center"><p className="text-muted-foreground">{t('noStudents')}</p></div>
      ) : (
        <StudentsTable students={students} busyUid={busyUid} onToggle={handleToggle} />
      )}

      <AddStudentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />
    </div>
  );
};
