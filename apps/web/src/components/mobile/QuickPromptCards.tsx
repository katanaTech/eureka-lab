'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface QuickPromptCardsProps {
  /** Callback when a prompt suggestion is tapped */
  onSelect: (prompt: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Horizontal scrollable row of quick prompt suggestion cards.
 * Provides contextual AI prompt starters for the AI Lab.
 *
 * @param onSelect - Callback fired when a suggestion is tapped
 * @param className - Additional CSS classes
 */
export const QuickPromptCards: FC<QuickPromptCardsProps> = ({ onSelect, className }) => {
  const t = useTranslations('MobileAi');

  const suggestions = [
    { key: 'explainAi', emoji: '🤖' },
    { key: 'helpPrompt', emoji: '💡' },
    { key: 'checkWork', emoji: '✅' },
    { key: 'giveHint', emoji: '🔍' },
    { key: 'funFact', emoji: '🎯' },
    { key: 'challenge', emoji: '⚡' },
  ];

  return (
    <div
      className={cn('flex gap-2 overflow-x-auto pb-2 scrollbar-none', className)}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {suggestions.map(({ key, emoji }) => (
        <button
          key={key}
          onClick={() => onSelect(t(key))}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent active:scale-95"
        >
          <span aria-hidden="true">{emoji}</span>
          <span>{t(key)}</span>
        </button>
      ))}
    </div>
  );
};
