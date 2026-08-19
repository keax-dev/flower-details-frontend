import { maxUtf8Bytes } from './max-utf8-bytes.validator';
import { FormControl } from '@angular/forms';

describe('maxUtf8Bytes', () => {
  it('accepts a password of exactly 72 ASCII bytes', () => {
    const control = new FormControl('a'.repeat(72), maxUtf8Bytes(72));

    expect(control.errors).toBeNull();
  });

  it('rejects text that exceeds the limit when encoded as UTF-8', () => {
    const control = new FormControl('á'.repeat(37), maxUtf8Bytes(72));

    expect(control.errors).toEqual({
      maxUtf8Bytes: {
        actualBytes: 74,
        maximumBytes: 72,
      },
    });
  });
});
