'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  REALM_NAME_BY_ZONE,
  CAMPAIGN_SLUG_BY_ZONE,
  REALM_BOSS_NAME_BY_ZONE,
  FANTASY_CLASS_DEFAULT_AURA_HSL,
  FANTASY_CLASS_BY_CAREER,
  type ZoneId,
  type FantasyClass,
} from '@eureka-lab/shared-types';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { Scene, Logo, GameButton, KpBadge } from '@/components/game/fantasy';
import { MOBILE } from '@/lib/game-assets';

// ── Zone configuration ────────────────────────────────────────────────────────

interface ZoneConfig {
  id: ZoneId;
  missionCount: number;
  icon: string;
}

const ZONES: ZoneConfig[] = [
  { id: 'library', missionCount: 4, icon: '📚' },
  { id: 'forge', missionCount: 4, icon: '⚒' },
  { id: 'citadel', missionCount: 4, icon: '🏰' },
  { id: 'academy', missionCount: 4, icon: '🎓' },
];

const UNLOCK_REQUIRES: Partial<Record<ZoneId, ZoneId>> = {
  forge: 'library',
  citadel: 'forge',
  academy: 'citadel',
};

/**
 * Mobile dashboard — Realm Map with compact card layout and mobile background.
 * Mirrors desktop /g/dashboard with /m/g/ links and single-column layout.
 *
 * @returns The mobile realm map dashboard
 */
export default function MobileDashboardPage() {
  const router = useRouter();
  const t = useTranslations('Phase16Dashboard');
  const defeatedGuardianZones = useGameStore((s) => s.defeatedGuardianZones);
  const careerArchetype = useGameStore((s) => s.careerArchetype);
  const characterCustomization = useGameStore((s) => s.characterCustomization);
  const resetGame = useGameStore((s) => s.resetGame);
  const clearUser = useAuthStore((s) => s.clearUser);
  const user = useAuthStore((s) => s.user);

  const fantasyClass: FantasyClass = careerArchetype
    ? FANTASY_CLASS_BY_CAREER[careerArchetype]
    : 'warrior';

  const auraHsl = FANTASY_CLASS_DEFAULT_AURA_HSL[fantasyClass];
  const heroName = characterCustomization.name || user?.displayName || t('defaultHeroName');

  /**
   * @param zoneId - The zone to check
   * @returns True if the zone is accessible
   */
  function isZoneUnlocked(zoneId: ZoneId): boolean {
    const requiredZone = UNLOCK_REQUIRES[zoneId];
    if (!requiredZone) return true;
    return defeatedGuardianZones.includes(requiredZone);
  }

  /** Signs out and navigates to mobile welcome. */
  async function handleSignOut() {
    try {
      const { auth } = await import('@/lib/firebase');
      if (auth) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      }
    } catch { /* proceed */ }
    clearUser();
    resetGame();
    router.replace('/m/g/welcome');
  }

  return (
    <Scene className="min-h-screen px-4 pb-20 pt-4" background={MOBILE.worldMap}>
      {/* Compact HUD */}
      <header className="flex items-center justify-between gap-3">
        <Logo withText={false} />
        <div className="flex items-center gap-2">
          <KpBadge />
          <div className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-card/60 px-2 py-1">
            <div className="h-6 w-6 rounded-full"
              style={{ background: `hsl(${auraHsl})`, boxShadow: `0 0 8px hsl(${auraHsl} / 0.5)` }}
              aria-hidden />
            <span className="text-[10px] font-display uppercase tracking-wider text-foreground">{heroName}</span>
          </div>
          <GameButton variant="ghost" size="sm" onClick={handleSignOut} aria-label={t('signOutAria')}>
            {t('signOut')}
          </GameButton>
        </div>
      </header>

      {/* Title */}
      <div className="mt-6 text-center">
        <h1 className="font-display text-2xl uppercase tracking-widest text-glow-primary">{t('heading')}</h1>
        <p className="mt-1 text-xs text-muted-foreground tracking-wider">{t('subheading')}</p>
      </div>

      {/* Single-column zone cards */}
      <div className="mt-5 flex flex-col gap-4">
        {ZONES.map((zone) => {
          const unlocked = isZoneUnlocked(zone.id);
          const realmName = REALM_NAME_BY_ZONE[zone.id];
          const bossName = REALM_BOSS_NAME_BY_ZONE[zone.id];
          const slug = CAMPAIGN_SLUG_BY_ZONE[zone.id];

          return (
            <div key={zone.id}
              className={[
                'rounded-xl border p-4 transition-all',
                unlocked
                  ? 'border-primary/30 bg-card/80 hover:border-primary/60'
                  : 'border-white/10 bg-card/30 opacity-60',
              ].join(' ')}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl" aria-hidden>{zone.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-sm uppercase tracking-widest text-foreground">{realmName}</h2>
                  <p className="text-[10px] text-primary/80">{t('bossLabel', { bossName })}</p>
                </div>
                {!unlocked && <span className="text-lg" aria-label={t('lockedAria')} role="img">🔒</span>}
              </div>
              <p className="mb-3 text-xs text-muted-foreground">{t('missionCountLine', { count: zone.missionCount })}</p>
              {unlocked ? (
                <div className="flex gap-2">
                  <Link href={`/m/g/campaign/${slug}`} className="flex-1">
                    <GameButton variant="primary" size="sm" className="w-full">{t('enterIsle')}</GameButton>
                  </Link>
                  <Link href={`/m/g/campaign/${slug}/prepare`}>
                    <GameButton variant="ghost" size="sm">{t('prepare')}</GameButton>
                  </Link>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground/60 italic">{t('lockedHint')}</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground/50">{t('footerNote')}</p>
    </Scene>
  );
}
