'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface CreateClassroomDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Close the dialog */
  onClose: () => void;
  /** Submit handler receiving the classroom name */
  onSubmit: (name: string) => Promise<void>;
}

/**
 * Modal dialog for creating a new classroom.
 * Simple form with a name field and submit button.
 *
 * @param open - Whether the dialog is visible
 * @param onClose - Close handler
 * @param onSubmit - Submit handler
 */
export const CreateClassroomDialog: FC<CreateClassroomDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const t = useTranslations('Teacher');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  /**
   * Handle form submission.
   * @param e - Form event
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;

    setLoading(true);
    setError('');

    try {
      await onSubmit(name.trim());
      setName('');
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create classroom';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      aria-label="Dialog overlay"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('createClassroom')}
      >
        <h2 className="text-xl font-bold text-foreground">
          {t('createClassroom')}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="classroom-name"
              className="block text-sm font-medium text-foreground"
            >
              {t('classroomName')}
            </label>
            <input
              id="classroom-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('classroomName')}
              minLength={2}
              maxLength={50}
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading || name.trim().length < 2}>
              {loading ? t('creating') : t('createClassroom')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
