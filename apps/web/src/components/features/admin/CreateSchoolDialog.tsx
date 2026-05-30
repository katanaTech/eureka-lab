'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface CreateSchoolDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; seatLimit: number; subscriptionTier?: string }) => Promise<void>;
}

/**
 * Modal for creating a school tenant. Inline error feedback (Sonner is broken
 * app-wide). Clears + closes on success.
 */
export const CreateSchoolDialog: FC<CreateSchoolDialogProps> = ({ open, onClose, onSubmit }) => {
  const t = useTranslations('Admin');
  const [name, setName] = useState('');
  const [seatLimit, setSeatLimit] = useState('30');
  const [tier, setTier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const seats = Number(seatLimit);
    if (name.trim().length < 2 || !Number.isInteger(seats) || seats < 0) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit({ name: name.trim(), seatLimit: seats, ...(tier.trim() && { subscriptionTier: tier.trim() }) });
      setName('');
      setSeatLimit('30');
      setTier('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} aria-label="Dialog overlay">
      <div
        className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('createSchool')}
      >
        <h2 className="text-xl font-bold text-foreground">{t('createSchool')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="school-name" className="block text-sm font-medium text-foreground">{t('schoolName')}</label>
            <input id="school-name" type="text" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="seat-limit" className="block text-sm font-medium text-foreground">{t('seatLimit')}</label>
            <input id="seat-limit" type="number" value={seatLimit} onChange={(e) => setSeatLimit(e.target.value)} min={0} max={100000} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="sub-tier" className="block text-sm font-medium text-foreground">{t('subscriptionTier')}</label>
            <input id="sub-tier" type="text" value={tier} onChange={(e) => setTier(e.target.value)} maxLength={50} placeholder="trial"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading || name.trim().length < 2}>{loading ? t('creating') : t('createSchool')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
