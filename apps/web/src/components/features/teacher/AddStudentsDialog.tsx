'use client';

import { useState, useEffect, type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { classroomsApi } from '@/lib/api-client';
import type { SchoolStudentSummary } from '@eureka-lab/shared-types';

interface AddStudentsDialogProps {
  open: boolean;
  classroomId: string;
  /** UIDs already enrolled — excluded from the pick list. */
  enrolledIds: string[];
  onClose: () => void;
  /** Called after a successful assignment so the parent can refetch. */
  onAssigned: () => void;
}

/**
 * Roster picker: lists the school's active students (minus those already in the
 * class) as checkboxes; submitting assigns the selected UIDs to the classroom.
 * Inline error; closes on success. Sonner is broken app-wide — feedback is inline.
 */
export const AddStudentsDialog: FC<AddStudentsDialogProps> = ({ open, classroomId, enrolledIds, onClose, onAssigned }) => {
  const t = useTranslations('Teacher');
  const [roster, setRoster] = useState<SchoolStudentSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    setSelected(new Set());
    classroomsApi
      .getRoster()
      .then((res) => {
        if (active) setRoster(res.students.filter((s) => !enrolledIds.includes(s.uid)));
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : t('assignFailed'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, enrolledIds, t]);

  if (!open) return null;

  const toggle = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await classroomsApi.assignStudents(classroomId, [...selected]);
      onAssigned();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('assignFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} aria-label="Dialog overlay">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('addStudents')}>
        <h2 className="text-xl font-bold text-foreground">{t('addStudents')}</h2>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">{t('loading')}</p>
        ) : roster.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t('noRosterStudents')}</p>
        ) : (
          <ul className="mt-4 max-h-72 space-y-1 overflow-y-auto">
            {roster.map((s) => (
              <li key={s.uid}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-background">
                  <input type="checkbox" checked={selected.has(s.uid)} onChange={() => toggle(s.uid)} />
                  <span className="text-sm text-foreground">{s.displayName}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{s.username}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>{t('cancel')}</Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting || selected.size === 0}>
            {submitting ? t('assigning') : t('assignSelected', { count: selected.size })}
          </Button>
        </div>
      </div>
    </div>
  );
};
