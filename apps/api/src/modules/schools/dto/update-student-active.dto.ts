import { IsBoolean } from 'class-validator';

/** Request body for PATCH /schools/:id/students/:studentId. */
export class UpdateStudentActiveDto {
  /** New active state (false disables login + frees the seat). */
  @IsBoolean()
  active!: boolean;
}
