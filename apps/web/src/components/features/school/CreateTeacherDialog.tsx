'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface CreateTeacherDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { email: string; displayName: string; password: string }) => Promise<void>;
}

/**
 * Modal for minting a teacher. On success shows the email + temp password once
 * (no email is sent). Inline error on failure.
 */
export const CreateTeacherDialog: FC<CreateTeacherDialogProps> = ({ open, onClose, onSubmit }) => {
  const t = useTranslations('SchoolAdmin');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setEmail('');
    setDisplayName('');
    setPassword('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({ email: email.trim(), displayName: displayName.trim(), password });
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose} aria-label="Dialog overlay">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('addTeacher')}>
        <h2 className="text-xl font-bold text-foreground">{t('addTeacher')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="teacher-email" className="block text-sm font-medium text-foreground">{t('email')}</label>
            <input id="teacher-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="teacher-name" className="block text-sm font-medium text-foreground">{t('displayName')}</label>
            <input id="teacher-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={50} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="teacher-pass" className="block text-sm font-medium text-foreground">{t('tempPassword')}</label>
            <input id="teacher-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading || password.length < 8}>{loading ? t('creating') : t('addTeacher')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
