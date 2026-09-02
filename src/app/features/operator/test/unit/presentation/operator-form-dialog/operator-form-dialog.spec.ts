import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@core/notification/notification.service';
import { Operator } from '@features/operator/models/operator.model';
import { OperatorFormDialog } from '@features/operator/presentation/operator-form-dialog/operator-form-dialog';
import { OperatorApiService } from '@features/operator/services/operator-api.service';
import { of, throwError } from 'rxjs';

const OPERATOR: Operator = {
  id: 4,
  personId: 12,
  names: 'Maria',
  lastNames: 'Lopez',
  email: 'maria@example.com',
  phone: '0999999999',
  role: 'OPERATOR',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

async function createComponent() {
  const operatorApiService = {
    create: vi.fn(() => of(OPERATOR)),
    update: vi.fn(() => of(OPERATOR)),
  };
  const notificationService = { success: vi.fn(), errorApi: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [OperatorFormDialog],
    providers: [
      { provide: OperatorApiService, useValue: operatorApiService },
      { provide: NotificationService, useValue: notificationService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(OperatorFormDialog);
  return { fixture, notificationService, operatorApiService };
}

describe('OperatorFormDialog', () => {
  it('does not submit an invalid form', async () => {
    const { fixture, operatorApiService } = await createComponent();

    fixture.componentInstance['submit']();

    expect(operatorApiService.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance['operatorForm'].touched).toBe(true);
  });

  it('creates an administrator with the selected role and status', async () => {
    const { fixture, notificationService, operatorApiService } = await createComponent();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance['operatorForm'].setValue({
      names: 'Ana',
      lastNames: 'Perez',
      email: 'ana@example.com',
      password: 'Password123',
      phone: '0987654321',
      role: 'ADMIN',
      active: false,
    });

    fixture.componentInstance['submit']();

    expect(operatorApiService.create).toHaveBeenCalledWith({
      names: 'Ana',
      lastNames: 'Perez',
      email: 'ana@example.com',
      password: 'Password123',
      phone: '0987654321',
      role: 'ADMIN',
      active: false,
    });
    expect(notificationService.success).toHaveBeenCalledWith('Usuario creado correctamente.');
    expect(saved).toHaveBeenCalledOnce();
  });

  it('updates the selected user without sending a password and allows changing the role', async () => {
    const { fixture, operatorApiService } = await createComponent();
    fixture.componentRef.setInput('operator', OPERATOR);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    fixture.componentInstance['operatorForm'].controls.role.setValue('ADMIN');

    fixture.componentInstance['submit']();

    expect(operatorApiService.update).toHaveBeenCalledWith(OPERATOR.id, {
      names: OPERATOR.names,
      lastNames: OPERATOR.lastNames,
      email: OPERATOR.email,
      phone: OPERATOR.phone,
      role: 'ADMIN',
      active: OPERATOR.active,
    });
  });

  it('toggles password visibility', async () => {
    const { fixture } = await createComponent();

    fixture.componentInstance['togglePasswordVisibility']();
    expect(fixture.componentInstance['isPasswordVisible']()).toBe(true);

    fixture.componentInstance['togglePasswordVisibility']();
    expect(fixture.componentInstance['isPasswordVisible']()).toBe(false);
  });

  it('shows every API validation error through the notification service', async () => {
    const { fixture, notificationService, operatorApiService } = await createComponent();
    operatorApiService.create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { validationErrors: { email: 'El correo ya está registrado.', phone: 'El teléfono es obligatorio.' } },
          }),
      ),
    );
    fixture.componentInstance['operatorForm'].setValue({
      names: 'Ana',
      lastNames: 'Perez',
      email: 'ana@example.com',
      password: 'Password123',
      phone: '0987654321',
      role: 'OPERATOR',
      active: true,
    });

    fixture.componentInstance['submit']();

    expect(notificationService.errorApi).toHaveBeenCalledWith(['El correo ya está registrado.', 'El teléfono es obligatorio.']);
  });
});
