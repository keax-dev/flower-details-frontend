import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '@features/auth/application/auth.service';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { maxUtf8Bytes } from '../validation/max-utf8-bytes.validator';

@Component({
  selector: 'app-login-page',
  imports: [HlmButtonImports, HlmInputImports, HlmLabelImports, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, maxUtf8Bytes(72)]],
  });

  protected submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.navigateAfterLogin(),
        error: (error: unknown) =>
          this.errorMessage.set(
            resolveApiErrorMessage(error, 'No fue posible iniciar sesión. Inténtalo nuevamente.'),
          ),
      });
  }

  protected hasError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl');
    const redirectUrl =
      returnUrl !== null && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
        ? returnUrl
        : '/home';
    void this.router.navigateByUrl(redirectUrl);
  }
}
