'use client';

import { type FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAiAssistantStore } from '@/stores/ai-assistant-store';

interface AiSuggestionChipsProps {
  /** Callback when a suggestion is tapped */
  onSelect: (text: string) => void;
}

/** Suggestion chip definition */
interface SuggestionChip {
  /** i18n key for the label */
  key: string;
  /** Emoji icon */
  emoji: string;
}

/** Context-based suggestion sets keyed by route prefix */
const ROUTE_SUGGESTIONS: Record<string, SuggestionChip[]> = {
  '/m/learn': [
    { key: 'learnHint', emoji: '💡' },
    { key: 'learnExplain', emoji: '📚' },
    { key: 'learnCheck', emoji: '✅' },
    { key: 'learnNext', emoji: '🚀' },
  ],
  '/m/progress': [
    { key: 'progressImprove', emoji: '📈' },
    { key: 'progressBadge', emoji: '🏆' },
    { key: 'progressStreak', emoji: '🔥' },
  ],
  '/m/ai': [
    { key: 'aiExplain', emoji: '🤖' },
    { key: 'aiPromptHelp', emoji: '✏️' },
    { key: 'aiFunFact', emoji: '🎲' },
    { key: 'aiChallenge', emoji: '⚡' },
  ],
  '/m': [
    { key: 'homeGoal', emoji: '🎯' },
    { key: 'homeChallenge', emoji: '⚡' },
    { key: 'homeWhat', emoji: '🤔' },
  ],
};

/** Default suggestions when no route matches */
const DEFAULT_SUGGESTIONS: SuggestionChip[] = [
  { key: 'defaultHelp', emoji: '💡' },
  { key: 'defaultExplain', emoji: '🤖' },
  { key: 'defaultChallenge', emoji: '⚡' },
];

/**
 * Context-aware suggestion chips for the AI assistant overlay.
 * Shows different suggestions based on the user's current route.
 *
 * @param onSelect - Callback when a chip is tapped
 */
export const AiSuggestionChips: FC<AiSuggestionChipsProps> = ({ onSelect }) => {
  const t = useTranslations('AiAssistant');
  const context = useAiAssistantStore((s) => s.context);

  /** Select suggestions based on current route */
  const chips = useMemo(() => {
    for (const [prefix, suggestions] of Object.entries(ROUTE_SUGGESTIONS)) {
      if (context.currentRoute.startsWith(prefix) && prefix !== '/m') {
        return suggestions;
      }
    }
    /* Check exact /m match for home */
    if (context.currentRoute === '/m') {
      return ROUTE_SUGGESTIONS['/m'] ?? DEFAULT_SUGGESTIONS;
    }
    return DEFAULT_SUGGESTIONS;
  }, [context.currentRoute]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => onSelect(t(chip.key))}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors active:bg-muted"
        >
          <span aria-hidden="true">{chip.emoji}</span>
          <span className="whitespace-nowrap">{t(chip.key)}</span>
        </button>
      ))}
    </div>
  );
};
