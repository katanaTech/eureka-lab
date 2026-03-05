'use client';

import { type FC, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  workflowsApi,
  streamWorkflow,
  type WorkflowStreamChunk,
  type WorkflowStep,
} from '@/lib/api-client';
import {
  WORKFLOW_TEMPLATES,
  findTemplateById,
} from '@eureka-lab/shared-types';
import { cn } from '@/lib/utils';

/* ── Constants ────────────────────────────────────────────────── */

/** Maximum number of steps in a workflow */
const MAX_STEPS = 5;

/** Wizard panel indices */
const PANEL_CHOOSE = 0;
const PANEL_CUSTOMIZE = 1;
const PANEL_TEST = 2;
const PANEL_SAVE = 3;

const PANEL_LABELS = [
  'Choose Template',
  'Customize Steps',
  'Test Workflow',
  'Save & Name',
] as const;

/* ── Types ────────────────────────────────────────────────────── */

interface WorkflowBuilderProps {
  /** Current module ID (for progress tracking) */
  moduleId: string;
  /** Current activity index */
  activityIndex: number;
  /** Pre-selected template ID (optional) */
  templateId?: string;
  /** Callback when workflow is saved (activity completed) */
  onComplete?: () => void;
}

/** Editable step during customization */
interface EditableStep {
  id: string;
  prompt: string;
  inputFrom?: string;
  description: string;
}

/* ── Main Component ───────────────────────────────────────────── */

/**
 * Workflow Builder — 4-panel wizard for creating AI workflows.
 * Panel 1: Choose a template
 * Panel 2: Customize step prompts
 * Panel 3: Test the workflow with sample input
 * Panel 4: Name and save the workflow
 *
 * @param moduleId - Current module ID
 * @param activityIndex - Current activity index
 * @param templateId - Pre-selected template ID
 * @param onComplete - Callback on save
 */
