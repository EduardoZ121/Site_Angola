import type { AppError, AppErrorCode } from '@kuteka/types';

const STATUS: Record<AppErrorCode, number> = {
  INTERNAL_ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  SERVICE_UNAVAILABLE: 503,
};

export function createAppError(code: AppErrorCode, message: string, details?: unknown): AppError {
  return {
    code,
    message,
    status: STATUS[code],
    details,
  };
}

export function toErrorResponse(error: AppError) {
  return {
    error: {
      code: error.code,
      message: error.message,
    },
  };
}
