import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorResponse {
  message?: string;
  validationErrors?: Record<string, string>;
}

export function resolveApiErrorMessage(error: unknown, fallbackMessage: string): string | string[] {
  if (error instanceof HttpErrorResponse && isApiErrorResponse(error.error)) {
    const validations = error.error.validationErrors;
    if (validations && Object.entries(validations).length > 0) {
      return Object.values(validations);
    }

    return error.error.message ?? fallbackMessage;
  }

  return fallbackMessage;
}

function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'validationErrors' in error)
  );
}
