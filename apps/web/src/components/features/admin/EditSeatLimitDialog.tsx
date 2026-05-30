'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface EditSeatLimitDialogProps {
  open: boolean;
  current: number;
  onClose: () => void;
  onSubmit: (seatLimit: number) => Promise<void>;
}

/** Modal to edit a school's seat limit. Inline error. */
export const EditSeatLimitDialog: FC<EditSeatLimitDialogProps> = ({ open, current, onClose, onSubmit }) => {
  const t = useTranslations('Admin');
  const [value, setValue] = useState(String(current));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const seats = Number(value);
    if (!Number.isInteger(seats) || seats < 0) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(seats);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} aria-label="Dialog overlay">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('editLimit')}>
        <h2 className="text-xl font-bold text-foreground">{t('editLimit')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-seats" className="block text-sm font-medium text-foreground">{t('seatLimit')}</label>
            <input id="edit-seats" type="number" value={value} onChange={(e) => setValue(e.target.value)} min={0} max={100000} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('saving') : t('save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
