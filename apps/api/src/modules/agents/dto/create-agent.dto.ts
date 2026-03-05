import {
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for the agent persona sub-object.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via DTOs.
 */
export class AgentPersonaDto {
  /** Display name for the agent persona */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  /** Custom system prompt describing the agent's personality */
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  systemPrompt!: string;

  /** Knowledge base — what the agent knows about */
  @IsString()
  @MaxLength(500)
  knowledgeBase!: string;

  /** Agent goals — what it tries to help with (max 5) */
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  @ArrayMaxSize(5)
  goals!: string[];

  /** Agent guardrails — what it should never do (max 5) */
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  @ArrayMaxSize(5)
  guardrails!: string[];
}

/**
 * DTO for creating a new agent.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via DTOs.
 */
export class CreateAgentDto {
  /** Agent display name */
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  /** Description of what the agent does */
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  description!: string;

  /** Template ID this agent is based on */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  templateId!: string;

  /** Agent persona configuration */
  @ValidateNested()
  @Type(() => AgentPersonaDto)
  persona!: AgentPersonaDto;
}
