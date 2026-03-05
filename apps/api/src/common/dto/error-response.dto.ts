/**
 * Standard API error response DTO.
 * Matches the error format defined in planning/api-contracts.md.
 */
export class ErrorResponseDto {
  /** HTTP status code */
  statusCode!: number;

  /** HTTP status text */
  error!: string;

  /** Human-readable error message */
  message!: string;

  /** Machine-readable error code (optional) */
  code?: string;

  /** Field-level validation errors (optional, 400 only) */
  errors?: FieldErrorDto[];

  /** ISO 8601 timestamp */
  timestamp!: string;
}

/** Field-level validation error */
export class FieldErrorDto {
  /** Field name that failed validation */
  field!: string;

  /** Error message for this field */
  message!: string;
}
