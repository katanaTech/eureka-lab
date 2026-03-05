import { LoginForm } from '@/components/features/auth/LoginForm';

/** Force dynamic rendering — Firebase client SDK needs runtime env vars */
export const dynamic = 'force-dynamic';

/**
 * Login page — unauthenticated route.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
