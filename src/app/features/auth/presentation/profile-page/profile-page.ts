import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';

import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { AuthService } from '@features/auth/application/auth.service';
import { UpdateProfileRequest } from '@features/auth/domain/model/update-profile.model';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, NzButtonModule, NzInputModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formElement = viewChild<ElementRef<HTMLFormElement>>('profileFormElement');
  private readonly currentUser = this.authService.user();

  protected readonly isSubmitting = signal(false);
  protected readonly saved = signal(false);
  protected readonly errorMessage = signal<string | string[] | null>(null);
  protected readonly profileForm = this.formBuilder.group({
    names: [this.currentUser?.names ?? '', [Validators.required, Validators.maxLength(80), this.notBlank]],
    lastNames: [this.currentUser?.lastNames ?? '', [Validators.required, Validators.maxLength(80), this.notBlank]],
    email: [this.currentUser?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(160)]],
    phone: [this.currentUser?.phone ?? '', [Validators.maxLength(30)]],
    documentNumber: [this.currentUser?.documentNumber ?? '', [Validators.maxLength(30)]],
  });

  constructor() {
    this.profileForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.saved.set(false));
  }

  protected submit(): void {
    this.saved.set(false);
    this.errorMessage.set(null);
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.formElement()?.nativeElement.querySelector<HTMLElement>('[formControlName].ng-invalid')?.focus();
      return;
    }

    const value = this.profileForm.getRawValue();
    const request: UpdateProfileRequest = {
      names: value.names.trim(),
      lastNames: value.lastNames.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      documentNumber: value.documentNumber.trim(),
    };
    this.isSubmitting.set(true);
    this.authService
      .updateProfile(request)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => {
          this.profileForm.reset({
            names: user.names,
            lastNames: user.lastNames,
            email: user.email,
            phone: user.phone ?? '',
            documentNumber: user.documentNumber ?? '',
          });
          this.saved.set(true);
        },
        error: (error: unknown) => this.errorMessage.set(resolveApiErrorMessage(error, 'No fue posible guardar tu perfil. Inténtalo nuevamente.')),
      });
  }

  protected hasError(controlName: keyof typeof this.profileForm.controls): boolean {
    const control = this.profileForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected errorMessages(): string[] {
    const message = this.errorMessage();
    return message === null ? [] : Array.isArray(message) ? message : [message];
  }

  private notBlank(control: AbstractControl<string>): ValidationErrors | null {
    return control.value.trim() ? null : { blank: true };
  }
}
