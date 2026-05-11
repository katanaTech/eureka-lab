'use client';

/**
 * AiTutorChat — Phase 16 Sprint B mock implementation.
 *
 * SECURITY NOTICE (CLAUDE.md rules #1, #4, #12):
 * The current implementation uses canned/mock responses only.
 * When wiring to the real AI gateway:
 *   1. ALL AI calls MUST go through the NestJS backend gateway — NEVER call
 *      Anthropic or any AI API directly from this component.
 *   2. All AI responses MUST pass through the server-side moderation pipeline
 *      before being displayed.
 *   3. No child PII (name, age, school) may appear in prompts sent externally.
 *
 * TODO (Sprint C): Replace CANNED_REPLIES with a POST /api/v1/tutor/chat call.
 * TODO (Sprint C): Sanitize server responses with a DOMPurify-equivalent before
 *                  rendering — even though we control the source, defence-in-depth
 *                  is required per OWASP XSS guidelines.
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameButton } from './GameButton';

interface Message {
  id: string;
  role: 'user' | 'tutor';
  text: string;
}

/** Pre-defined tutor responses for Phase 16 Sprint B (mock mode). */
const CANNED_REPLIES: string[] = [
  "Great question! In AI, a prompt is an instruction you give to the model. The clearer your prompt, the better the result.",
  "Think of me as your AI guide! I can help you understand how to write better prompts and evaluate AI outputs.",
  "That's a really important concept. Context is key — the more relevant background you provide, the smarter the AI's answer.",
  "You're making great progress! Remember: AI is a tool, not magic. Your thinking guides it.",
  "Let's explore that idea together. What do you already know about how AI processes text?",
  "Excellent thinking! Breaking complex problems into smaller steps is exactly how AI engineers work.",
];

/** Returns a deterministic canned reply based on the number of messages so far. */
function getCannedReply(messageCount: number): string {
  return CANNED_REPLIES[messageCount % CANNED_REPLIES.length];
}

interface AiTutorChatProps {
  /** Additional class names for the root container */
  className?: string;
}

/**
 * Floating AI tutor chat widget with canned responses (Phase 16 Sprint B).
 * Renders a toggle button that expands to a chat panel.
 *
 * @param props.className - Optional extra CSS classes
 * @returns A floating chat toggle and expandable chat panel
 */
export function AiTutorChat({ className }: AiTutorChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'tutor',
      text: "Hello, young explorer! I'm your AI tutor. Ask me anything about AI, prompts, or your quest!",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** Scroll the message list to the bottom after each new message. */
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  /**
   * Send the current input as a user message and simulate a tutor reply.
   */
  function handleSend() {
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate network latency for the mock tutor reply
    setTimeout(() => {
      const tutorMessage: Message = {
        id: `tutor-${Date.now()}`,
        role: 'tutor',
        // NOTE: canned server-controlled text — safe to render as text nodes.
        // When real AI responses arrive, sanitize before render (see TODO above).
        text: getCannedReply(messages.length),
      };
      setMessages((prev) => [...prev, tutorMessage]);
      setIsTyping(false);
    }, 900);
  }

  /**
   * Handle Enter key in the input to submit the message.
   *
   * @param e - Keyboard event from the input field
   */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={cn('fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2', className)}>
      {/* Chat panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="AI Tutor Chat"
          className="panel flex h-[420px] w-80 flex-col overflow-hidden rounded-xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 bg-primary/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" aria-hidden />
              <span className="font-display text-sm text-glow-primary">AI TUTOR</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Tutor Chat"
              className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'mr-auto bg-muted text-foreground'
                )}
              >
                {/* Render as plain text — no dangerouslySetInnerHTML.
                    When real AI responses arrive, use a sanitized markdown renderer. */}
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <span aria-live="polite" aria-label="Tutor is typing">
                  ···
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2 border-t border-border/40 p-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your tutor…"
              aria-label="Chat input"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <GameButton
              variant="primary"
              size="sm"
              onClick={handleSend}
              aria-label="Send message"
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="h-4 w-4" aria-hidden />
            </GameButton>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close AI Tutor Chat' : 'Open AI Tutor Chat'}
        aria-expanded={isOpen}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MessageSquare className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
