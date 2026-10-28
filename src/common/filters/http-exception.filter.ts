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
    const errorCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_FAILED',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };
    return errorCodes[statusCode] ?? (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR');
  }
}
