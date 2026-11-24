import { ConflictException } from '@nestjs/common';
import { API_ERROR_CODES, createApiErrorPayload, createFieldError } from '@/common/errors/api-error';

export class EmailAlreadyExistsException extends ConflictException {
  constructor(_message?: string) {
    super(
      createApiErrorPayload(API_ERROR_CODES.DUPLICATE_EMAIL, 'Email already exists', [
        createFieldError('email', 'EMAIL_ALREADY_EXISTS', 'This email is already in use. Please choose another.'),
      ]),
    );
  }
}
