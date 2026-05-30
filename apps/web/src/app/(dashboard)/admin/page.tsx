/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Super-admin console placeholder. The full schools/subscriptions/licenses
 * console lands in B2B epic sub-project 2; this exists so `homeForRole`
 * redirects for super_admin resolve without a 404.
 */
export default function AdminConsolePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="font-display text-3xl text-glow-primary">Super Admin</h1>
      <div className="panel p-8 text-center">
        <p className="text-muted-foreground">
          School &amp; subscription management console — coming soon.
        </p>
      </div>
    </div>
  );
}
