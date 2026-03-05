'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { QuickPromptCards } from '@/components/mobile/QuickPromptCards';
import { AiAssistantChat } from '@/components/mobile/AiAssistantChat';

/**
 * Mobile AI Lab page — dedicated AI assistant with full-screen chat interface.
 * Provides quick prompt suggestions and streaming AI responses.
 * Reuses the existing streamPrompt SSE generator from api-client.ts.
 */
export default function MobileAiLabPage() {
  const t = useTranslations('MobileAi');
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);

  /**
   * Handle quick prompt card selection.
   * @param prompt - The selected prompt text
   */
  function handlePromptSelect(prompt: string): void {
    setPendingPrompt(prompt);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <h1 className="text-xl font-bold text-foreground">{t('title')}</h1>
      <p className="mt-1 text-xs text-muted-foreground">{t('subtitle')}</p>

      {/* Quick prompt suggestions */}
      <div className="mt-3">
        <QuickPromptCards onSelect={handlePromptSelect} />
      </div>

      {/* Chat interface */}
      <AiAssistantChat
        className="mt-3 flex-1"
        initialPrompt={pendingPrompt}
        onInitialPromptConsumed={() => setPendingPrompt(undefined)}
      />
    </div>
  );
}
