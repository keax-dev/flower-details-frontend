import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorResponse {
  message?: unknown;
  validationErrors?: unknown;
}

export function resolveApiErrorMessage(error: unknown, fallbackMessage: string): string | string[] {
  if (error instanceof HttpErrorResponse && isApiErrorResponse(error.error)) {
    const validations = error.error.validationErrors;
    if (typeof validations === 'object' && validations !== null && !Array.isArray(validations)) {
      const messages = Object.values(validations).filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
      if (messages.length > 0) return messages.slice(0, 10).map((message) => message.slice(0, 500));
    }

    return typeof error.error.message === 'string' && error.error.message.trim() ? error.error.message.slice(0, 500) : fallbackMessage;
  }

  return fallbackMessage;
}

function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return typeof error === 'object' && error !== null && ('message' in error || 'validationErrors' in error);
}
