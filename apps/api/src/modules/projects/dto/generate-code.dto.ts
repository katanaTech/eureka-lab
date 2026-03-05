import { IsString, MinLength, MaxLength, IsIn } from 'class-validator';
import type { CodeFileType } from '@eureka-lab/shared-types';

/**
 * DTO for AI code generation requests.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via DTOs.
 */
export class GenerateCodeDto {
  /** User's description of what to change or generate */
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  prompt!: string;

  /** Which file to generate (html, css, or js) */
  @IsString()
  @IsIn(['html', 'css', 'js'])
  targetFile!: CodeFileType;
}
