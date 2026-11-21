import { HttpErrorResponse } from '@angular/common/http';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';

describe('untrusted API errors', () => {
  it('does not pass malformed messages to notification renderers', () => {
    for (const error of [{ message: { html: '<b>unsafe</b>' } }, { validationErrors: ['unexpected'] }, { validationErrors: { field: 42 } }]) {
      expect(resolveApiErrorMessage(new HttpErrorResponse({ error }), 'Fallback')).toBe('Fallback');
    }
  });

  it('bounds server-controlled notification counts and lengths', () => {
    const validationErrors = Object.fromEntries(Array.from({ length: 100 }, (_, index) => [String(index), 'x'.repeat(1000)]));
    const messages = resolveApiErrorMessage(new HttpErrorResponse({ error: { validationErrors } }), 'Fallback');
    expect(messages).toHaveLength(10);
    expect(messages[0]).toHaveLength(500);
  });
});
