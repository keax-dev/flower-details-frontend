import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';

import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { AuthService } from '@features/auth/application/auth.service';
import { RegisterRequest } from '@features/auth/domain/model/register.model';
import { CURRENT_TERMS_VERSION } from '@features/legal/terms-version';
import { maxUtf8Bytes } from '@features/auth/presentation/validation/max-utf8-bytes.validator';
import { strongPassword } from '@features/auth/presentation/validation/strong-password.validator';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password: unknown = control.get('password')?.value;
  const confirmation: unknown = control.get('confirmPassword')?.value;
  return typeof password === 'string' && typeof confirmation === 'string' && confirmation !== '' && password !== confirmation
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-register-page',
  imports: [NzButtonModule, NzInputModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrls: ['../login-page/login-page.css', './register-page.css'],
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal<string | string[] | null>(null);
  protected readonly isSubmitting = signal(false);
  private readonly formElement = viewChild<ElementRef<HTMLFormElement>>('registrationForm');
  protected readonly registerForm = this.formBuilder.group(
    {
      names: ['', [Validators.required, Validators.maxLength(80), this.notBlank]],
      lastNames: ['', [Validators.required, Validators.maxLength(80), this.notBlank]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
      password: ['', [Validators.required, strongPassword(), maxUtf8Bytes(72)]],
      confirmPassword: ['', [Validators.required]],
      phone: ['', [Validators.maxLength(30)]],
      documentNumber: ['', [Validators.maxLength(30)]],
      termsAccepted: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch },
  );

  protected submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      const invalidField = this.formElement()?.nativeElement.querySelector<HTMLElement>('[formControlName].ng-invalid');
      (invalidField ?? this.formElement()?.nativeElement.querySelector<HTMLElement>('#register-confirm-password'))?.focus();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const value = this.registerForm.getRawValue();
    const request: RegisterRequest = {
      names: value.names.trim(),
      lastNames: value.lastNames.trim(),
      email: value.email.trim(),
      password: value.password,
      phone: value.phone.trim(),
      documentNumber: value.documentNumber.trim(),
      termsAccepted: value.termsAccepted,
      termsVersion: CURRENT_TERMS_VERSION,
    };

    this.authService
      .register(request)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigate(['/home']),
        error: (error: unknown) => this.errorMessage.set(resolveApiErrorMessage(error, 'No fue posible crear tu cuenta. Inténtalo nuevamente.')),
      });
  }

  protected hasError(controlName: keyof typeof this.registerForm.controls): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected hasPasswordMismatch(): boolean {
    return this.registerForm.hasError('passwordsMismatch') && this.registerForm.controls.confirmPassword.touched;
  }

  protected errorMessages(): string[] {
    const message = this.errorMessage();
    return message === null ? [] : Array.isArray(message) ? message : [message];
  }

  private notBlank(control: AbstractControl<string>): ValidationErrors | null {
    return control.value.trim() ? null : { blank: true };
  }
}
