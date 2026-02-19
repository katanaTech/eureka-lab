import { IsArray, IsInt, IsISO8601, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Standard API error response shape.
 * Matches the ErrorResponse schema in planning/api-contracts.md.
 * Used by AllExceptionsFilter to serialise consistent error payloads.
 */
export class ErrorResponseDto {
  /**
   * HTTP status code (e.g. 400, 401, 404, 500).
   */
  @IsInt()
  statusCode: number;

  /**
   * HTTP status text (e.g. "Bad Request", "Not Found").
   */
  @IsString()
  error: string;

  /**
   * Human-readable error message safe to display to the end user.
   */
  @IsString()
  message: string;

  /**
   * Machine-readable error code for frontend handling (e.g. "EMAIL_ALREADY_EXISTS").
   * Present only when the thrower provides a specific code.
   */
  @IsOptional()
  @IsString()
  code?: string;

  /**
   * Field-level validation errors — present on 400 responses only.
   * Each entry identifies the failing field and the reason.
   */
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  errors?: Array<{
    field: string;
    message: string;
  }>;

  /**
   * ISO 8601 timestamp of when the error occurred (server time).
   */
  @IsISO8601()
  timestamp: string;

  /**
   * The request URL path that triggered the error (e.g. "/api/v1/auth/login").
   */
  @IsString()
  path: string;
}
