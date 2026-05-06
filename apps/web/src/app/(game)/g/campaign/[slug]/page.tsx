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

// ── Placeholder mission data ─────────────────────────────────────────────────

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
    {
      id: 'lib-1',
      title: 'Prompt Basics',
      difficulty: 'Apprentice',
      description:
        'Learn to craft your first clear, effective AI prompt. Discover why context matters.',
      isBoss: false,
    },
    {
      id: 'lib-2',
      title: 'Context Mastery',
      difficulty: 'Adept',
      description:
        'Provide rich context to shape AI responses. Unlock the power of role and background.',
      isBoss: false,
    },
    {
      id: 'lib-3',
      title: 'Hallucination Hunt',
      difficulty: 'Master',
      description:
        'Train your eye to spot AI confabulations. Learn to verify and challenge AI claims.',
      isBoss: false,
    },
    {
      id: 'lib-boss',
      title: 'Babble Whisperer',
      difficulty: 'Legendary',
      description:
        'Face the guardian of the Isle of Whispers. Only a master prompter can silence its noise.',
      isBoss: true,
    },
  ],
  forge: [
    {
      id: 'forge-1',
      title: 'Trigger & Action',
      difficulty: 'Apprentice',
      description:
        'Build your first AI workflow with a trigger event and an automated action.',
      isBoss: false,
    },
    {
      id: 'forge-2',
      title: 'Multi-Step Chains',
      difficulty: 'Adept',
      description:
        'Link multiple AI steps together so the output of one feeds the next.',
      isBoss: false,
    },
    {
      id: 'forge-3',
      title: 'Error Handling',
      difficulty: 'Master',
      description:
        'Design workflows that gracefully handle unexpected AI outputs.',
      isBoss: false,
    },
    {
      id: 'forge-boss',
      title: 'Babble Drone',
      difficulty: 'Legendary',
      description:
        'Battle the Forge of Echoes guardian. Only a master workflow architect can defeat it.',
      isBoss: true,
    },
  ],
  citadel: [
    {
      id: 'cit-1',
      title: 'Code Reading',
      difficulty: 'Apprentice',
      description:
        'Understand AI-generated code — identify variables, functions, and flow.',
      isBoss: false,
    },
    {
      id: 'cit-2',
      title: 'Bug Squashing',
      difficulty: 'Adept',
      description:
        'Use AI as a debugger. Learn to describe bugs clearly and interpret fixes.',
      isBoss: false,
    },
    {
      id: 'cit-3',
      title: 'Feature Building',
      difficulty: 'Master',
      description:
        'Guide AI to extend an existing mini-app with a new feature.',
      isBoss: false,
    },
    {
      id: 'cit-boss',
      title: 'Babble Glitch',
      difficulty: 'Legendary',
      description:
        'Confront the corrupted guardian of the Citadel of Glitches. Fix the AI—before it breaks you.',
      isBoss: true,
    },
  ],
  academy: [
    {
      id: 'aca-1',
      title: 'Agent Persona',
      difficulty: 'Apprentice',
      description:
        'Define a personality and purpose for your very own AI agent.',
      isBoss: false,
    },
    {
      id: 'aca-2',
      title: 'Memory Design',
      difficulty: 'Adept',
      description:
        'Give your agent persistent context so it remembers past conversations.',
      isBoss: false,
    },
    {
      id: 'aca-3',
      title: 'Tool Integration',
      difficulty: 'Master',
      description:
        'Connect your agent to external tools: search, calendar, or homework helper.',
      isBoss: false,
    },
    {
      id: 'aca-boss',
      title: 'Babble Wraith',
      difficulty: 'Legendary',
      description:
        'Face the wraith that haunts the Academy. Prove your agent design can outlast it.',
      isBoss: true,
    },
  ],
};

