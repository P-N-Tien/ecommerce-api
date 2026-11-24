export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiErrorDetail {
  field?: string;
  code: string;
  message: string;
}

export interface ApiErrorPayload {
  errorCode: string;
  message: string;
  errors: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  errors: ApiErrorDetail[];
  timestamp: string;
  path: string;
}
