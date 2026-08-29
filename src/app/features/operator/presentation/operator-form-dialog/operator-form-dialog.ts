import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { finalize } from 'rxjs';

import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { Operator } from '@features/operator/models/operator.model';
import { CreateOperatorPayload, UpdateOperatorPayload } from '@features/operator/models/operator-payload.model';
import { OperatorApiService } from '@features/operator/services/operator-api.service';

@Component({
  selector: 'app-operator-form-dialog',
  imports: [FontAwesomeModule, NzInputModule, NzModalModule, NzSelectModule, ReactiveFormsModule],
  templateUrl: './operator-form-dialog.html',
  styleUrl: './operator-form-dialog.css',
})
export class OperatorFormDialog {
  private readonly operatorApiService = inject(OperatorApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly operator = input<Operator | null>(null);
  readonly isOpen = input(false);
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly isSaving = signal(false);
  protected readonly faFloppyDisk = faFloppyDisk;
  protected readonly faXmark = faXmark;
  protected readonly faEye = faEye;
  protected readonly faEyeSlash = faEyeSlash;
  protected readonly isPasswordVisible = signal(false);
  protected readonly operatorForm = this.formBuilder.group({
    names: ['', [Validators.required, Validators.maxLength(80)]],
    lastNames: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    role: this.formBuilder.control<'ADMIN' | 'OPERATOR'>('OPERATOR', Validators.required),
    active: [true],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.populateForm(this.operator());
      }
    });
  }

  protected submit(): void {
    if (this.operatorForm.invalid) {
      this.operatorForm.markAllAsTouched();
      return;
    }

    const operator = this.operator();
    this.isSaving.set(true);
    const request$ =
      operator === null ? this.operatorApiService.create(this.createPayload()) : this.operatorApiService.update(operator.id, this.updatePayload());

    request$
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notificationService.success(operator === null ? 'Usuario creado correctamente.' : 'Usuario actualizado correctamente.');
          this.saved.emit();
        },
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible guardar el operador.')),
      });
  }

  protected hasError(controlName: keyof typeof this.operatorForm.controls): boolean {
    const control = this.operatorForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((isVisible) => !isVisible);
  }

  private populateForm(operator: Operator | null): void {
    this.isPasswordVisible.set(false);
    const passwordControl = this.operatorForm.controls.password;
    passwordControl.setValidators(
      operator === null ? [Validators.required, Validators.minLength(8), Validators.maxLength(72)] : [Validators.maxLength(72)],
    );
    passwordControl.updateValueAndValidity({ emitEvent: false });
    this.operatorForm.reset(
      operator === null
        ? {
            names: '',
            lastNames: '',
            email: '',
            password: '',
            phone: '',
            role: 'OPERATOR',
            active: true,
          }
        : {
            names: operator.names,
            lastNames: operator.lastNames,
            email: operator.email,
            password: '',
            phone: operator.phone,
            role: operator.role,
            active: operator.active,
          },
    );
  }

  private createPayload(): CreateOperatorPayload {
    const value = this.operatorForm.getRawValue();
    return { ...this.updatePayload(), password: value.password, role: value.role };
  }

  private updatePayload(): UpdateOperatorPayload {
    const value = this.operatorForm.getRawValue();
    return {
      names: value.names.trim(),
      lastNames: value.lastNames.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      role: value.role,
      active: value.active,
    };
  }
}
