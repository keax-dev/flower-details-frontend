import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@core/notification/notification.service';
import { Operator } from '@features/operator/models/operator.model';
import { OperatorList } from '@features/operator/presentation/operator-list/operator-list';
import { OperatorApiService } from '@features/operator/services/operator-api.service';
import { PageResponse } from '@shared/domain/pagination/page-response.model';
import { of, throwError } from 'rxjs';

const ACTIVE_OPERATOR: Operator = {
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

const PAGE: PageResponse<Operator> = {
  items: [ACTIVE_OPERATOR],
  page: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1,
};

async function createComponent() {
  const operatorApiService = {
    list: vi.fn(() => of(PAGE)),
    activate: vi.fn(() => of({ ...ACTIVE_OPERATOR, active: true })),
    deactivate: vi.fn(() => of({ ...ACTIVE_OPERATOR, active: false })),
    delete: vi.fn(() => of(void 0)),
  };
  const notificationService = { success: vi.fn(), errorApi: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [OperatorList],
    providers: [
      { provide: OperatorApiService, useValue: operatorApiService },
      { provide: NotificationService, useValue: notificationService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(OperatorList);
  fixture.detectChanges();
  return { fixture, notificationService, operatorApiService };
}

describe('OperatorList', () => {
  it('loads the administrative staff on initialization', async () => {
    const { fixture, operatorApiService } = await createComponent();

    expect(operatorApiService.list).toHaveBeenCalledWith(0, 10);
    expect(fixture.componentInstance['operators']()).toEqual([ACTIVE_OPERATOR]);
  });

  it('deactivates an active user and reloads the current page', async () => {
    const { fixture, notificationService, operatorApiService } = await createComponent();
    operatorApiService.list.mockClear();

    fixture.componentInstance['updateStatus'](ACTIVE_OPERATOR);

    expect(operatorApiService.deactivate).toHaveBeenCalledWith(ACTIVE_OPERATOR.id);
    expect(notificationService.success).toHaveBeenCalledWith('Operador desactivado correctamente.');
    expect(operatorApiService.list).toHaveBeenCalledWith(0, 10);
  });

  it('activates an inactive user', async () => {
    const { fixture, notificationService, operatorApiService } = await createComponent();
    operatorApiService.list.mockClear();

    fixture.componentInstance['updateStatus']({ ...ACTIVE_OPERATOR, active: false });

    expect(operatorApiService.activate).toHaveBeenCalledWith(ACTIVE_OPERATOR.id);
    expect(notificationService.success).toHaveBeenCalledWith('Operador activado correctamente.');
  });

  it('deletes a user and reloads the list', async () => {
    const { fixture, notificationService, operatorApiService } = await createComponent();
    operatorApiService.list.mockClear();

    fixture.componentInstance['deleteOperator'](ACTIVE_OPERATOR);

    expect(operatorApiService.delete).toHaveBeenCalledWith(ACTIVE_OPERATOR.id);
    expect(notificationService.success).toHaveBeenCalledWith('Operador eliminado correctamente.');
    expect(operatorApiService.list).toHaveBeenCalledWith(0, 10);
  });

  it('forwards validation errors when a status change fails', async () => {
    const { fixture, notificationService, operatorApiService } = await createComponent();
    operatorApiService.deactivate.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { validationErrors: { role: 'No puedes modificar tu propio rol.' } } })),
    );

    fixture.componentInstance['updateStatus'](ACTIVE_OPERATOR);

    expect(notificationService.errorApi).toHaveBeenCalledWith(['No puedes modificar tu propio rol.']);
    expect(fixture.componentInstance['pendingActionId']()).toBeNull();
  });
});
