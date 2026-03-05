import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { AiGatewayService } from '../ai/ai-gateway.service';
import { ContentModerationService } from '../ai/content-moderation.service';
import type {
  WorkflowDocument,
  WorkflowStep,
  WorkflowStreamChunk,
} from '@eureka-lab/shared-types';

/** Parameters for creating a new workflow */
export interface CreateWorkflowParams {
  /** Workflow display name */
  name: string;
  /** Description of what the workflow does */
  description: string;
  /** Template ID this workflow is based on */
  templateId: string;
  /** Ordered workflow steps */
  steps: WorkflowStep[];
}

/** Maximum number of steps per workflow (MVP limit) */
const MAX_STEPS = 5;

/**
 * Service for managing user-owned workflows.
 * Firestore subcollection: users/{userId}/workflows/{workflowId}
 * CLAUDE.md Rule 3: All Firestore queries include userId filter.
 * CLAUDE.md Rule 12: All user-generated content must pass moderation.
 */
@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly aiGateway: AiGatewayService,
    private readonly moderation: ContentModerationService,
  ) {}

  /**
   * Get the workflows subcollection reference for a user.
   * @param userId - User UID
   * @returns Firestore collection reference
   */
  private workflowsRef(userId: string) {
    return this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('workflows');
  }

  /**
   * Create a new workflow for a user.
   * Validates content via moderation before saving.
   *
   * @param userId - User UID
   * @param params - Workflow creation parameters
   * @returns Created workflow document
   */
  async createWorkflow(
    userId: string,
    params: CreateWorkflowParams,
  ): Promise<WorkflowDocument> {
    /* Validate step count */
    if (params.steps.length === 0) {
      throw new BadRequestException('Workflow must have at least 1 step');
    }
    if (params.steps.length > MAX_STEPS) {
      throw new BadRequestException(
        `Workflow cannot exceed ${MAX_STEPS} steps`,
      );
    }

    /* Validate step chaining */
    this.validateStepChaining(params.steps);

    /* Moderate workflow name and description */
    const nameCheck = this.moderation.moderateInput(params.name);
    if (!nameCheck.passed) {
      throw new BadRequestException(
        'Workflow name contains inappropriate content',
      );
    }

    const descCheck = this.moderation.moderateInput(params.description);
    if (!descCheck.passed) {
      throw new BadRequestException(
        'Workflow description contains inappropriate content',
      );
    }

    /* Moderate each step prompt */
    for (const step of params.steps) {
      const stepCheck = this.moderation.moderateInput(step.prompt);
      if (!stepCheck.passed) {
        throw new BadRequestException(
          `Step "${step.id}" contains inappropriate content in its prompt`,
        );
      }
    }

    /* Create the workflow document */
    const docRef = this.workflowsRef(userId).doc();
    const workflow: WorkflowDocument = {
      id: docRef.id,
      userId,
      name: params.name,
      description: params.description,
      templateId: params.templateId,
      steps: params.steps,
      createdAt: new Date().toISOString(),
      runCount: 0,
    };

    await docRef.set(workflow);

    this.logger.log({
      event: 'workflow_created',
      userId,
      workflowId: workflow.id,
      templateId: params.templateId,
      stepCount: params.steps.length,
    });

    return workflow;
  }

  /**
   * List all workflows for a user.
   *
   * @param userId - User UID
   * @param templateId - Optional template filter
   * @returns Array of workflow documents
   */
  async getUserWorkflows(
    userId: string,
    templateId?: string,
  ): Promise<WorkflowDocument[]> {
    let query: FirebaseFirestore.Query = this.workflowsRef(userId);

    if (templateId) {
      query = query.where('templateId', '==', templateId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    return snapshot.docs.map((doc) => doc.data() as WorkflowDocument);
  }

  /**
   * Get a single workflow by ID.
   *
   * @param userId - User UID
   * @param workflowId - Workflow document ID
   * @returns Workflow document
   */
  async getWorkflow(
    userId: string,
    workflowId: string,
  ): Promise<WorkflowDocument> {
    const doc = await this.workflowsRef(userId).doc(workflowId).get();

    if (!doc.exists) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    return doc.data() as WorkflowDocument;
  }

  /**
   * Execute a workflow by running each step sequentially through the AI gateway.
   * Returns an async generator for SSE streaming step-by-step results.
   *
   * @param userId - User UID
   * @param workflowId - Workflow document ID
   * @param input - Initial user input text
   * @yields WorkflowStreamChunk events
   */
  async *runWorkflow(
    userId: string,
    workflowId: string,
    input: string,
  ): AsyncGenerator<WorkflowStreamChunk> {
    const workflow = await this.getWorkflow(userId, workflowId);

    /* Moderate initial input */
    const inputCheck = this.moderation.moderateInput(input);
    if (!inputCheck.passed) {
      yield {
        type: 'error',
        code: 'MODERATION_BLOCKED',
        message: 'Your input contains content that cannot be processed.',
      };
      return;
    }

    /* Track outputs from each step for chaining */
    const stepOutputs: Map<string, string> = new Map();
    const allOutputs: string[] = [];

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];

      /* Signal step start */
      yield {
        type: 'step_start',
        stepIndex: i,
        stepId: step.id,
      };

      /* Resolve the prompt — replace placeholders with actual values */
      const resolvedPrompt = this.resolveStepPrompt(
        step,
        input,
        stepOutputs,
      );

      /* Call AI gateway for this step */
      let stepOutput = '';

      try {
        const stream = this.aiGateway.streamResponse({
          prompt: resolvedPrompt,
          level: 2,
          moduleId: `l2-workflow-${workflowId}`,
          userId,
        });

        for await (const chunk of stream) {
          if (chunk.type === 'token' && chunk.content) {
            stepOutput += chunk.content;

            /* Forward token to client */
            yield {
              type: 'step_token',
              stepIndex: i,
              stepId: step.id,
              content: chunk.content,
            };

            /* Periodic output moderation */
            if (stepOutput.length % 200 < 10) {
              const outCheck = this.moderation.moderateOutput(stepOutput);
              if (!outCheck.passed) {
                yield {
                  type: 'error',
                  code: 'MODERATION_BLOCKED',
                  message: `Step ${i + 1} output was flagged by content moderation.`,
                };
                return;
              }
            }
          }
          /* Skip 'done' and 'error' from inner stream — we handle our own */
        }

        /* Final output moderation for this step */
        const finalCheck = this.moderation.moderateOutput(stepOutput);
        if (!finalCheck.passed) {
          yield {
            type: 'error',
            code: 'MODERATION_BLOCKED',
            message: `Step ${i + 1} output was flagged by content moderation.`,
          };
          return;
        }

        /* Store step output for chaining */
        stepOutputs.set(step.id, stepOutput);
        allOutputs.push(stepOutput);

        /* Signal step done */
        yield {
          type: 'step_done',
          stepIndex: i,
          stepId: step.id,
          stepOutput,
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Step execution error';
        this.logger.error({
          event: 'workflow_step_error',
          userId,
          workflowId,
          stepIndex: i,
          error: message,
        });
        yield {
          type: 'error',
          code: 'STEP_EXECUTION_ERROR',
          message: `Error running step ${i + 1}: ${message}`,
        };
        return;
      }
    }

    /* Update run count */
    await this.workflowsRef(userId).doc(workflowId).update({
      runCount: (workflow.runCount ?? 0) + 1,
      lastRunAt: new Date().toISOString(),
    });

    /* Signal workflow complete */
    yield {
      type: 'workflow_done',
      outputs: allOutputs,
    };

    this.logger.log({
      event: 'workflow_run_complete',
      userId,
      workflowId,
      stepCount: workflow.steps.length,
      runCount: (workflow.runCount ?? 0) + 1,
    });
  }

  /**
   * Delete a workflow.
   *
   * @param userId - User UID
   * @param workflowId - Workflow document ID
   */
  async deleteWorkflow(
    userId: string,
    workflowId: string,
  ): Promise<void> {
    const doc = await this.workflowsRef(userId).doc(workflowId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    await this.workflowsRef(userId).doc(workflowId).delete();

    this.logger.log({
      event: 'workflow_deleted',
      userId,
      workflowId,
    });
  }

  /**
   * Resolve a step's prompt by replacing placeholders with actual values.
   * Supports {userInput} for initial input and {step-N} for previous step outputs.
   *
   * @param step - Workflow step definition
   * @param userInput - Original user input
   * @param stepOutputs - Map of step ID → output text
   * @returns Resolved prompt text
   */
  private resolveStepPrompt(
    step: WorkflowStep,
    userInput: string,
    stepOutputs: Map<string, string>,
  ): string {
    let prompt = step.prompt;

    /* Replace {userInput} with the initial input */
    prompt = prompt.replace(/\{userInput\}/g, userInput);

    /* Replace {step-N} references with previous step outputs */
    for (const [stepId, output] of stepOutputs) {
      prompt = prompt.replace(new RegExp(`\\{${stepId}\\}`, 'g'), output);
    }

    return prompt;
  }

  /**
   * Validate that step chaining references are valid.
   * Each inputFrom must reference a step that appears earlier in the sequence.
   *
   * @param steps - Array of workflow steps
   */
  private validateStepChaining(steps: WorkflowStep[]): void {
    const seenIds = new Set<string>();

    for (const step of steps) {
      if (step.inputFrom && !seenIds.has(step.inputFrom)) {
        throw new BadRequestException(
          `Step "${step.id}" references unknown input "${step.inputFrom}". ` +
            'Referenced steps must appear earlier in the sequence.',
        );
      }
      seenIds.add(step.id);
    }
  }
}
