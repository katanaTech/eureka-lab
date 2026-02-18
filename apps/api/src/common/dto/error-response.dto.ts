/**
 * Standard API error response shape.
 * Matches the ErrorResponse schema in planning/api-contracts.md.
 */
export class ErrorResponseDto {
  /** HTTP status code */
  statusCode: number;

  /** HTTP status text (e.g. "Bad Request") */
  error: string;

  /** Human-readable error message */
  message: string;

  /** Machine-readable error code for frontend handling (e.g. "EMAIL_ALREADY_EXISTS") */
  code?: string;

  /** Field-level validation errors — present on 400 responses only */
  errors?: Array<{
    field: string;
    message: string;
  }>;

  /** ISO 8601 timestamp of when the error occurred */
  timestamp: string;
}
