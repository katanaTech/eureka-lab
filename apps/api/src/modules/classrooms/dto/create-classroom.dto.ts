import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for creating a new classroom.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via class-validator DTOs.
 */
export class CreateClassroomDto {
  /** Classroom display name (2-50 characters) */
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;
}
