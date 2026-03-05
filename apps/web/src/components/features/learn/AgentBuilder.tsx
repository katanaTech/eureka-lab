'use client';

/**
 * AgentBuilder — Agent configuration + chat testing for Level 4: Buddy Agents.
 * Multi-view layout:
 *  - View 1: Template picker (grid of 3 agent templates)
 *  - View 2: Agent config (persona editor) + live chat tester
 *
 * @module AgentBuilder
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/stores/agent-store';
import {
  AGENT_TEMPLATES,
  findAgentTemplateById,
} from '@eureka-lab/shared-types';
import type { AgentPersona, AgentTemplate } from '@eureka-lab/shared-types';

/** Props for the AgentBuilder component */
interface AgentBuilderProps {
  /** Module ID for progress tracking */
  moduleId: string;
  /** Activity index within the module */
  activityIndex: number;
  /** Template ID to initialize from (optional) */
  templateId?: string;
  /** Callback when the activity is completed */
  onComplete?: () => void;
}

/**
 * AgentBuilder component — the main agent building experience for Level 4.
 */
export function AgentBuilder({
  moduleId,
  activityIndex,
  templateId,
  onComplete,
}: AgentBuilderProps) {
  const t = useTranslations('Learn');

  const {
    currentAgent,
    isChatting,
    streamingText,
    chatHistory,
    isLoading,
    isSaving,
    error,
    createAgent,
    updateAgent,
    sendMessage,
    clearChat,
  } = useAgentStore();

  /* View: 'templates' or 'builder' */
  const hasAgent = currentAgent !== null;

  if (!hasAgent) {
    return (
      <TemplatePicker
        templateId={templateId}
        onSelect={async (template) => {
          await createAgent(
            template.name,
            template.description,
            template.id,
            template.defaultPersona,
          );
        }}
        isLoading={isLoading}
        t={t}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{currentAgent.name}</h3>
          <p className="text-sm text-muted-foreground">{currentAgent.description}</p>
        </div>
        {onComplete && (
          <button
            onClick={onComplete}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('completeAgent')}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Split layout: Persona editor (left) + Chat tester (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <PersonaEditor
          persona={currentAgent.persona}
          onSave={async (persona) => {
            await updateAgent({ persona });
          }}
          isSaving={isSaving}
          t={t}
        />
        <ChatTester
          chatHistory={chatHistory}
          streamingText={streamingText}
          isChatting={isChatting}
          onSend={sendMessage}
          onClear={clearChat}
          agentName={currentAgent.persona.name}
          t={t}
        />
      </div>
    </div>
  );
}

/* ── Template Picker ─────────────────────────────────────────────── */

/** Props for the TemplatePicker sub-component */
interface TemplatePickerProps {
  /** Pre-selected template ID */
  templateId?: string;
  /** Called when a template is selected */
  onSelect: (template: AgentTemplate) => Promise<void>;
  /** Whether creation is in progress */
  isLoading: boolean;
  /** i18n translation function */
  t: ReturnType<typeof useTranslations>;
}

/** Category badge colours */
const CATEGORY_COLOURS: Record<string, string> = {
  learning: 'bg-blue-100 text-blue-800',
  creativity: 'bg-purple-100 text-purple-800',
  science: 'bg-green-100 text-green-800',
  general: 'bg-gray-100 text-gray-800',
};

/**
 * Grid of agent templates for the child to pick from.
 */
function TemplatePicker({ templateId, onSelect, isLoading, t }: TemplatePickerProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h3 className="text-xl font-bold">{t('createAgent')}</h3>
        <p className="text-muted-foreground mt-1">
          Choose a template to start building your agent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {AGENT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            disabled={isLoading}
            className={cn(
              'flex flex-col gap-3 p-5 rounded-xl border-2 text-left transition-all',
              'hover:border-primary hover:shadow-md',
              isLoading && 'opacity-50 cursor-not-allowed',
              templateId === template.id
                ? 'border-primary bg-primary/5'
                : 'border-border',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {template.category === 'learning' ? '📚' : template.category === 'creativity' ? '✍️' : '🔬'}
              </span>
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  CATEGORY_COLOURS[template.category] ?? CATEGORY_COLOURS.general,
                )}
              >
                {template.category}
              </span>
            </div>
            <h4 className="font-semibold">{template.name}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {template.description}
            </p>
            <div className="mt-auto pt-2">
              <span className="text-xs text-muted-foreground">
                Try: &quot;{template.sampleConversation[0]}&quot;
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Persona Editor ──────────────────────────────────────────────── */

/** Props for the PersonaEditor sub-component */
interface PersonaEditorProps {
  /** Current persona values */
  persona: AgentPersona;
  /** Save callback */
  onSave: (persona: AgentPersona) => Promise<void>;
  /** Whether save is in progress */
  isSaving: boolean;
  /** i18n translation function */
  t: ReturnType<typeof useTranslations>;
}

/**
 * Form for editing an agent's persona: name, personality, knowledge, goals, guardrails.
 */
function PersonaEditor({ persona, onSave, isSaving, t }: PersonaEditorProps) {
  const [local, setLocal] = useState<AgentPersona>(persona);
  const [dirty, setDirty] = useState(false);

  /** Update a scalar field */
  const updateField = useCallback(
    (field: keyof AgentPersona, value: string) => {
      setLocal((prev) => ({ ...prev, [field]: value }));
      setDirty(true);
    },
    [],
  );

  /** Update an array item */
  const updateArrayItem = useCallback(
    (field: 'goals' | 'guardrails', index: number, value: string) => {
      setLocal((prev) => {
        const arr = [...prev[field]];
        arr[index] = value;
        return { ...prev, [field]: arr };
      });
      setDirty(true);
    },
    [],
  );

  /** Add an array item */
  const addArrayItem = useCallback(
    (field: 'goals' | 'guardrails') => {
      setLocal((prev) => {
        if (prev[field].length >= 5) return prev;
        return { ...prev, [field]: [...prev[field], ''] };
      });
      setDirty(true);
    },
    [],
  );

  /** Remove an array item */
  const removeArrayItem = useCallback(
    (field: 'goals' | 'guardrails', index: number) => {
      setLocal((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
      setDirty(true);
    },
    [],
  );

  /** Handle save */
  const handleSave = useCallback(async () => {
    await onSave(local);
    setDirty(false);
  }, [local, onSave]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border bg-card overflow-y-auto">
      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        {t('agentPersona')}
      </h4>

      {/* Agent Name */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t('agentName')}</span>
        <input
          type="text"
          value={local.name}
          onChange={(e) => updateField('name', e.target.value)}
          maxLength={50}
          className="px-3 py-2 rounded-lg border text-sm bg-background"
        />
      </label>

      {/* System Prompt / Personality */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t('agentPersona')}</span>
        <textarea
          value={local.systemPrompt}
          onChange={(e) => updateField('systemPrompt', e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t('agentPersonaPlaceholder')}
          className="px-3 py-2 rounded-lg border text-sm bg-background resize-none"
        />
        <span className="text-xs text-muted-foreground text-right">
          {local.systemPrompt.length}/500
        </span>
      </label>

      {/* Knowledge Base */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t('agentKnowledge')}</span>
        <textarea
          value={local.knowledgeBase}
          onChange={(e) => updateField('knowledgeBase', e.target.value)}
          maxLength={500}
          rows={2}
          placeholder={t('agentKnowledgePlaceholder')}
          className="px-3 py-2 rounded-lg border text-sm bg-background resize-none"
        />
      </label>

      {/* Goals */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t('agentGoals')}</span>
        <span className="text-xs text-muted-foreground">{t('agentGoalsDesc')}</span>
        {local.goals.map((goal, i) => (
          <div key={`goal-${i}`} className="flex gap-2">
            <input
              type="text"
              value={goal}
              onChange={(e) => updateArrayItem('goals', i, e.target.value)}
              maxLength={200}
              className="flex-1 px-3 py-1.5 rounded-lg border text-sm bg-background"
            />
            <button
              onClick={() => removeArrayItem('goals', i)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              {t('removeItem')}
            </button>
          </div>
        ))}
        {local.goals.length < 5 && (
          <button
            onClick={() => addArrayItem('goals')}
            className="text-xs text-primary hover:underline self-start"
          >
            {t('addGoal')}
          </button>
        )}
      </div>

      {/* Guardrails */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t('agentGuardrails')}</span>
        <span className="text-xs text-muted-foreground">{t('agentGuardrailsDesc')}</span>
        {local.guardrails.map((rule, i) => (
          <div key={`rule-${i}`} className="flex gap-2">
            <input
              type="text"
              value={rule}
              onChange={(e) => updateArrayItem('guardrails', i, e.target.value)}
              maxLength={200}
              className="flex-1 px-3 py-1.5 rounded-lg border text-sm bg-background"
            />
            <button
              onClick={() => removeArrayItem('guardrails', i)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              {t('removeItem')}
            </button>
          </div>
        ))}
        {local.guardrails.length < 5 && (
          <button
            onClick={() => addArrayItem('guardrails')}
            className="text-xs text-primary hover:underline self-start"
          >
            {t('addGuardrail')}
          </button>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!dirty || isSaving}
        className={cn(
          'mt-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
          dirty
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed',
        )}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

/* ── Chat Tester ─────────────────────────────────────────────────── */

/** Props for the ChatTester sub-component */
interface ChatTesterProps {
  /** Chat history messages */
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  /** Currently streaming text (partial response) */
  streamingText: string;
  /** Whether a response is being generated */
  isChatting: boolean;
  /** Send a message callback */
  onSend: (message: string) => Promise<void>;
  /** Clear chat callback */
  onClear: () => void;
  /** Agent persona name */
  agentName: string;
  /** i18n translation function */
  t: ReturnType<typeof useTranslations>;
}

/**
 * Chat interface for testing the agent with live SSE streaming.
 */
function ChatTester({
  chatHistory,
  streamingText,
  isChatting,
  onSend,
  onClear,
  agentName,
  t,
}: ChatTesterProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** Auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory.length, streamingText]);

  /** Handle send */
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isChatting) return;
    setInput('');
    await onSend(trimmed);
  }, [input, isChatting, onSend]);

  /** Handle Enter key */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-sm font-medium">
          {t('testAgent')} — {agentName}
        </span>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t('clearChat')}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
        {chatHistory.length === 0 && !streamingText && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Send a message to start testing your agent!
          </p>
        )}

        {chatHistory.map((msg, i) => (
          <div
            key={`msg-${i}`}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[80%] px-3 py-2 rounded-xl text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted',
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm bg-muted">
              {streamingText}
              <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {/* Thinking indicator */}
        {isChatting && !streamingText && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl text-sm bg-muted text-muted-foreground">
              {t('agentThinking')}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex gap-2 p-3 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chatWithAgent')}
          disabled={isChatting}
          className="flex-1 px-3 py-2 rounded-lg border text-sm bg-background disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isChatting}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            input.trim() && !isChatting
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          {t('sendMessage')}
        </button>
      </div>
    </div>
  );
}
