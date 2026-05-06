'use client';

/**
 * Prepare page — Boss preview / Academy hub for a campaign realm.
 * Provides 4 tabs: Lessons, Shorts (videos), AI Tutor, and Forge (shop).
 *
 * Route: /g/campaign/[slug]/prepare
 * Sub-components are in ./prepare-panels.tsx (CLAUDE.md rule #8 — 300 line limit).
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
import { LessonsTab, ShortsTab, ForgeTab } from './prepare-panels';

// ── Tab definition ────────────────────────────────────────────────────────────

/** Available tab identifiers for the Academy page. */
type TabId = 'lessons' | 'shorts' | 'tutor' | 'forge';

const TABS: { id: TabId; label: string }[] = [
  { id: 'lessons', label: '📖 Lessons' },
  { id: 'shorts', label: '🎬 Shorts' },
  { id: 'tutor', label: '🤖 AI Tutor' },
  { id: 'forge', label: '⚔️ Forge' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

/**
 * Prepare / Academy page for a campaign realm.
 * Reads the slug from URL params and resolves the ZoneId, then renders
 * a 4-tab Academy interface.
 *
 * @returns The full-screen prepare page, or null while redirecting
 */
export default function PreparePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('lessons');

  const slug = params.slug ?? '';
  const zoneId: ZoneId | undefined = ZONE_BY_CAMPAIGN_SLUG[slug];

  useEffect(() => {
    if (!zoneId) {
      router.replace('/g/dashboard');
    }
  }, [zoneId, router]);

  if (!zoneId) return null;

  const realmName = REALM_NAME_BY_ZONE[zoneId];

  return (
    <Scene className="min-h-screen px-4 py-6">
      {/* Header */}
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Logo withText={false} />
        <div className="flex items-center gap-3">
          <KpBadge />
          <Link href={`/g/campaign/${slug}`}>
            <GameButton variant="ghost" size="sm">← {realmName}</GameButton>
          </Link>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto mt-8 max-w-3xl text-center">
        <h1 className="font-display text-3xl uppercase tracking-widest text-glow-primary">
          Academy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground tracking-wider">{realmName}</p>
      </div>

      {/* Tab bar */}
      <nav
        aria-label="Academy tabs"
        className="mx-auto mt-6 max-w-3xl flex gap-2 overflow-x-auto pb-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
            className={cn(
              'shrink-0 rounded-lg border px-4 py-2 text-xs font-display tracking-wider uppercase transition-all',
              activeTab === tab.id
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className="mx-auto mt-6 max-w-3xl">
        {activeTab === 'lessons' && <LessonsTab zoneId={zoneId} />}
        {activeTab === 'shorts' && <ShortsTab zoneId={zoneId} />}
        {activeTab === 'tutor' && (
          <div className="relative min-h-[400px]">
            <p className="mb-4 text-sm text-muted-foreground text-center">
              Ask your AI tutor anything about{' '}
              <span className="text-primary">{realmName}</span>.
            </p>
            <AiTutorChat />
          </div>
        )}
        {activeTab === 'forge' && <ForgeTab />}
      </div>
    </Scene>
  );
}
