import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgentPersonaDto } from './create-agent.dto';

/**
 * DTO for updating an existing agent.
 * All fields are optional — only provided fields are updated.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via DTOs.
 */
export class UpdateAgentDto {
  /** Updated agent name */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  /** Updated description */
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  description?: string;

  /** Updated persona configuration */
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentPersonaDto)
  persona?: AgentPersonaDto;
}
