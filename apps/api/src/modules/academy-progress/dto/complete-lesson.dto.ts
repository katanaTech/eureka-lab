import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CompleteLessonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lessonId!: string;
}
