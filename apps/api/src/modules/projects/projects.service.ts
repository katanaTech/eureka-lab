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
  CodeProjectDocument,
  CodeStreamChunk,
  CodeFileType,
} from '@eureka-lab/shared-types';
import {
  CODE_TEMPLATES,
  findCodeTemplateById,
} from '@eureka-lab/shared-types';

/** Parameters for creating a new code project */
export interface CreateProjectParams {
  /** Project display name */
  name: string;
  /** Description of what the project does */
  description: string;
  /** Template ID this project is based on */
  templateId: string;
}

/** Parameters for updating project code */
export interface UpdateProjectCodeParams {
  /** Updated HTML source code */
  htmlCode: string;
  /** Updated CSS source code */
  cssCode: string;
  /** Updated JavaScript source code */
  jsCode: string;
}

/** Maximum size per code file in bytes (10 KB per Rule 14 spirit) */
const MAX_CODE_SIZE = 10 * 1024;

/**
 * Service for managing user-owned code projects.
 * Firestore subcollection: users/{userId}/projects/{projectId}
 * CLAUDE.md Rule 3: All Firestore queries include userId filter.
 * CLAUDE.md Rule 12: All user-generated content must pass moderation.
 */
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly aiGateway: AiGatewayService,
    private readonly moderation: ContentModerationService,
  ) {}

  /**
   * Get the projects subcollection reference for a user.
   * @param userId - User UID
   * @returns Firestore collection reference
   */
  private projectsRef(userId: string) {
    return this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('projects');
  }

  /**
   * Create a new code project from a template.
   * Validates content via moderation before saving.
   *
   * @param userId - User UID
   * @param params - Project creation parameters
   * @returns Created project document
   */
  async createProject(
    userId: string,
    params: CreateProjectParams,
  ): Promise<CodeProjectDocument> {
    /* Validate template exists */
    const template = findCodeTemplateById(params.templateId);
    if (!template) {
      throw new BadRequestException(
        `Unknown template ID: ${params.templateId}`,
      );
    }

    /* Moderate name and description */
    const nameCheck = this.moderation.moderateInput(params.name);
    if (!nameCheck.passed) {
      throw new BadRequestException(
        'Project name contains inappropriate content',
      );
    }

    const descCheck = this.moderation.moderateInput(params.description);
    if (!descCheck.passed) {
      throw new BadRequestException(
        'Project description contains inappropriate content',
      );
    }

    /* Create the project document */
    const docRef = this.projectsRef(userId).doc();
    const now = new Date().toISOString();
    const project: CodeProjectDocument = {
      id: docRef.id,
      userId,
      name: params.name,
      description: params.description,
      templateId: params.templateId,
      htmlCode: template.starterHtml,
      cssCode: template.starterCss,
      jsCode: template.starterJs,
      createdAt: now,
      lastModifiedAt: now,
    };

    await docRef.set(project);

    this.logger.log({
      event: 'project_created',
      userId,
      projectId: project.id,
      templateId: params.templateId,
    });

    return project;
  }

  /**
   * List all projects for a user.
   *
   * @param userId - User UID
   * @returns Array of project documents
   */
  async getUserProjects(userId: string): Promise<CodeProjectDocument[]> {
    const snapshot = await this.projectsRef(userId)
      .orderBy('lastModifiedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as CodeProjectDocument);
  }

  /**
   * Get a single project by ID.
   *
   * @param userId - User UID
   * @param projectId - Project document ID
   * @returns Project document
   */
  async getProject(
    userId: string,
    projectId: string,
  ): Promise<CodeProjectDocument> {
    const doc = await this.projectsRef(userId).doc(projectId).get();

    if (!doc.exists) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return doc.data() as CodeProjectDocument;
  }

  /**
   * Update a project's code files.
   * Validates size limits before saving.
   *
   * @param userId - User UID
   * @param projectId - Project document ID
   * @param code - Updated code (html, css, js)
   * @returns Updated project document
   */
  async updateProject(
    userId: string,
    projectId: string,
    code: UpdateProjectCodeParams,
  ): Promise<CodeProjectDocument> {
    /* Validate project exists */
    const existing = await this.getProject(userId, projectId);

    /* Enforce size limits */
    this.validateCodeSize(code.htmlCode, 'HTML');
    this.validateCodeSize(code.cssCode, 'CSS');
    this.validateCodeSize(code.jsCode, 'JavaScript');

    const now = new Date().toISOString();
    const updated: CodeProjectDocument = {
      ...existing,
      htmlCode: code.htmlCode,
      cssCode: code.cssCode,
      jsCode: code.jsCode,
      lastModifiedAt: now,
    };

    await this.projectsRef(userId).doc(projectId).set(updated);

    this.logger.log({
      event: 'project_updated',
      userId,
      projectId,
    });

    return updated;
  }

  /**
   * Generate code for a specific file using AI.
   * Returns an async generator for SSE streaming.
   *
   * @param userId - User UID
   * @param projectId - Project document ID
   * @param prompt - User's description of what to change
   * @param targetFile - Which file to generate (html, css, js)
   * @yields CodeStreamChunk events
   */
  async *generateCode(
    userId: string,
    projectId: string,
    prompt: string,
    targetFile: CodeFileType,
  ): AsyncGenerator<CodeStreamChunk> {
    const project = await this.getProject(userId, projectId);

    /* Moderate prompt */
    const promptCheck = this.moderation.moderateInput(prompt);
    if (!promptCheck.passed) {
      yield {
        type: 'error',
        code: 'MODERATION_BLOCKED',
        message: 'Your prompt contains content that cannot be processed.',
      };
      return;
    }

    /* Build the AI prompt with current code context */
    const codeContext = this.buildCodeContext(project, targetFile);
    const fullPrompt = `${codeContext}\n\nUser request: ${prompt}\n\nGenerate ONLY the complete updated ${targetFile.toUpperCase()} code. Output ONLY the code, no explanations or markdown fences.`;

    /* Signal code generation start */
    yield {
      type: 'code_start',
      language: targetFile,
    };

    let generatedCode = '';

    try {
      const stream = this.aiGateway.streamResponse({
        prompt: fullPrompt,
        level: 3,
        moduleId: `l3-project-${projectId}`,
        userId,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.content) {
          generatedCode += chunk.content;

          yield {
            type: 'code_token',
            content: chunk.content,
          };

          /* Periodic output moderation */
          if (generatedCode.length % 200 < 10) {
            const outCheck =
              this.moderation.moderateOutput(generatedCode);
            if (!outCheck.passed) {
              yield {
                type: 'error',
                code: 'MODERATION_BLOCKED',
                message: 'Generated code was flagged by content moderation.',
              };
              return;
            }
          }
        }
      }

      /* Final output moderation */
      const finalCheck = this.moderation.moderateOutput(generatedCode);
      if (!finalCheck.passed) {
        yield {
          type: 'error',
          code: 'MODERATION_BLOCKED',
          message: 'Generated code was flagged by content moderation.',
        };
        return;
      }

      /* Strip markdown fences if AI added them */
      generatedCode = this.stripCodeFences(generatedCode);

      yield {
        type: 'code_done',
        language: targetFile,
        fullCode: generatedCode,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Code generation error';
      this.logger.error({
        event: 'code_generation_error',
        userId,
        projectId,
        targetFile,
        error: message,
      });
      yield {
        type: 'error',
        code: 'GENERATION_ERROR',
        message: `Error generating code: ${message}`,
      };
    }

    this.logger.log({
      event: 'code_generated',
      userId,
      projectId,
      targetFile,
      outputLength: generatedCode.length,
    });
  }

  /**
   * Delete a project.
   *
   * @param userId - User UID
   * @param projectId - Project document ID
   */
  async deleteProject(
    userId: string,
    projectId: string,
  ): Promise<void> {
    const doc = await this.projectsRef(userId).doc(projectId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    await this.projectsRef(userId).doc(projectId).delete();

    this.logger.log({
      event: 'project_deleted',
      userId,
      projectId,
    });
  }

  /**
   * Build code context string for the AI prompt.
   * Provides the current state of all 3 files so AI can make
   * contextual modifications.
   *
   * @param project - Current project document
   * @param targetFile - Which file is being modified
   * @returns Formatted code context
   */
  private buildCodeContext(
    project: CodeProjectDocument,
    targetFile: CodeFileType,
  ): string {
    return [
      `Project: ${project.name}`,
      `Target file: ${targetFile}`,
      '',
      'Current HTML:',
      '```html',
      project.htmlCode,
      '```',
      '',
      'Current CSS:',
      '```css',
      project.cssCode,
      '```',
      '',
      'Current JavaScript:',
      '```javascript',
      project.jsCode,
      '```',
    ].join('\n');
  }

  /**
   * Validate that a code file does not exceed the maximum size.
   *
   * @param code - Source code string
   * @param label - File type label for error messages
   */
  private validateCodeSize(code: string, label: string): void {
    const sizeBytes = new TextEncoder().encode(code).length;
    if (sizeBytes > MAX_CODE_SIZE) {
      throw new BadRequestException(
        `${label} code exceeds maximum size of ${MAX_CODE_SIZE / 1024} KB`,
      );
    }
  }

  /**
   * Strip markdown code fences from AI output if present.
   *
   * @param code - Raw AI output
   * @returns Clean code string
   */
  private stripCodeFences(code: string): string {
    let cleaned = code.trim();

    /* Remove opening fence (e.g. ```html, ```css, ```javascript, ```) */
    cleaned = cleaned.replace(
      /^```(?:html|css|javascript|js)?\s*\n?/,
      '',
    );

    /* Remove closing fence */
    cleaned = cleaned.replace(/\n?```\s*$/, '');

    return cleaned.trim();
  }
}
