import { StudentLoginForm } from '@/components/features/auth/StudentLoginForm';

/** Force dynamic rendering — Firebase client SDK needs runtime env vars. */
export const dynamic = 'force-dynamic';

/** Student sign-in route. */
export default function StudentLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <StudentLoginForm />
    </div>
  );
}