export const WorkflowBuilder: FC<WorkflowBuilderProps> = ({
  moduleId,
  activityIndex,
  templateId: initialTemplateId,
  onComplete,
}) => {
  const t = useTranslations('Learn');

  /* ── State ──────────────────────────────────────────────────── */
  const [panel, setPanel] = useState(initialTemplateId ? PANEL_CUSTOMIZE : PANEL_CHOOSE);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId ?? '');
  const [steps, setSteps] = useState<EditableStep[]>(() => {
    if (initialTemplateId) {
      const tpl = findTemplateById(initialTemplateId);
      return tpl ? tpl.defaultSteps.map(toEditable) : [];
    }
    return [];
  });

  /* Test panel state */
  const [testInput, setTestInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [stepOutputs, setStepOutputs] = useState<Record<number, string>>({});
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [activeTokens, setActiveTokens] = useState('');
  const [testError, setTestError] = useState('');
  const [testWorkflowId, setTestWorkflowId] = useState('');

  /* Save panel state */
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const selectedTemplate = selectedTemplateId
    ? findTemplateById(selectedTemplateId)
    : undefined;

  /* ── Panel 1: Choose Template ───────────────────────────────── */

  /**
   * Select a template and advance to customization.
   * @param id - Template identifier
   */
  const handleSelectTemplate = useCallback((id: string) => {
    const tpl = findTemplateById(id);
    if (!tpl) return;
    setSelectedTemplateId(id);
    setSteps(tpl.defaultSteps.map(toEditable));
    setWorkflowName(tpl.name);
    setWorkflowDescription(tpl.description);
    setTestInput(tpl.sampleInput);
    setPanel(PANEL_CUSTOMIZE);
  }, []);

  /* ── Panel 2: Customize Steps ───────────────────────────────── */

  /**
   * Update a step's prompt text.
   * @param index - Step index
   * @param prompt - New prompt text
   */
  const handleStepPromptChange = useCallback(
    (index: number, prompt: string) => {
      setSteps((prev) => {
        const next = [...prev];
        const step = next[index];
        if (step) {
          next[index] = { ...step, prompt };
        }
        return next;
      });
    },
    [],
  );

  /**
   * Update a step's description.
   * @param index - Step index
   * @param description - New description text
   */
  const handleStepDescriptionChange = useCallback(
    (index: number, description: string) => {
      setSteps((prev) => {
        const next = [...prev];
        const step = next[index];
        if (step) {
          next[index] = { ...step, description };
        }
        return next;
      });
    },
    [],
  );

  /**
   * Add a new blank step at the end.
   */
  const handleAddStep = useCallback(() => {
    if (steps.length >= MAX_STEPS) return;
    const newId = `step-${steps.length + 1}`;
    const prevId = steps.length > 0 ? steps[steps.length - 1]?.id : undefined;
    setSteps((prev) => [
      ...prev,
      {
        id: newId,
        prompt: prevId ? `{${prevId}}` : '{userInput}',
        inputFrom: prevId,
        description: '',
      },
    ]);
  }, [steps]);

  /**
   * Remove a step by index (cannot remove last step).
   * @param index - Step index
   */
  const handleRemoveStep = useCallback(
    (index: number) => {
      if (steps.length <= 1) return;
      setSteps((prev) => {
        const next = prev.filter((_, i) => i !== index);
        /* Fix inputFrom references */
        return next.map((s, i) => {
          if (i === 0 && s.inputFrom) {
            return { ...s, inputFrom: undefined };
          }
          return s;
        });
      });
    },
    [steps.length],
  );

  /* ── Panel 3: Test Workflow ─────────────────────────────────── */

  /**
   * Create a temporary workflow and run it via SSE streaming.
   */
  const handleTestWorkflow = useCallback(async () => {
    if (!testInput.trim() || isRunning) return;

    setIsRunning(true);
    setStepOutputs({});
    setActiveStepIdx(-1);
    setActiveTokens('');
    setTestError('');

    try {
      /* Create a temporary workflow for testing */
      const wf = await workflowsApi.create({
        name: workflowName || `Test - ${selectedTemplate?.name ?? 'Workflow'}`,
        description: workflowDescription || 'Test workflow',
        templateId: selectedTemplateId,
        steps: steps.map(toWorkflowStep),
      });
      setTestWorkflowId(wf.id);

      /* Run it via SSE */
      const stream = streamWorkflow(wf.id, testInput.trim());

      for await (const chunk of stream) {
        processTestChunk(
          chunk,
          setActiveStepIdx,
          setActiveTokens,
          setStepOutputs,
          setTestError,
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Test failed';
      setTestError(message);
    } finally {
      setIsRunning(false);
      setActiveStepIdx(-1);
    }
  }, [
    testInput,
    isRunning,
    workflowName,
    workflowDescription,
    selectedTemplateId,
    selectedTemplate,
    steps,
  ]);

  /* ── Panel 4: Save ──────────────────────────────────────────── */

  /**
   * Save the workflow (or just rename and complete if already created during test).
   */
  const handleSave = useCallback(async () => {
    if (!workflowName.trim() || isSaving) return;

    setIsSaving(true);
    setSaveError('');

    try {
      if (!testWorkflowId) {
        /* Workflow was never test-created — create it now */
        await workflowsApi.create({
          name: workflowName.trim(),
          description: workflowDescription.trim(),
          templateId: selectedTemplateId,
          steps: steps.map(toWorkflowStep),
        });
      }

      setSaved(true);
      onComplete?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save workflow';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    workflowName,
    workflowDescription,
    selectedTemplateId,
    steps,
    testWorkflowId,
    isSaving,
    onComplete,
  ]);

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <WizardProgress currentPanel={panel} />

      {/* Panel content */}
      {panel === PANEL_CHOOSE && (
        <TemplateChooser onSelect={handleSelectTemplate} />
      )}

      {panel === PANEL_CUSTOMIZE && (
        <StepCustomizer
          steps={steps}
          onPromptChange={handleStepPromptChange}
          onDescriptionChange={handleStepDescriptionChange}
          onAddStep={handleAddStep}
          onRemoveStep={handleRemoveStep}
          canAddStep={steps.length < MAX_STEPS}
        />
      )}

      {panel === PANEL_TEST && (
        <WorkflowTester
          steps={steps}
          testInput={testInput}
          onInputChange={setTestInput}
          isRunning={isRunning}
          stepOutputs={stepOutputs}
          activeStepIdx={activeStepIdx}
          activeTokens={activeTokens}
          error={testError}
          onRun={handleTestWorkflow}
          sampleInput={selectedTemplate?.sampleInput}
        />
      )}

      {panel === PANEL_SAVE && (
        <WorkflowSaver
          name={workflowName}
          description={workflowDescription}
          onNameChange={setWorkflowName}
          onDescriptionChange={setWorkflowDescription}
          isSaving={isSaving}
          error={saveError}
          saved={saved}
          onSave={handleSave}
        />
      )}

      {/* Navigation buttons */}
      {!saved && (
        <div className="flex justify-between">
          {panel > PANEL_CHOOSE && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPanel((p) => p - 1)}
              disabled={isRunning || isSaving}
            >
              {t('back') ?? 'Back'}
            </Button>
          )}
          <div className="flex-1" />
          {panel < PANEL_SAVE && panel !== PANEL_CHOOSE && (
            <Button
              size="sm"
              onClick={() => setPanel((p) => p + 1)}
              disabled={
                isRunning ||
                (panel === PANEL_CUSTOMIZE && steps.some((s) => !s.prompt.trim()))
              }
            >
              {t('next') ?? 'Next'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Wizard Progress ──────────────────────────────────────────── */

/**
 * Visual progress indicator showing current wizard step.
 * @param currentPanel - Active panel index (0-3)
 */
const WizardProgress: FC<{ currentPanel: number }> = ({ currentPanel }) => (
  <div className="flex items-center gap-2" role="navigation" aria-label="Wizard progress">
    {PANEL_LABELS.map((label, i) => (
      <div key={label} className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
            i < currentPanel
              ? 'bg-green-500 text-white'
              : i === currentPanel
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
          )}
          aria-current={i === currentPanel ? 'step' : undefined}
        >
          {i < currentPanel ? '✓' : i + 1}
        </div>
        <span
          className={cn(
            'hidden text-xs sm:inline',
            i === currentPanel ? 'font-medium text-foreground' : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
        {i < PANEL_LABELS.length - 1 && (
          <div
            className={cn(
              'h-px w-4 sm:w-8',
              i < currentPanel ? 'bg-green-500' : 'bg-muted',
            )}
          />
        )}
      </div>
    ))}
  </div>
);

/* ── Panel 1: Template Chooser ────────────────────────────────── */

/**
 * Card grid for selecting a workflow template.
 * @param onSelect - Callback with template ID
 */
const TemplateChooser: FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  /** Icon map per category */
  const categoryIcons: Record<string, string> = {
    homework: '📚',
    study: '📅',
    productivity: '📝',
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">
        Choose a Workflow Template
      </h2>
      <p className="text-sm text-muted-foreground">
        Pick a template to start with. You can customize the steps next.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WORKFLOW_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl.id)}
            className="group rounded-lg border border-border bg-background p-4 text-left transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Select ${tpl.name} template`}
          >
            <div className="mb-2 text-2xl">
              {categoryIcons[tpl.category] ?? '🔧'}
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary">
              {tpl.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {tpl.description}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-1.5 py-0.5">
                {tpl.defaultSteps.length} steps
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ── Panel 2: Step Customizer ─────────────────────────────────── */

interface StepCustomizerProps {
  steps: EditableStep[];
  onPromptChange: (index: number, prompt: string) => void;
  onDescriptionChange: (index: number, description: string) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  canAddStep: boolean;
}

/**
 * Step editor panel — edit prompts, view chaining, add/remove steps.
 */
const StepCustomizer: FC<StepCustomizerProps> = ({
  steps,
  onPromptChange,
  onDescriptionChange,
  onAddStep,
  onRemoveStep,
  canAddStep,
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-foreground">
        Customize Your Steps
      </h2>
      <p className="text-sm text-muted-foreground">
        Edit each step&apos;s prompt. Use <code className="rounded bg-muted px-1 text-xs">{'{userInput}'}</code> for user text
        and <code className="rounded bg-muted px-1 text-xs">{'{step-N}'}</code> to chain from a previous step.
      </p>
    </div>

    {steps.map((step, i) => (
      <div
        key={step.id}
        className="space-y-2 rounded-lg border border-border p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <span className="text-sm font-medium text-foreground">
              Step {i + 1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {step.inputFrom && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Uses output from {step.inputFrom}
              </span>
            )}
            {steps.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveStep(i)}
                className="text-xs text-destructive hover:underline"
                aria-label={`Remove step ${i + 1}`}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <input
          type="text"
          value={step.description}
          onChange={(e) => onDescriptionChange(i, e.target.value)}
          placeholder="What does this step do?"
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`Step ${i + 1} description`}
        />

        {/* Prompt */}
        <textarea
          value={step.prompt}
          onChange={(e) => onPromptChange(i, e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`Step ${i + 1} prompt`}
        />
      </div>
    ))}

    {canAddStep && (
      <Button variant="outline" size="sm" onClick={onAddStep}>
        + Add Step
      </Button>
    )}
  </div>
);

/* ── Panel 3: Workflow Tester ─────────────────────────────────── */

interface WorkflowTesterProps {
  steps: EditableStep[];
  testInput: string;
  onInputChange: (value: string) => void;
  isRunning: boolean;
  stepOutputs: Record<number, string>;
  activeStepIdx: number;
  activeTokens: string;
  error: string;
  onRun: () => void;
  sampleInput?: string;
}

/**
 * Test panel — enter input, run workflow, see step-by-step results.
 */
const WorkflowTester: FC<WorkflowTesterProps> = ({
  steps,
  testInput,
  onInputChange,
  isRunning,
  stepOutputs,
  activeStepIdx,
  activeTokens,
  error,
  onRun,
  sampleInput,
}) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-foreground">
        Test Your Workflow
      </h2>
      <p className="text-sm text-muted-foreground">
        Enter some text and run your workflow to see how each step works.
      </p>
    </div>

    {/* Input */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="test-input" className="text-sm font-medium text-foreground">
          Your Input
        </label>
        {sampleInput && !testInput && (
          <button
            type="button"
            onClick={() => onInputChange(sampleInput)}
            className="text-xs text-primary hover:underline"
          >
            Use sample input
          </button>
        )}
      </div>
      <textarea
        id="test-input"
        value={testInput}
        onChange={(e) => onInputChange(e.target.value)}
        rows={4}
        placeholder="Paste or type your input text here..."
        disabled={isRunning}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        aria-label="Workflow test input"
      />
    </div>

    <Button size="sm" onClick={onRun} disabled={!testInput.trim() || isRunning}>
      {isRunning ? 'Running...' : 'Run Workflow'}
    </Button>

    {/* Error */}
    {error && (
      <div
        className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        role="alert"
      >
        {error}
      </div>
    )}

    {/* Step results */}
    {(Object.keys(stepOutputs).length > 0 || isRunning) && (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Results</h3>
        {steps.map((step, i) => {
          const output = stepOutputs[i];
          const isActive = i === activeStepIdx;
          const isDone = output !== undefined;

          return (
            <StepResultCard
              key={step.id}
              stepNumber={i + 1}
              description={step.description}
              output={isDone ? output : isActive ? activeTokens : undefined}
              isActive={isActive}
              isDone={isDone}
            />
          );
        })}
      </div>
    )}
  </div>
);

/* ── Step Result Card ─────────────────────────────────────────── */

interface StepResultCardProps {
  stepNumber: number;
  description: string;
  output?: string;
  isActive: boolean;
  isDone: boolean;
}

/**
 * Collapsible card showing a single step's streaming/completed output.
 */
const StepResultCard: FC<StepResultCardProps> = ({
  stepNumber,
  description,
  output,
  isActive,
  isDone,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={cn(
        'rounded-md border p-3 transition-colors',
        isActive
          ? 'border-primary bg-primary/5'
          : isDone
            ? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
            : 'border-border bg-muted/10',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
        aria-label={`Step ${stepNumber} result`}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
              isDone
                ? 'bg-green-500 text-white'
                : isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {isDone ? '✓' : stepNumber}
          </span>
          <span className="text-sm font-medium text-foreground">
            Step {stepNumber}: {description || 'Untitled step'}
          </span>
          {isActive && (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {expanded ? '▾' : '▸'}
        </span>
      </button>
      {expanded && output !== undefined && (
        <div
          className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-background p-2 text-xs leading-relaxed text-foreground"
          role="region"
          aria-label={`Step ${stepNumber} output`}
          aria-live={isActive ? 'polite' : undefined}
        >
          {output || (
            <span className="text-muted-foreground">Generating...</span>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Panel 4: Workflow Saver ──────────────────────────────────── */

interface WorkflowSaverProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  isSaving: boolean;
  error: string;
  saved: boolean;
  onSave: () => void;
}

/**
 * Name and save panel — finalize the workflow name and description.
 */
const WorkflowSaver: FC<WorkflowSaverProps> = ({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  isSaving,
  error,
  saved,
  onSave,
}) => {
  if (saved) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
        <div className="text-3xl">🎉</div>
        <h2 className="mt-2 text-xl font-bold text-green-700 dark:text-green-300">
          Workflow Saved!
        </h2>
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          Your workflow &quot;{name}&quot; is ready to use. Great job building your own AI workflow!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Save Your Workflow
        </h2>
        <p className="text-sm text-muted-foreground">
          Give your workflow a name and description so you can find it later.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="wf-name" className="text-sm font-medium text-foreground">
            Workflow Name
          </label>
          <input
            id="wf-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="My Homework Helper"
            maxLength={100}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Workflow name"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="wf-desc" className="text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            id="wf-desc"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe what your workflow does..."
            rows={2}
            maxLength={300}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Workflow description"
          />
        </div>
      </div>

      {error && (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <Button size="sm" onClick={onSave} disabled={!name.trim() || isSaving}>
        {isSaving ? 'Saving...' : 'Save Workflow'}
      </Button>
    </div>
  );
};

/* ── Helpers ──────────────────────────────────────────────────── */

/**
 * Convert a WorkflowStep to an EditableStep.
 * @param step - Source workflow step
 * @returns Editable step copy
 */
function toEditable(step: WorkflowStep): EditableStep {
  return {
    id: step.id,
    prompt: step.prompt,
    inputFrom: step.inputFrom,
    description: step.description,
  };
}

/**
 * Convert an EditableStep back to a WorkflowStep.
 * @param step - Editable step
 * @returns API-compatible workflow step
 */
function toWorkflowStep(step: EditableStep): WorkflowStep {
  return {
    id: step.id,
    prompt: step.prompt,
    inputFrom: step.inputFrom,
    description: step.description,
  };
}

/**
 * Process a single SSE chunk during workflow test execution.
 * @param chunk - The SSE chunk
 * @param setActiveStep - State setter for active step index
 * @param setTokens - State setter for active tokens
 * @param setOutputs - State setter for step outputs
 * @param setError - State setter for error
 */
function processTestChunk(
  chunk: WorkflowStreamChunk,
  setActiveStep: (v: number | ((p: number) => number)) => void,
  setTokens: (v: string | ((p: string) => string)) => void,
  setOutputs: (v: Record<number, string> | ((p: Record<number, string>) => Record<number, string>)) => void,
  setError: (v: string) => void,
): void {
  switch (chunk.type) {
    case 'step_start':
      setActiveStep(chunk.stepIndex ?? -1);
      setTokens('');
      break;

    case 'step_token':
      setTokens((prev) => prev + (chunk.content ?? ''));
      break;

    case 'step_done':
      if (chunk.stepIndex !== undefined) {
        const output = chunk.stepOutput ?? '';
        setOutputs((prev) => ({ ...prev, [chunk.stepIndex as number]: output }));
      }
      setTokens('');
      break;

    case 'workflow_done':
      setActiveStep(-1);
      break;

    case 'error':
      setError(chunk.message ?? 'Workflow step failed');
      break;
  }
}
