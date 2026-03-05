import { IsString, IsNotEmpty, MinLength, MaxLength, IsInt, Min, Max } from 'class-validator';

/** Request body for POST /auth/add-child */
export class AddChildDto {
  /**
   * Child's preferred display name.
   * NOT their real name — never sent to external AI APIs (CLAUDE.md Rule 13).
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(30)
  displayName!: string;

  /** Birth year — must result in an age between 8 and 16 */
  @IsInt()
  @Min(2000)
  @Max(2020)
  birthYear!: number;
}
