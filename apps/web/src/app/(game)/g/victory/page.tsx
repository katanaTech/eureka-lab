'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCombatStore } from '@/stores/combat-store';
import { CertificateScreen } from '@/components/game/CertificateScreen';

/**
 * Victory / certificate screen — shown after defeating the Anti-AI Overlord.
 * Reads the certificate URL and XP from the combat store (set by the battle page
 * before navigating here). Redirects to /g/world if the store has no certificate
 * (e.g., navigated here directly without winning an overlord battle).
 */
export default function VictoryPage() {
  const router = useRouter();
  const { certificateUrl, xpAwarded, badgesUnlocked, resetCombat } = useCombatStore();

  // Guard: no certificate = user navigated here directly
  useEffect(() => {
    if (!certificateUrl) router.replace('/g/world');
  }, [certificateUrl, router]);

  function handleBack() {
    resetCombat();
    router.push('/g/world');
  }

  if (!certificateUrl) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <CertificateScreen
      certificateUrl={certificateUrl}
      xpAwarded={xpAwarded}
      badgesUnlocked={badgesUnlocked}
      onBack={handleBack}
    />
  );
}
