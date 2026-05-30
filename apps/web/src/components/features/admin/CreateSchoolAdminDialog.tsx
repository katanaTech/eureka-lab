'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface CreateSchoolAdminDialogProps {
  open: boolean;
  onClose: () => void;
  /** Resolves when the admin is created; rejects (with message) on failure. */
  onSubmit: (values: { email: string; displayName: string; password: string }) => Promise<void>;
}

/**
 * Modal for minting a school admin. The super-admin types a temporary
 * password; on success the dialog shows the email + password once (no email
 * is sent) before the operator closes it.
 */
export const CreateSchoolAdminDialog: FC<CreateSchoolAdminDialogProps> = ({ open, onClose, onSubmit }) => {
  const t = useTranslations('Admin');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  if (!open) return null;

  const reset = () => {
    setEmail('');
    setDisplayName('');
    setPassword('');
    setError('');
    setCreated(null);
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
      setCreated({ email: email.trim(), password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose} aria-label="Dialog overlay">
      <div
        className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('addAdmin')}
      >
        {created ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">{t('adminCreatedTitle')}</h2>
            <div className="rounded-lg border border-border bg-background p-3 text-sm">
              <p><span className="text-muted-foreground">{t('email')}: </span><span className="font-mono">{created.email}</span></p>
              <p><span className="text-muted-foreground">{t('tempPassword')}: </span><span className="font-mono">{created.password}</span></p>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminCreatedNote')}</p>
            <div className="flex justify-end">
              <Button type="button" onClick={handleClose}>{t('done')}</Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground">{t('addAdmin')}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-foreground">{t('email')}</label>
                <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="admin-name" className="block text-sm font-medium text-foreground">{t('displayName')}</label>
                <input id="admin-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={50} required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="admin-pass" className="block text-sm font-medium text-foreground">{t('tempPassword')}</label>
                <input id="admin-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>{t('cancel')}</Button>
                <Button type="submit" disabled={loading || password.length < 8}>{loading ? t('creating') : t('addAdmin')}</Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
