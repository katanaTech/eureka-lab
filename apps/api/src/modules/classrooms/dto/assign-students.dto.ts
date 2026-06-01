import { IsArray, ArrayNotEmpty, ArrayMaxSize, IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for assigning students to a classroom from the school roster.
 * CLAUDE.md Rule 10: input validated via class-validator.
 */
export class AssignStudentsDto {
  /** Student (child) UIDs to add; non-empty, each a non-empty string; capped at 50. */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  studentIds!: string[];
}
