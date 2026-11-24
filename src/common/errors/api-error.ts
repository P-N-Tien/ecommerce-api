import type { ApiErrorDetail, ApiErrorPayload } from '../interfaces/api-response.interface';

export const API_ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  HTTP_ERROR: 'HTTP_ERROR',
  DUPLICATE_SLUG: 'DUPLICATE_SLUG',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
} as const;

export function createApiErrorPayload(
  errorCode: string,
  message: string,
  errors: ApiErrorDetail[] = [],
): ApiErrorPayload {
  return { errorCode, message, errors };
}

export function createFieldError(field: string, code: string, message: string): ApiErrorDetail {
  return { field, code, message };
}

const VALIDATION_CODE_BY_CONSTRAINT: Record<string, string> = {
  isDefined: 'REQUIRED',
  isNotEmpty: 'REQUIRED',
  isEmail: 'INVALID_EMAIL',
  isString: 'INVALID_TYPE',
  isBoolean: 'INVALID_BOOLEAN',
  isInt: 'INVALID_INTEGER',
  isUUID: 'INVALID_UUID',
  isEnum: 'INVALID_ENUM_VALUE',
  isIn: 'INVALID_VALUE',
  min: 'BELOW_MINIMUM',
  max: 'ABOVE_MAXIMUM',
  minLength: 'TOO_SHORT',
  maxLength: 'TOO_LONG',
};

export interface ValidationErrorLike {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationErrorLike[];
}

export function createValidationErrorPayload(validationErrors: ValidationErrorLike[]): ApiErrorPayload {
  const errors: ApiErrorDetail[] = [];
  const visit = (error: ValidationErrorLike, parentPath = ''): void => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    for (const [constraint, message] of Object.entries(error.constraints ?? {})) {
      errors.push({
        field,
        code: VALIDATION_CODE_BY_CONSTRAINT[constraint] ?? 'INVALID_VALUE',
        message,
      });
    }
    error.children?.forEach((child) => visit(child, field));
  };

  validationErrors.forEach((error) => visit(error));
  return createApiErrorPayload(API_ERROR_CODES.VALIDATION_FAILED, 'Validation failed', errors);
}
