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

/** Maps a zone to the zone that must be cleared first (guardian defeated). */
const UNLOCK_REQUIRES: Partial<Record<ZoneId, ZoneId>> = {
  forge: 'library',
  citadel: 'forge',
  academy: 'citadel',
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Dashboard page — the Realm Map showing all 4 campaign isles.
 * Displays locked/unlocked state based on defeated guardian zones.
 * Provides navigation to campaign detail pages and sign-out.
 *
 * @returns The realm map dashboard screen
 */
export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('Phase16Dashboard');
  const defeatedGuardianZones = useGameStore((s) => s.defeatedGuardianZones);
  const careerArchetype = useGameStore((s) => s.careerArchetype);
  const characterCustomization = useGameStore((s) => s.characterCustomization);
  const resetGame = useGameStore((s) => s.resetGame);
  const clearUser = useAuthStore((s) => s.clearUser);
  const user = useAuthStore((s) => s.user);

  /** Determine the current fantasy class from career archetype. */
  const fantasyClass: FantasyClass = careerArchetype
    ? FANTASY_CLASS_BY_CAREER[careerArchetype]
    : 'warrior';

  const auraHsl = FANTASY_CLASS_DEFAULT_AURA_HSL[fantasyClass];
  const heroName = characterCustomization.name || user?.displayName || t('defaultHeroName');

  /**
   * Whether a given zone is currently unlocked to play.
   * @param zoneId - The zone to check
   * @returns True if the zone is accessible
   */
  function isZoneUnlocked(zoneId: ZoneId): boolean {
    const requiredZone = UNLOCK_REQUIRES[zoneId];
    if (!requiredZone) return true; // library is always open
    return defeatedGuardianZones.includes(requiredZone);
  }

  /**
   * Signs the user out and resets game state before navigating to welcome.
   */
  async function handleSignOut() {
    try {
      const { auth } = await import('@/lib/firebase');
      if (auth) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      }
    } catch {
      // Proceed with client-side cleanup even if signOut fails
    }
    clearUser();
    resetGame();
    router.replace('/g/welcome');
  }

  return (
    <Scene className="min-h-screen px-4 py-6">
      {/* Top HUD */}
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-4">
          <KpBadge />
          {/* Character avatar strip */}
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-card/60 px-4 py-2">
            <div
              className="h-8 w-8 rounded-full"
              style={{
                background: `hsl(${auraHsl})`,
                boxShadow: `0 0 10px hsl(${auraHsl} / 0.5)`,
              }}
              aria-hidden
            />
            <div className="leading-none">
              <p className="text-xs font-display uppercase tracking-wider text-foreground">
                {heroName}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">
                {t('heroLevel', { className: fantasyClass, level: user?.level ?? 1 })}
              </p>
            </div>
          </div>
          <GameButton
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            aria-label={t('signOutAria')}
          >
            {t('signOut')}
          </GameButton>
        </div>
      </header>

      {/* Hero strip */}
      <div className="mx-auto mt-10 max-w-5xl text-center">
        <h1 className="font-display text-4xl uppercase tracking-widest text-glow-primary">
          {t('heading')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tracking-wider">
          {t('subheading')}
        </p>
      </div>

      {/* Campaign grid */}
      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
        {ZONES.map((zone) => {
          const unlocked = isZoneUnlocked(zone.id);
          const realmName = REALM_NAME_BY_ZONE[zone.id];
          const bossName = REALM_BOSS_NAME_BY_ZONE[zone.id];
          const slug = CAMPAIGN_SLUG_BY_ZONE[zone.id];

          return (
            <ZoneCard
              key={zone.id}
              icon={zone.icon}
              realmName={realmName}
              bossLabel={t('bossLabel', { bossName })}
              missionCountLine={t('missionCountLine', { count: zone.missionCount })}
              slug={slug}
              unlocked={unlocked}
              lockedAria={t('lockedAria')}
              enterIsleLabel={t('enterIsle')}
              prepareLabel={t('prepare')}
              lockedHint={t('lockedHint')}
            />
          );
        })}
      </div>

      {/* Footer note */}
      <p className="mx-auto mt-10 max-w-5xl text-center text-xs text-muted-foreground/50">
        {t('footerNote')}
      </p>
    </Scene>
  );
}

// ── ZoneCard sub-component ────────────────────────────────────────────────────

interface ZoneCardProps {
  icon: string;
  realmName: string;
  bossLabel: string;
  missionCountLine: string;
  slug: string;
  unlocked: boolean;
  lockedAria: string;
  enterIsleLabel: string;
  prepareLabel: string;
  lockedHint: string;
}

/**
 * Individual campaign isle card for the realm map grid.
 *
 * @param props.icon - Emoji icon for the zone
 * @param props.realmName - Display name for the realm
 * @param props.bossLabel - Pre-translated "Boss: {name}" line
 * @param props.missionCountLine - Pre-translated mission count line
 * @param props.slug - URL slug for the campaign route
 * @param props.unlocked - Whether this zone is accessible
 * @param props.lockedAria - aria-label for the lock icon
 * @param props.enterIsleLabel - CTA label for entering the isle
 * @param props.prepareLabel - CTA label for the prepare action
 * @param props.lockedHint - Hint text shown when the zone is locked
 * @returns A styled campaign card
 */
function ZoneCard({
  icon,
  realmName,
  bossLabel,
  missionCountLine,
  slug,
  unlocked,
  lockedAria,
  enterIsleLabel,
  prepareLabel,
  lockedHint,
}: ZoneCardProps) {
  return (
    <div
      className={[
        'rounded-2xl border p-6 transition-all',
        unlocked
          ? 'border-primary/30 bg-card/80 hover:border-primary/60'
          : 'border-white/10 bg-card/30 opacity-60',
      ].join(' ')}
    >
      {/* Icon + name row */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {icon}
        </span>
        <div>
          <h2 className="font-display text-base uppercase tracking-widest text-foreground">
            {realmName}
          </h2>
          <p className="text-xs text-muted-foreground">
            <span className="text-primary/80">{bossLabel}</span>
          </p>
        </div>
        {!unlocked && (
          <span className="ml-auto text-xl" aria-label={lockedAria} role="img">
            🔒
          </span>
        )}
      </div>

      {/* Mission count */}
      <p className="mb-5 text-sm text-muted-foreground">
        {missionCountLine}
      </p>

      {unlocked ? (
        <div className="flex gap-3">
          <Link href={`/g/campaign/${slug}`} className="flex-1">
            <GameButton variant="primary" size="sm" className="w-full">
              {enterIsleLabel}
            </GameButton>
          </Link>
          <Link href={`/g/campaign/${slug}/prepare`}>
            <GameButton variant="ghost" size="sm">
              {prepareLabel}
            </GameButton>
          </Link>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/60 italic">
          {lockedHint}
        </p>
      )}
    </div>
  );
}
