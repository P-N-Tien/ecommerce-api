import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

import { ApiErrorDetail, ApiErrorResponse } from '../interfaces/api-response.interface';
import { API_ERROR_CODES } from '../errors/api-error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorBody = exception instanceof HttpException ? exception.getResponse() : null;

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled exception: ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const { message, errorCode, errors } = this.extractError(errorBody, statusCode);

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode,
      errorCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    };

    response.status(statusCode).json(errorResponse);
  }

  private extractError(
    errorBody: string | object | null,
    statusCode: number,
  ): {
    message: string;
    errorCode: string;
    errors: ApiErrorDetail[];
  } {
    const defaultMessage = statusCode >= 500 ? 'Internal server error' : 'Request failed';
    const defaultErrorCode = this.getDefaultErrorCode(statusCode);

    if (typeof errorBody === 'string') {
      return {
        message: errorBody,
        errorCode: defaultErrorCode,
        errors: [],
      };
    }

    if (!errorBody || typeof errorBody !== 'object') {
      return {
        message: defaultMessage,
        errorCode: defaultErrorCode,
        errors: [],
      };
    }

    const body = errorBody as Record<string, unknown>;
    const rawMessage = body.message;
    const errorCode =
      typeof body.errorCode === 'string'
        ? body.errorCode
        : typeof body.code === 'string'
          ? body.code
          : defaultErrorCode;

    if (Array.isArray(body.errors)) {
      return {
        message: typeof rawMessage === 'string' ? rawMessage : defaultMessage,
        errorCode,
        errors: body.errors.map((error): ApiErrorDetail => {
          if (!error || typeof error !== 'object') {
            return { code: 'INVALID_VALUE', message: String(error) };
          }
          const detail = error as Record<string, unknown>;
          return {
            ...(typeof detail.field === 'string' ? { field: detail.field } : {}),
            code: typeof detail.code === 'string' ? detail.code : 'INVALID_VALUE',
            message: typeof detail.message === 'string' ? detail.message : 'Invalid value',
          };
        }),
      };
    }

    if (Array.isArray(rawMessage)) {
      const formattedErrors: ApiErrorDetail[] = rawMessage.map((msg) => ({
        code: 'INVALID_VALUE',
        message: String(msg),
      }));

      return {
        message: 'Validation failed',
        errorCode: 'VALIDATION_FAILED',
        errors: formattedErrors,
      };
    }

    return {
      message: typeof rawMessage === 'string' ? rawMessage : defaultMessage,
      errorCode,
      errors: [],
    };
  }

  private getDefaultErrorCode(statusCode: number): string {
    const errorCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: API_ERROR_CODES.BAD_REQUEST,
      [HttpStatus.UNAUTHORIZED]: API_ERROR_CODES.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: API_ERROR_CODES.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: API_ERROR_CODES.NOT_FOUND,
      [HttpStatus.CONFLICT]: API_ERROR_CODES.CONFLICT,
      [HttpStatus.UNPROCESSABLE_ENTITY]: API_ERROR_CODES.VALIDATION_FAILED,
      [HttpStatus.TOO_MANY_REQUESTS]: API_ERROR_CODES.TOO_MANY_REQUESTS,
      [HttpStatus.INTERNAL_SERVER_ERROR]: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
    };
    return (
      errorCodes[statusCode] ?? (statusCode >= 500 ? API_ERROR_CODES.INTERNAL_SERVER_ERROR : API_ERROR_CODES.HTTP_ERROR)
    );
  }
}
