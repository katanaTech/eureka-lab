import {
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single message in the conversation history sent with a chat request.
 */
export class HistoryMessageDto {
  /** Message sender role */
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  /** Message text content */
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}

/**
 * DTO for sending a chat message to an agent.
 * Includes the new message and optional conversation history.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via DTOs.
 */
export class ChatMessageDto {
  /** The new user message to send */
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  /** Conversation history (max 20 messages, frontend enforces) */
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => HistoryMessageDto)
  history!: HistoryMessageDto[];
}
