import {
  IsString,
  IsArray,
  MinLength,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/** DTO for a single workflow step */
export class WorkflowStepDto {
  /** Step identifier */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  id!: string;

  /** AI prompt template with optional {userInput} or {step-N} placeholders */
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  prompt!: string;

  /** Optional: step ID whose output feeds into this step */
  @IsOptional()
  @IsString()
  inputFrom?: string;

  /** Child-friendly description of what this step does */
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  description!: string;
}

/**
 * DTO for creating a new workflow.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via DTOs.
 */
export class CreateWorkflowDto {
  /** Workflow display name */
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  /** Description of what the workflow does */
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description!: string;

  /** Template ID this workflow is based on */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  templateId!: string;

  /** Ordered workflow steps (1–5) */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps!: WorkflowStepDto[];
}
