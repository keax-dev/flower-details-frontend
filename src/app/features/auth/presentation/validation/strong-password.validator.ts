import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function strongPassword(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value;
    const valid = [...value].length >= 10 && /\p{Lu}/u.test(value) && /\p{Ll}/u.test(value) && /\p{Nd}/u.test(value);
    return valid ? null : { strongPassword: true };
  };
}
