'use client';

import { useState, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface AddStudentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { displayName: string; username: string; password: string; birthYear: number; consentAttested: boolean }) => Promise<void>;
}

/**
 * Modal for provisioning a student. Shows a COPPA consent checkbox once the
 * entered birth year implies an age under 13, and gates submit on it. Inline
 * error on failure; closes on success.
 */
export const AddStudentDialog: FC<AddStudentDialogProps> = ({ open, onClose, onSubmit }) => {
  const t = useTranslations('SchoolStudents');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const yearNum = Number(birthYear);
  // Conservative year-only check, matching the backend: a child whose year-age is
  // 13 or under may still be 12 until their birthday, so they need consent.
  const isUnder13 = yearNum > 0 && new Date().getFullYear() - yearNum <= 13;
  const consentMissing = isUnder13 && !consent;

  const reset = () => {
    setDisplayName('');
    setUsername('');
    setPassword('');
    setBirthYear('');
    setConsent(false);
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
      await onSubmit({ displayName: displayName.trim(), username: username.trim().toLowerCase(), password, birthYear: yearNum, consentAttested: consent });
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose} aria-label="Dialog overlay">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('addStudent')}>
        <h2 className="text-xl font-bold text-foreground">{t('addStudent')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="student-name" className="block text-sm font-medium text-foreground">{t('displayName')}</label>
            <input id="student-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={50} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="student-username" className="block text-sm font-medium text-foreground">{t('username')}</label>
            <input id="student-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} pattern="[A-Za-z0-9]{3,20}" required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="student-pass" className="block text-sm font-medium text-foreground">{t('password')}</label>
            <input id="student-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="student-year" className="block text-sm font-medium text-foreground">{t('birthYear')}</label>
            <input id="student-year" type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} min={1900} max={new Date().getFullYear()} required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {isUnder13 && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>{t('consentLabel')}</span>
            </label>
          )}
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading || password.length < 8 || consentMissing}>{loading ? t('creating') : t('addStudent')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
