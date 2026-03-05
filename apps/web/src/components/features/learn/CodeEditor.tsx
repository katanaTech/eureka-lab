'use client';

/**
 * CodeEditor — Monaco Editor + sandboxed iframe preview for Level 3: Vibe Coding.
 * Split-pane layout with:
 *  - Left: Monaco editor with HTML/CSS/JS tabs
 *  - Right: sandboxed iframe preview
 *  - Bottom: AI prompt bar + Run + Save buttons
 *
 * @module CodeEditor
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/project-store';
import {
  CODE_TEMPLATES,
  findCodeTemplateById,
} from '@eureka-lab/shared-types';
import type { CodeFileType, CodeProjectDocument } from '@eureka-lab/shared-types';

/** Lazy-load Monaco to keep initial bundle small (~2MB) */
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
      Loading editor...
    </div>
  ),
});

/** Props for the CodeEditor component */
interface CodeEditorProps {
  /** Module ID for progress tracking */
  moduleId: string;
  /** Activity index within the module */
  activityIndex: number;
  /** Template ID to initialize from (optional) */
  templateId?: string;
  /** Callback when the activity is completed */
  onComplete?: () => void;
}

/** Tab definition for the file switcher */
interface FileTab {
  /** File type key */
  key: CodeFileType;
  /** Display label */
  label: string;
  /** Monaco language ID */
  language: string;
}

const FILE_TABS: FileTab[] = [
  { key: 'html', label: 'HTML', language: 'html' },
  { key: 'css', label: 'CSS', language: 'css' },
  { key: 'js', label: 'JS', language: 'javascript' },
];

/**
 * CodeEditor component — the main code editing experience for Level 3.
 */
