'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus } from 'lucide-react';
import { RoleGate } from '@/components/auth/RoleGate';
import { GameButton } from '@/components/game/GameButton';
import { SchoolStatusBadge } from '@/components/features/admin/SchoolStatusBadge';
import { CreateSchoolAdminDialog } from '@/components/features/admin/CreateSchoolAdminDialog';
import { EditSeatLimitDialog } from '@/components/features/admin/EditSeatLimitDialog';
import { BillingPanel } from '@/components/features/admin/BillingPanel';
import { schoolsApi } from '@/lib/api-client';
import type { School, SchoolAdminSummary } from '@eureka-lab/shared-types';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/** Detail view for one school. Gated to super_admin. */
function SchoolDetailInner({ id }: { id: string }) {
  const t = useTranslations('Admin');
  const [school, setSchool] = useState<School | null>(null);
  const [admins, setAdmins] = useState<SchoolAdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [seatOpen, setSeatOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [s, a] = await Promise.all([schoolsApi.get(id), schoolsApi.listAdmins(id)]);
      setSchool(s);
      setAdmins(a.admins);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load school');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleStatus = async () => {
    if (!school) return;
    const next = school.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = next === 'suspended' ? t('suspendConfirm') : t('reactivateConfirm');
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    setError('');
    try {
      await schoolsApi.update(id, { status: next });
      await fetchAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleSeatLimit = async (seatLimit: number) => {
    await schoolsApi.update(id, { seatLimit });
    await fetchAll();
  };

  const handleCreateAdmin = async (values: { email: string; displayName: string; password: string }) => {
    await schoolsApi.createAdmin(id, values);
    await fetchAll();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><p className="text-muted-foreground">{t('loading')}</p></div>;
  }
  if (!school) {
    return <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error || 'Not found'}</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('backToSchools')}
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl text-glow-primary">{school.name}</h1>
          <SchoolStatusBadge status={school.status} />
        </div>
        <GameButton variant={school.status === 'active' ? 'danger' : 'ghost'} size="sm" onClick={toggleStatus} disabled={busy}>
          {school.status === 'active' ? t('suspendSchool') : t('reactivateSchool')}
        </GameButton>
      </div>

      {error && <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">{error}</div>}

      <div className="panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('seats')}</span>
          <span className="flex items-center gap-3">
            <span className="font-medium text-foreground">{school.seatsUsed} / {school.seatLimit}</span>
            <button onClick={() => setSeatOpen(true)} className="text-sm text-primary hover:underline">{t('editLimit')}</button>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('subscription')}</span>
          <span className="font-medium text-foreground">{school.subscription.tier} · {school.subscription.status}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">{t('enrollmentSecret')}</span>
          <span className="font-mono text-xs text-muted-foreground break-all">{school.secretKeys.enrollmentSecret}</span>
        </div>
      </div>

      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">{t('admins')}</h2>
          <GameButton variant="primary" size="sm" onClick={() => setAdminOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('addAdmin')}
          </GameButton>
        </div>
        {admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noAdmins')}</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {admins.map((a) => (
              <li key={a.uid} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-muted-foreground">{a.email}</span>
                <span className="text-foreground">{a.displayName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BillingPanel schoolId={id} />

      <CreateSchoolAdminDialog open={adminOpen} onClose={() => setAdminOpen(false)} onSubmit={handleCreateAdmin} />
      <EditSeatLimitDialog open={seatOpen} current={school.seatLimit} onClose={() => setSeatOpen(false)} onSubmit={handleSeatLimit} />
    </div>
  );
}

/** Page wrapper: synchronous params (Next 14.2) + super_admin gate. */
export default function SchoolDetailPage({ params }: { params: { id: string } }) {
  return (
    <RoleGate allow={['super_admin']}>
      <SchoolDetailInner id={params.id} />
    </RoleGate>
  );
}
