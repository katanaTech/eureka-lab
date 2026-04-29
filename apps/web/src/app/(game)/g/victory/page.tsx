'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCombatStore } from '@/stores/combat-store';
import { CertificateScreen } from '@/components/game/CertificateScreen';
import { Scene } from '@/components/game/fantasy';

/**
 * Victory / certificate screen — shown after defeating the Anti-AI Overlord.
 * Reads the certificate URL and XP from the combat store (set by the battle page
 * before navigating here). Redirects to /g/dashboard if the store has no certificate
 * (e.g., navigated here directly without winning an overlord battle).
 *
 * @returns The victory certificate screen with fantasy atmosphere
 */
export default function VictoryPage() {
  const router = useRouter();
  const { certificateUrl, xpAwarded, badgesUnlocked, resetCombat } = useCombatStore();

  // Guard: no certificate = user navigated here directly
  useEffect(() => {
    if (!certificateUrl) router.replace('/g/dashboard');
  }, [certificateUrl, router]);

  /**
   * Resets combat state and navigates back to the realm dashboard.
   */
  function handleBack() {
    resetCombat();
    router.push('/g/dashboard');
  }

  if (!certificateUrl) {
    return (
      <Scene className="flex h-screen w-screen items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
          role="status"
          aria-label="Loading victory screen"
        />
      </Scene>
    );
  }

  return (
    <Scene className="min-h-screen">
      <CertificateScreen
        certificateUrl={certificateUrl}
        xpAwarded={xpAwarded}
        badgesUnlocked={badgesUnlocked}
        onBack={handleBack}
      />
    </Scene>
  );
}
