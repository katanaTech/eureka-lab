import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for creating a new code project.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via DTOs.
 */
export class CreateProjectDto {
  /** Project display name */
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  /** Description of what the project does */
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description!: string;

  /** Template ID this project is based on */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  templateId!: string;
}
