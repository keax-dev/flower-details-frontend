import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const textEncoder = new TextEncoder();

export function maxUtf8Bytes(maximumBytes: number): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const actualBytes = textEncoder.encode(control.value).length;

    return actualBytes <= maximumBytes ? null : { maxUtf8Bytes: { actualBytes, maximumBytes } };
  };
}
