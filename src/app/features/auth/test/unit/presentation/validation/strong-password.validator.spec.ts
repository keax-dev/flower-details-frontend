import { FormControl } from '@angular/forms';
import { strongPassword } from '@features/auth/presentation/validation/strong-password.validator';

describe('strongPassword', () => {
  const validator = strongPassword();

  it('accepts ten or more Unicode characters with upper, lower and digit', () => {
    expect(validator(new FormControl('Contraseña1', { nonNullable: true }))).toBeNull();
  });

  it.each(['password123', 'PASSWORD123', 'Passwordabc', 'Pass123'])('rejects weak password %s', (password) => {
    expect(validator(new FormControl(password, { nonNullable: true }))).toEqual({ strongPassword: true });
  });
});
