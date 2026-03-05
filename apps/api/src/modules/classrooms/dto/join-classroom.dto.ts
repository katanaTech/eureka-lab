import { IsString, Length, Matches } from 'class-validator';

/**
 * DTO for joining a classroom via join code.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via class-validator DTOs.
 */
export class JoinClassroomDto {
  /** 6-character alphanumeric join code (case-insensitive, stored uppercase) */
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z0-9]{6}$/i, {
    message: 'Join code must be 6 alphanumeric characters',
  })
  joinCode!: string;
}
