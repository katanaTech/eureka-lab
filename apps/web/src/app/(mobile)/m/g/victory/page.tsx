'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCombatStore } from '@/stores/combat-store';
import { CertificateScreen } from '@/components/game/CertificateScreen';
import { Scene } from '@/components/game/fantasy';

/**
 * Mobile victory / certificate screen — mirrors desktop /g/victory.
 * Redirects to /m/g/dashboard if no certificate is present.
 *
 * @returns The mobile victory certificate screen
 */
export default function MobileVictoryPage() {
  const router = useRouter();
  const t = useTranslations('Phase16Victory');
  const { certificateUrl, xpAwarded, badgesUnlocked, resetCombat } = useCombatStore();

  useEffect(() => {
    if (!certificateUrl) router.replace('/m/g/dashboard');
  }, [certificateUrl, router]);

  /** Resets combat state and navigates to mobile dashboard. */
  function handleBack() {
    resetCombat();
    router.push('/m/g/dashboard');
  }

  if (!certificateUrl) {
    return (
      <Scene className="flex h-screen w-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
          role="status" aria-label={t('loadingAria')} />
      </Scene>
    );
  }

  return (
    <Scene className="min-h-screen pb-20">
      <CertificateScreen
        certificateUrl={certificateUrl}
        xpAwarded={xpAwarded}
        badgesUnlocked={badgesUnlocked}
        onBack={handleBack}
      />
    </Scene>
  );
}
