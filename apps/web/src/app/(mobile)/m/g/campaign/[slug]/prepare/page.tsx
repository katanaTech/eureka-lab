'use client';

/**
 * Mobile prepare page — Academy hub for a campaign realm.
 * Mirrors desktop /g/campaign/[slug]/prepare with compact layout.
 * Imports tab panels from the desktop prepare-panels (no /g/ links in them).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ZONE_BY_CAMPAIGN_SLUG,
  REALM_NAME_BY_ZONE,
  type ZoneId,
} from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton, KpBadge, AiTutorChat } from '@/components/game/fantasy';
import { cn } from '@/lib/utils';
import {
  LessonsTab,
  ShortsTab,
  ForgeTab,
} from '@/app/(game)/g/campaign/[slug]/prepare/prepare-panels';

type TabId = 'lessons' | 'shorts' | 'tutor' | 'forge';

const TABS: { id: TabId; label: string }[] = [
  { id: 'lessons', label: '📖 Lessons' },
  { id: 'shorts', label: '🎬 Shorts' },
  { id: 'tutor', label: '🤖 Tutor' },
  { id: 'forge', label: '⚔️ Forge' },
];

/**
 * Mobile prepare / Academy page for a campaign realm.
 * Compact layout with /m/g/ navigation links.
 *
 * @returns The mobile prepare page
 */
export default function MobilePreparePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('lessons');

  const slug = params.slug ?? '';
  const zoneId: ZoneId | undefined = ZONE_BY_CAMPAIGN_SLUG[slug];

  useEffect(() => {
    if (!zoneId) router.replace('/m/g/dashboard');
  }, [zoneId, router]);

  if (!zoneId) return null;

  const realmName = REALM_NAME_BY_ZONE[zoneId];

  return (
    <Scene className="min-h-screen px-4 pb-20 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Logo withText={false} />
        <div className="flex items-center gap-2">
          <KpBadge />
          <Link href={`/m/g/campaign/${slug}`}>
            <GameButton variant="ghost" size="sm">← {realmName}</GameButton>
          </Link>
        </div>
      </header>

      <div className="mt-6 text-center">
        <h1 className="font-display text-2xl uppercase tracking-widest text-glow-primary">Academy</h1>
        <p className="mt-1 text-xs text-muted-foreground tracking-wider">{realmName}</p>
      </div>

      <nav aria-label="Academy tabs" className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id} role="tab"
            className={cn(
              'shrink-0 rounded-lg border px-3 py-1.5 text-[10px] font-display tracking-wider uppercase transition-all',
              activeTab === tab.id
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        {activeTab === 'lessons' && <LessonsTab zoneId={zoneId} />}
        {activeTab === 'shorts' && <ShortsTab zoneId={zoneId} />}
        {activeTab === 'tutor' && (
          <div className="relative min-h-[300px]">
            <p className="mb-3 text-xs text-muted-foreground text-center">
              Ask your AI tutor about <span className="text-primary">{realmName}</span>.
            </p>
            <AiTutorChat />
          </div>
        )}
        {activeTab === 'forge' && <ForgeTab />}
      </div>
    </Scene>
  );
}
