import { IsString, MaxLength } from 'class-validator';

/**
 * DTO for updating a code project's source code.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via DTOs.
 */
export class UpdateProjectDto {
  /** Updated HTML source code */
  @IsString()
  @MaxLength(10240)
  htmlCode!: string;

  /** Updated CSS source code */
  @IsString()
  @MaxLength(10240)
  cssCode!: string;

  /** Updated JavaScript source code */
  @IsString()
  @MaxLength(10240)
  jsCode!: string;
}
