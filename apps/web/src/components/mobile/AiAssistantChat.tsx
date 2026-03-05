'use client';

import { type FC, useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Loader2, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { streamPrompt } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/** Chat message structure */
interface ChatMessage {
  /** Message sender role */
  role: 'user' | 'assistant';
  /** Message text content */
  content: string;
  /** ISO timestamp */
  timestamp: string;
}

interface AiAssistantChatProps {
  /** Initial prompt to send (e.g., from quick prompt cards) */
  initialPrompt?: string;
  /** Callback when initial prompt is consumed */
  onInitialPromptConsumed?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Full-screen AI chat interface for the mobile AI Lab.
 * Supports streaming responses, message history, and quick prompt injection.
 *
 * @param initialPrompt - Optional prompt to automatically send
 * @param onInitialPromptConsumed - Callback when initial prompt has been sent
 * @param className - Additional CSS classes
 */
export const AiAssistantChat: FC<AiAssistantChatProps> = ({
  initialPrompt,
  onInitialPromptConsumed,
  className,
}) => {
  const t = useTranslations('MobileAi');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-scroll to bottom when messages change */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Handle initial prompt injection */
  useEffect(() => {
    if (initialPrompt && !isStreaming) {
      sendMessage(initialPrompt);
      onInitialPromptConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  /**
   * Send a message and stream the AI response.
   * @param text - Message text to send
   */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    /** Placeholder for streaming assistant response */
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const stream = streamPrompt({
        moduleId: 'assistant',
        prompt: trimmed,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.content) {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: last.content + chunk.content };
            }
            return updated;
          });
        }
        if (chunk.type === 'error') {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: chunk.message ?? t('errorGeneric') };
            }
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content: t('errorGeneric') };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, t]);

  /**
   * Handle form submission.
   */
  function handleSubmit(): void {
    sendMessage(input);
  }

  /**
   * Handle Enter key to submit (Shift+Enter for newline).
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Messages area */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-10 w-10 text-primary/50" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{t('welcomeMessage')}</p>
          </div>
        )}

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

      {/* Input area */}
      <div className="mt-3 flex items-end gap-2 border-t border-border pt-3">
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
          onClick={handleSubmit}
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
  );
};