export function CodeEditor({
  moduleId,
  activityIndex,
  templateId,
  onComplete,
}: CodeEditorProps) {
  const t = useTranslations('Learn');

  const {
    currentProject,
    isGenerating,
    generatedCode,
    isSaving,
    error,
    createProject,
    generateCode,
    saveCode,
    updateLocalCode,
    setCurrentProject,
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<CodeFileType>('html');
  const [aiPrompt, setAiPrompt] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /** Get the current code for the active tab */
  const activeCode = useMemo(() => {
    if (!currentProject) return '';
    switch (activeTab) {
      case 'html':
        return currentProject.htmlCode;
      case 'css':
        return currentProject.cssCode;
      case 'js':
        return currentProject.jsCode;
    }
  }, [currentProject, activeTab]);

  /** Build the combined srcdoc for the preview iframe */
  const previewSrcDoc = useMemo(() => {
    if (!currentProject) return '';
    return buildSrcDoc(
      currentProject.htmlCode,
      currentProject.cssCode,
      currentProject.jsCode,
    );
  }, [currentProject]);

  /** Initialize project from template if no project exists */
  const handleInitFromTemplate = useCallback(async () => {
    if (currentProject) return;

    const tid = templateId ?? CODE_TEMPLATES[0]?.id;
    if (!tid) return;

    const template = findCodeTemplateById(tid);
    if (!template) return;

    await createProject(template.name, template.description, tid);
  }, [currentProject, templateId, createProject]);

  /** Handle code changes in the Monaco editor */
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateLocalCode(activeTab, value);
      }
    },
    [activeTab, updateLocalCode],
  );

  /** Run the preview by refreshing the iframe */
  const handleRun = useCallback(() => {
    if (!iframeRef.current || !currentProject) return;
    iframeRef.current.srcdoc = buildSrcDoc(
      currentProject.htmlCode,
      currentProject.cssCode,
      currentProject.jsCode,
    );
  }, [currentProject]);

  /** Save the project code to the backend */
  const handleSave = useCallback(async () => {
    if (!currentProject) return;
    await saveCode(
      currentProject.htmlCode,
      currentProject.cssCode,
      currentProject.jsCode,
    );
  }, [currentProject, saveCode]);

  /** Ask AI to generate code */
  const handleAiGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || !currentProject) return;
    const result = await generateCode(aiPrompt.trim(), activeTab);
    if (result) {
      updateLocalCode(activeTab, result);
      setAiPrompt('');
    }
  }, [aiPrompt, currentProject, activeTab, generateCode, updateLocalCode]);

  /* ── Template picker (shown when no project exists) ────────── */
  if (!currentProject) {
    return (
      <TemplatePicker
        templateId={templateId}
        onInit={handleInitFromTemplate}
      />
    );
  }

  /* ── Main editor layout ────────────────────────────────────── */
  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden bg-gray-950">
      {/* Top bar: file tabs */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-900 border-b border-gray-800">
        {FILE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-3 py-1 text-sm rounded-t font-mono transition-colors',
              activeTab === tab.key
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50',
            )}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-gray-500 font-mono">
          {currentProject.name}
        </span>
      </div>

      {/* Main split: editor + preview */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Monaco Editor */}
        <div className="w-1/2 border-r border-gray-800">
          <MonacoEditor
            height="100%"
            language={FILE_TABS.find((t) => t.key === activeTab)?.language}
            value={activeCode}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>

        {/* Right: Sandboxed preview */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="px-2 py-1 bg-gray-100 border-b text-xs text-gray-500 font-mono">
            {t('preview') ?? 'Preview'}
          </div>
          <iframe
            ref={iframeRef}
            srcDoc={previewSrcDoc}
            sandbox="allow-scripts"
            title="Code preview"
            className="flex-1 w-full border-0"
          />
        </div>
      </div>

      {/* Bottom bar: AI prompt + actions */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-t border-gray-800">
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAiGenerate();
            }
          }}
          placeholder={t('aiPromptPlaceholder') ?? 'Ask AI to modify your code...'}
          className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isGenerating}
        />
        <button
          onClick={handleAiGenerate}
          disabled={isGenerating || !aiPrompt.trim()}
          className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (t('generating') ?? 'Generating...') : (t('askAi') ?? 'Ask AI')}
        </button>
        <button
          onClick={handleRun}
          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          {t('run') ?? 'Run'}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? (t('saving') ?? 'Saving...') : (t('saveProject') ?? 'Save')}
        </button>
        {onComplete && (
          <button
            onClick={onComplete}
            className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors"
          >
            {t('completeActivity') ?? 'Done'}
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-3 py-2 bg-red-900/50 text-red-300 text-sm border-t border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}

/* ── Template Picker sub-component ──────────────────────────────── */

/** Props for the TemplatePicker */
interface TemplatePickerProps {
  /** Pre-selected template ID */
  templateId?: string;
  /** Callback to initialize the project */
  onInit: () => void;
}

/**
 * Displayed when no project exists — lets the user pick a template.
 */
function TemplatePicker({ templateId, onInit }: TemplatePickerProps) {
  const t = useTranslations('Learn');
  const template = templateId ? findCodeTemplateById(templateId) : null;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold">
        {t('chooseCodeTemplate') ?? 'Choose a Code Template'}
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-md">
        {t('chooseCodeTemplateDesc') ?? 'Pick a template to start building. You can modify the code with AI.'}
      </p>

      {template ? (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 border rounded-lg bg-white shadow-sm text-center max-w-sm">
            <p className="font-medium">{template.name}</p>
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
              {template.category}
            </span>
          </div>
          <button
            onClick={onInit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('startCoding') ?? 'Start Coding'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {CODE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={onInit}
              className="p-4 border rounded-lg bg-white hover:border-blue-400 hover:shadow-md transition-all text-left"
            >
              <p className="font-medium">{tmpl.name}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {tmpl.description}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                {tmpl.category}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────── */

/**
 * Combine HTML, CSS, and JS into a single srcdoc string for the iframe.
 * Injects CSS into a <style> tag and JS into a <script> tag.
 *
 * @param html - HTML source
 * @param css - CSS source
 * @param js - JavaScript source
 * @returns Combined HTML string
 */
function buildSrcDoc(html: string, css: string, js: string): string {
  /* If the HTML already has <head> and references external files,
     we replace those references with inline content */
  let combined = html;

  /* Replace link to style.css with inline <style> */
  combined = combined.replace(
    /<link[^>]*href=["']style\.css["'][^>]*\/?>/i,
    `<style>${css}</style>`,
  );

  /* Replace script src to script.js with inline <script> */
  combined = combined.replace(
    /<script[^>]*src=["']script\.js["'][^>]*><\/script>/i,
    `<script>${js}<\/script>`,
  );

  /* If no replacements happened (no external refs), append styles + script */
  if (!combined.includes('<style>') && css.trim()) {
    combined = combined.replace(
      '</head>',
      `<style>${css}</style></head>`,
    );
  }
  if (!combined.includes(js.slice(0, 30)) && js.trim()) {
    combined = combined.replace(
      '</body>',
      `<script>${js}<\/script></body>`,
    );
  }

  return combined;
}
