import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorBody = exception instanceof HttpException ? exception.getResponse() : null;

    const { message, code, details } = this.extractError(errorBody, statusCode);

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled exception: ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
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
    code: string;
    details?: unknown;
  } {
    const defaultMessage = statusCode >= 500 ? 'Internal server error' : 'Request failed';

    if (typeof errorBody === 'string') {
      return {
        message: errorBody,
        code: this.getDefaultErrorCode(statusCode),
      };
    }

    if (!errorBody || typeof errorBody !== 'object') {
      return {
        message: defaultMessage,
        code: this.getDefaultErrorCode(statusCode),
      };
    }

    const body = errorBody as Record<string, unknown>;

    const rawMessage = body.message;

    const message = Array.isArray(rawMessage)
      ? 'Validation failed'
      : typeof rawMessage === 'string'
        ? rawMessage
        : defaultMessage;

    const code = typeof body.code === 'string' ? body.code : this.getDefaultErrorCode(statusCode);

    const details = Array.isArray(rawMessage) ? rawMessage : body.details;

    return {
      message,
      code,
      ...(details !== undefined ? { details } : {}),
    };
  }

  private getDefaultErrorCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';

      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';

      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';

      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';

      case HttpStatus.CONFLICT:
        return 'CONFLICT';

      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_FAILED';

      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';

      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';

      default:
        return statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR';
    }
  }
}
