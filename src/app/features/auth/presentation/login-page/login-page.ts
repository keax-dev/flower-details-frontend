import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../application/auth.service';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { Router, RouterLink } from '@angular/router';

interface ApiErrorResponse {
  message?: string;
}

@Component({
  selector: 'app-login-page',
  imports: [HlmButtonImports, HlmInputImports, HlmLabelImports, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
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
        next: () => this.router.navigateByUrl('/home'),
        error: (error: unknown) => this.errorMessage.set(this.resolveErrorMessage(error)),
      });
  }

  protected hasError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && this.isApiErrorResponse(error.error)) {
      return error.error.message ?? 'No fue posible iniciar sesión. Inténtalo nuevamente.';
    }

    return 'No fue posible conectar con el servidor. Inténtalo nuevamente.';
  }

  private isApiErrorResponse(error: unknown): error is ApiErrorResponse {
    return typeof error === 'object' && error !== null && 'message' in error;
  }
}
