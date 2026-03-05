'use client';

import { type FC } from 'react';
import { Sparkles } from 'lucide-react';
import { useAiAssistantStore } from '@/stores/ai-assistant-store';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

/**
 * Floating Action Button for the mobile AI assistant.
 * Appears on all mobile screens for child users, toggles the AI chat overlay.
 * Positioned above the bottom tab bar with a sparkle icon.
 *
 * Only renders for child role (AI assistant is a learning tool).
 */
export const AiFab: FC = () => {
  const { user } = useAuth();
  const { isOpen, toggle, isStreaming } = useAiAssistantStore();

  /* Only show for child users */
  if (user?.role !== 'child') return null;

  return (
    <button
      onClick={toggle}
      aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      className={cn(
        'fixed bottom-[4.5rem] right-4 z-50',
        'flex h-14 w-14 items-center justify-center',
        'rounded-full shadow-lg transition-all duration-200',
        'active:scale-95',
        isOpen
          ? 'bg-muted text-muted-foreground'
          : 'bg-primary text-primary-foreground',
        isStreaming && 'animate-pulse',
      )}
    >
      <Sparkles
        className={cn(
          'h-6 w-6 transition-transform duration-200',
          isOpen && 'rotate-45',
        )}
        aria-hidden="true"
      />
    </button>
  );
};
