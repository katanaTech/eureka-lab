'use client';

import { type FC, useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Send, Loader2, Sparkles, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAiAssistantStore } from '@/stores/ai-assistant-store';
import { AiSuggestionChips } from './AiSuggestionChips';
import { cn } from '@/lib/utils';

/**
 * Full-screen AI chat overlay for the mobile assistant.
 * Slides up from the bottom when FAB is tapped.
 * Includes suggestion chips, message history, and streaming input.
 */
export const AiChatOverlay: FC = () => {
  const t = useTranslations('AiAssistant');
  const {
    isOpen,
    close,
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
  } = useAiAssistantStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Focus input when overlay opens */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  /**
   * Handle sending a message.
   * @param text - Message text
   */
  function handleSend(text?: string): void {
    const msg = text ?? input;
    if (!msg.trim() || isStreaming) return;
    sendMessage(msg);
    setInput('');
  }

  /**
   * Handle Enter key to submit.
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              aria-label={t('clearChat')}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label={t('close')}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-10 w-10 text-primary/50" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{t('welcomeMessage')}</p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-2',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground',
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content || '...'}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestion chips */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <AiSuggestionChips onSelect={(text) => handleSend(text)} />
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border px-4 py-3 pb-safe">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder')}
            rows={1}
            className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isStreaming}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            className="shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
