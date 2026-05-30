/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * School-admin console placeholder. The teacher-management console lands in
 * B2B epic sub-project 3; this exists so `homeForRole` redirects for
 * school_admin resolve without a 404.
 */
export default function SchoolConsolePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="font-display text-3xl text-glow-primary">School Admin</h1>
      <div className="panel p-8 text-center">
        <p className="text-muted-foreground">Teacher management console — coming soon.</p>
      </div>
    </div>
  );
}
