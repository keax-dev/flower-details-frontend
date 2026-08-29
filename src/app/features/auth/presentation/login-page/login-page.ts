import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { maxUtf8Bytes } from '../validation/max-utf8-bytes.validator';
import { AuthService } from '@features/auth/application/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login-page',
  imports: [NzButtonModule, NzInputModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal<string | string[] | null>(null);
  protected readonly isSubmitting = signal(false);

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
        error: (error: unknown) => this.errorMessage.set(resolveApiErrorMessage(error, 'No fue posible iniciar sesión. Inténtalo nuevamente.')),
      });
  }

  protected hasError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected errorMessages(): string[] {
    const message = this.errorMessage();
    if (message === null) {
      return [];
    }
    return Array.isArray(message) ? message : [message];
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl');
    const redirectUrl = returnUrl !== null && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/home';

    this.router.navigateByUrl(redirectUrl);
  }
}
