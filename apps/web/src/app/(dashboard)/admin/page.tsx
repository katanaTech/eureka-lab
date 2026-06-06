'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { RoleGate } from '@/components/auth/RoleGate';
import { GameButton } from '@/components/game/GameButton';
import { SchoolsTable } from '@/components/features/admin/SchoolsTable';
import { UsageOverview } from '@/components/features/admin/UsageOverview';
import { CreateSchoolDialog } from '@/components/features/admin/CreateSchoolDialog';
import { schoolsApi } from '@/lib/api-client';
import type { SchoolSummary } from '@eureka-lab/shared-types';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/** Super-admin schools list. Gated to super_admin via RoleGate. */
function AdminSchoolsInner() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const res = await schoolsApi.list();
      setSchools(res.schools);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleCreate = async (values: { name: string; seatLimit: number; subscriptionTier?: string }) => {
    await schoolsApi.create(values);
    await fetchSchools();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl text-glow-primary">{t('schoolsTitle')}</h1>
        <GameButton variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('newSchool')}
        </GameButton>
      </div>

      <UsageOverview />

      {error && (
        <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>
      ) : schools.length === 0 ? (
        <div className="panel p-8 text-center"><p className="text-muted-foreground">{t('noSchools')}</p></div>
      ) : (
        <SchoolsTable schools={schools} onRowClick={(id) => router.push(`/admin/schools/${id}`)} />
      )}

      <CreateSchoolDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}

/** Page wrapper applying the super_admin role gate. */
export default function AdminSchoolsPage() {
  return (
    <RoleGate allow={['super_admin']}>
      <AdminSchoolsInner />
    </RoleGate>
  );
}
