import { IsBoolean } from 'class-validator';

/** Request body for PATCH /schools/:id/teachers/:teacherId. */
export class UpdateTeacherActiveDto {
  /** New active state (false disables login). */
  @IsBoolean()
  active!: boolean;
}