const DIFFICULTY_BADGE_STYLE: Record<MissionDifficulty, string> = {
  Apprentice: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  Adept: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  Master: 'border-violet-500/40 text-violet-400 bg-violet-500/10',
  Legendary: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Campaign detail page — shows the mission list for a specific realm isle.
 * Resolves the URL slug to a ZoneId, then renders placeholder missions.
 *
 * @returns The campaign mission-list screen
 */
export default function CampaignPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useTranslations('Phase16Campaign');

  const slug = params.slug ?? '';
  const zoneId: ZoneId | undefined = ZONE_BY_CAMPAIGN_SLUG[slug];

  // Redirect to dashboard if slug is invalid
  useEffect(() => {
    if (!zoneId) {
      router.replace('/g/dashboard');
    }
  }, [zoneId, router]);

  if (!zoneId) return null;

  const realmName = REALM_NAME_BY_ZONE[zoneId];
  const bossName = REALM_BOSS_NAME_BY_ZONE[zoneId];
  const missions = PLACEHOLDER_MISSIONS[zoneId];

  return (
    <Scene className="min-h-screen px-4 py-6">
      {/* Top HUD */}
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Logo withText={false} />
        <div className="flex items-center gap-3">
          <KpBadge />
          <Link href="/g/dashboard">
            <GameButton variant="ghost" size="sm">
              {t('backRealmMap')}
            </GameButton>
          </Link>
        </div>
      </header>

      {/* Realm title */}
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <h1 className="font-display text-4xl uppercase tracking-widest text-glow-primary">
          {realmName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tracking-wider">
          <span className="text-primary/80">{t('guardianLabel', { bossName })}</span>
        </p>
      </div>

      {/* Mission list */}
      <div className="mx-auto mt-8 max-w-3xl flex flex-col gap-4">
        {missions.map((mission, index) => (
          <MissionCard
            key={mission.id}
            number={index + 1}
            mission={mission}
            slug={slug}
            difficultyLabel={t(`difficulty${mission.difficulty}` as
              | 'difficultyApprentice'
              | 'difficultyAdept'
              | 'difficultyMaster'
              | 'difficultyLegendary')}
            bossBadge={t('bossBadge')}
            challengeCta={t('challengeCta')}
            beginMissionCta={t('beginMissionCta')}
          />
        ))}
      </div>

      {/* Open Academy button */}
      <div className="mx-auto mt-8 max-w-3xl flex justify-center">
        <Link href={`/g/campaign/${slug}/prepare`}>
          <GameButton variant="ghost" size="md">
            {t('openAcademy')}
          </GameButton>
        </Link>
      </div>
    </Scene>
  );
}

// ── MissionCard sub-component ─────────────────────────────────────────────────

interface MissionCardProps {
  number: number;
  mission: PlaceholderMission;
  slug: string;
  /** Pre-translated difficulty badge text */
  difficultyLabel: string;
  /** Pre-translated boss badge text */
  bossBadge: string;
  /** Pre-translated CTA for boss missions */
  challengeCta: string;
  /** Pre-translated CTA for non-boss missions */
  beginMissionCta: string;
}

/**
 * Individual mission card inside a campaign.
 *
 * @param props.number - Display number for the mission
 * @param props.mission - Mission data
 * @param props.slug - Campaign URL slug (for building the battle link)
 * @param props.difficultyLabel - Translated difficulty badge text
 * @param props.bossBadge - Translated boss badge text
 * @param props.challengeCta - Translated CTA for boss missions
 * @param props.beginMissionCta - Translated CTA for normal missions
 * @returns A styled mission card with title, difficulty badge, and action button
 */
function MissionCard({
  number,
  mission,
  slug,
  difficultyLabel,
  bossBadge,
  challengeCta,
  beginMissionCta,
}: MissionCardProps) {
  const difficultyStyle = DIFFICULTY_BADGE_STYLE[mission.difficulty];

  return (
    <div
      className={[
        'flex items-start gap-4 rounded-xl border p-5 transition-all',
        mission.isBoss
          ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70'
          : 'border-primary/20 bg-card/60 hover:border-primary/40',
      ].join(' ')}
    >
      {/* Number badge */}
      <div
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold',
          mission.isBoss
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-primary/20 text-primary',
        ].join(' ')}
        aria-hidden
      >
        {mission.isBoss ? <Crown className="h-4 w-4" aria-hidden /> : number}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            {mission.title}
          </h3>
          <span
            className={[
              'rounded-full border px-2 py-0.5 text-[10px] tracking-wider',
              difficultyStyle,
            ].join(' ')}
          >
            {difficultyLabel}
          </span>
          {mission.isBoss && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] tracking-wider text-amber-400">
              {bossBadge}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{mission.description}</p>
      </div>

      {/* CTA */}
      <div className="shrink-0">
        <Link href={`/g/campaign/${slug}/battle/${mission.id}`}>
          <GameButton
            variant={mission.isBoss ? 'gold' : 'primary'}
            size="sm"
          >
            {mission.isBoss ? (
              <>
                <Crown className="h-3 w-3" aria-hidden />
                {challengeCta}
              </>
            ) : (
              beginMissionCta
            )}
          </GameButton>
        </Link>
      </div>
    </div>
  );
}
