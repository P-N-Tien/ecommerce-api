import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

import { ApiSuccessResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    const httpContext = context.switchToHttp();

    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: response.statusCode,
        message: 'Request successful',
        data: data,
        timestamp: new Date().toISOString(),
        path: request.originalUrl ?? request.url,
      })),
    );
  }
}
