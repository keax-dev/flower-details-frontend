import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorResponse {
  message?: string;
}

export function resolveApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof HttpErrorResponse && isApiErrorResponse(error.error)) {
    return error.error.message ?? fallbackMessage;
  }

  return fallbackMessage;
}

function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return typeof error === 'object' && error !== null && 'message' in error;
}
