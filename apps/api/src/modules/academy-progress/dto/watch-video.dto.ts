import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class WatchVideoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  videoId!: string;
}
