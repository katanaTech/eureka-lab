import { SignupForm } from '@/components/features/auth/SignupForm';

/** Force dynamic rendering — Firebase client SDK needs runtime env vars */
export const dynamic = 'force-dynamic';

/**
 * Signup page — unauthenticated route for parent account creation.
 */
export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignupForm />
    </main>
  );
}
