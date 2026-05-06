'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Crown } from 'lucide-react';
import {
  ZONE_BY_CAMPAIGN_SLUG,
  REALM_NAME_BY_ZONE,
  REALM_BOSS_NAME_BY_ZONE,
  type ZoneId,
} from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton, KpBadge } from '@/components/game/fantasy';
import { MOBILE } from '@/lib/game-assets';

// ── Placeholder mission data (same as desktop) ─────────────────────────────

type MissionDifficulty = 'Apprentice' | 'Adept' | 'Master' | 'Legendary';

interface PlaceholderMission {
  id: string;
  title: string;
  difficulty: MissionDifficulty;
  description: string;
  isBoss: boolean;
}

const PLACEHOLDER_MISSIONS: Record<ZoneId, PlaceholderMission[]> = {
  library: [
    { id: 'lib-1', title: 'Prompt Basics', difficulty: 'Apprentice', description: 'Learn to craft your first clear, effective AI prompt.', isBoss: false },
    { id: 'lib-2', title: 'Context Mastery', difficulty: 'Adept', description: 'Provide rich context to shape AI responses.', isBoss: false },
    { id: 'lib-3', title: 'Hallucination Hunt', difficulty: 'Master', description: 'Train your eye to spot AI confabulations.', isBoss: false },
    { id: 'lib-boss', title: 'Babble Whisperer', difficulty: 'Legendary', description: 'Face the guardian of the Isle of Whispers.', isBoss: true },
  ],
  forge: [
    { id: 'forge-1', title: 'Trigger & Action', difficulty: 'Apprentice', description: 'Build your first AI workflow.', isBoss: false },
    { id: 'forge-2', title: 'Multi-Step Chains', difficulty: 'Adept', description: 'Link multiple AI steps together.', isBoss: false },
    { id: 'forge-3', title: 'Error Handling', difficulty: 'Master', description: 'Design workflows that handle unexpected outputs.', isBoss: false },
    { id: 'forge-boss', title: 'Babble Drone', difficulty: 'Legendary', description: 'Battle the Forge of Echoes guardian.', isBoss: true },
  ],
  citadel: [
    { id: 'cit-1', title: 'Code Reading', difficulty: 'Apprentice', description: 'Understand AI-generated code.', isBoss: false },
    { id: 'cit-2', title: 'Bug Squashing', difficulty: 'Adept', description: 'Use AI as a debugger.', isBoss: false },
    { id: 'cit-3', title: 'Feature Building', difficulty: 'Master', description: 'Guide AI to extend an existing mini-app.', isBoss: false },
    { id: 'cit-boss', title: 'Babble Glitch', difficulty: 'Legendary', description: 'Confront the corrupted guardian of the Citadel.', isBoss: true },
  ],
  academy: [
    { id: 'aca-1', title: 'Agent Persona', difficulty: 'Apprentice', description: 'Define a personality for your AI agent.', isBoss: false },
    { id: 'aca-2', title: 'Memory Design', difficulty: 'Adept', description: 'Give your agent persistent context.', isBoss: false },
    { id: 'aca-3', title: 'Tool Integration', difficulty: 'Master', description: 'Connect your agent to external tools.', isBoss: false },
    { id: 'aca-boss', title: 'Babble Wraith', difficulty: 'Legendary', description: 'Face the wraith that haunts the Academy.', isBoss: true },
  ],
};

const DIFFICULTY_BADGE: Record<MissionDifficulty, string> = {
  Apprentice: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Adept: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  Master: 'border-violet-500/40 text-violet-400 bg-violet-500/10',
  Legendary: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
};

/**
 * Mobile campaign detail page — mission list for a realm isle.
 * Mirrors desktop /g/campaign/[slug] with compact layout and /m/g/ links.
 *
 * @returns The mobile campaign mission-list screen
 */
export default function MobileCampaignPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useTranslations('Phase16Campaign');

  const slug = params.slug ?? '';
  const zoneId: ZoneId | undefined = ZONE_BY_CAMPAIGN_SLUG[slug];

  useEffect(() => {
    if (!zoneId) router.replace('/m/g/dashboard');
  }, [zoneId, router]);

  if (!zoneId) return null;

  const realmName = REALM_NAME_BY_ZONE[zoneId];
  const bossName = REALM_BOSS_NAME_BY_ZONE[zoneId];
  const missions = PLACEHOLDER_MISSIONS[zoneId];

  return (
    <Scene className="min-h-screen px-4 pb-20 pt-4" background={MOBILE.island(slug)}>
      <header className="flex items-center justify-between gap-3">
        <Logo withText={false} />
        <div className="flex items-center gap-2">
          <KpBadge />
          <Link href="/m/g/dashboard">
            <GameButton variant="ghost" size="sm">{t('backRealmMap')}</GameButton>
          </Link>
        </div>
      </header>

      <div className="mt-6 text-center">
        <h1 className="font-display text-2xl uppercase tracking-widest text-glow-primary">{realmName}</h1>
        <p className="mt-1 text-xs text-muted-foreground tracking-wider">
          <span className="text-primary/80">{t('guardianLabel', { bossName })}</span>
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {missions.map((mission, index) => {
          const diffStyle = DIFFICULTY_BADGE[mission.difficulty];
          return (
            <div key={mission.id} className={[
              'flex items-start gap-3 rounded-xl border p-4 transition-all',
              mission.isBoss
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-primary/20 bg-card/60',
            ].join(' ')}>
              <div className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold',
                mission.isBoss ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary',
              ].join(' ')} aria-hidden>
                {mission.isBoss ? <Crown className="h-3.5 w-3.5" aria-hidden /> : index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="font-display text-xs uppercase tracking-wider text-foreground">{mission.title}</h3>
                  <span className={['rounded-full border px-1.5 py-0.5 text-[9px] tracking-wider', diffStyle].join(' ')}>
                    {t(`difficulty${mission.difficulty}` as 'difficultyApprentice' | 'difficultyAdept' | 'difficultyMaster' | 'difficultyLegendary')}
                  </span>
                  {mission.isBoss && (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] tracking-wider text-amber-400">{t('bossBadge')}</span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{mission.description}</p>
              </div>
              <Link href={`/m/g/campaign/${slug}/battle/${mission.id}`} className="shrink-0">
                <GameButton variant={mission.isBoss ? 'gold' : 'primary'} size="sm">
                  {mission.isBoss ? (
                    <><Crown className="h-3 w-3" aria-hidden />{t('challengeCta')}</>
                  ) : t('beginMissionCta')}
                </GameButton>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-center">
        <Link href={`/m/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="sm">{t('openAcademy')}</GameButton>
        </Link>
      </div>
    </Scene>
  );
}
