import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for executing a workflow.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via DTOs.
 */
export class RunWorkflowDto {
  /** Initial input text to feed into the workflow */
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  input!: string;
}
