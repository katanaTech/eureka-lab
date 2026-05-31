'use client';

import { type FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { synthesizeStudentEmail } from '@eureka-lab/shared-types';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { homeForRole } from '@/lib/auth-redirects';
import { Button } from '@/components/ui/button';

/**
 * Student sign-in: school code + username + password. Rebuilds the student's
 * non-routable synthetic email and authenticates with Firebase, then exchanges
 * the token for the enriched profile (same as the main login form).
 */
export const StudentLoginForm: FC = () => {
  const t = useTranslations('SchoolStudents');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [schoolCode, setSchoolCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const email = synthesizeStudentEmail(schoolCode.trim(), username.trim());
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const profile = await authApi.login(idToken);
      setUser({ ...profile, streak: 0 });
      router.push(homeForRole(profile.role));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('studentLoginTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('studentLoginHint')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="school-code" className="text-sm font-medium text-foreground">{t('schoolCode')}</label>
          <input id="school-code" type="text" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} required
            disabled={isLoading} autoComplete="off" autoCapitalize="characters"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-2">
          <label htmlFor="student-username" className="text-sm font-medium text-foreground">{t('username')}</label>
          <input id="student-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
            disabled={isLoading} autoComplete="username"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-2">
          <label htmlFor="student-password" className="text-sm font-medium text-foreground">{t('password')}</label>
          <input id="student-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            disabled={isLoading} autoComplete="current-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? t('loading') : t('signIn')}</Button>
      </form>
    </div>
  );
};
