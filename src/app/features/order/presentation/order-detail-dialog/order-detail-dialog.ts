import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaperPlane, faUserPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { finalize } from 'rxjs';

import { AuthService } from '@features/auth/application/auth.service';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { fulfillmentTypeLabel, nextOrderStatus, orderStatusLabel } from '@features/order/models/order-status.config';
import { OrderAudit } from '@features/order/models/order-audit.model';
import { Order } from '@features/order/models/order.model';
import { Operator } from '@features/operator/models/operator.model';
import { OperatorApiService } from '@features/operator/services/operator-api.service';
import { OrderApiService } from '@features/order/services/order-api.service';

@Component({
  selector: 'app-order-detail-dialog',
  imports: [CurrencyPipe, DatePipe, FontAwesomeModule, NzInputModule, NzModalModule, NzPopconfirmModule, NzSelectModule, ReactiveFormsModule],
  templateUrl: './order-detail-dialog.html',
  styleUrl: './order-detail-dialog.css',
})
export class OrderDetailDialog {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly operatorApiService = inject(OperatorApiService);
  private readonly orderApiService = inject(OrderApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isOpen = input(false);
  readonly orderId = input<number | null>(null);
  readonly closed = output<void>();
  readonly changed = output<void>();

  protected readonly order = signal<Order | null>(null);
  protected readonly auditTrail = signal<readonly OrderAudit[]>([]);
  protected readonly operators = signal<readonly Operator[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isAssigning = signal(false);
  protected readonly isChangingStatus = signal(false);
  protected readonly isCancelling = signal(false);
  protected readonly faPaperPlane = faPaperPlane;
  protected readonly faUserPlus = faUserPlus;
  protected readonly faXmark = faXmark;
  protected readonly user = this.authService.user;
  protected readonly actionForm = this.formBuilder.group({
    operatorId: this.formBuilder.control<number | null>(null, Validators.required),
    cancellationReason: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(500)]),
  });

  constructor() {
    effect(() => {
      const id = this.orderId();
      if (this.isOpen() && id !== null) {
        untracked(() => {
          this.loadOrder(id);
          this.loadOperators();
        });
      } else if (!this.isOpen()) {
        this.order.set(null);
        this.auditTrail.set([]);
        this.actionForm.reset({ operatorId: null, cancellationReason: '' });
      }
    });
  }

  protected canAssign(): boolean {
    const order = this.order();
    const user = this.user();
    return order !== null && user !== null && (order.status === 'GENERATED' || (user.role === 'ADMIN' && order.status === 'ASSIGNED'));
  }

  protected canChangeStatus(): boolean {
    const order = this.order();
    const user = this.user();
    if (order === null || user === null || nextOrderStatus(order.status, order.fulfillmentType) === null) {
      return false;
    }

    return user.role === 'ADMIN' || order.assignedOperatorId === user.id;
  }

  protected canCancel(): boolean {
    const order = this.order();
    return this.user()?.role === 'ADMIN' && order !== null && order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
  }

  protected assign(): void {
    const order = this.order();
    const user = this.user();
    if (order === null || user === null) {
      return;
    }

    const operatorId = this.actionForm.controls.operatorId.value;
    if (user.role === 'ADMIN' && operatorId === null) {
      this.actionForm.controls.operatorId.markAsTouched();
      return;
    }

    this.isAssigning.set(true);
    this.orderApiService
      .assign(order.id, user.role === 'ADMIN' ? (operatorId ?? undefined) : undefined)
      .pipe(
        finalize(() => this.isAssigning.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.completeChange(user.role === 'ADMIN' ? 'Pedido asignado correctamente.' : 'Pedido tomado correctamente.'),
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible asignar el pedido.')),
      });
  }

  protected advanceStatus(): void {
    const order = this.order();
    if (order === null) {
      return;
    }

    const targetStatus = nextOrderStatus(order.status, order.fulfillmentType);
    if (targetStatus === null) {
      return;
    }

    this.isChangingStatus.set(true);
    this.orderApiService
      .changeStatus(order.id, targetStatus)
      .pipe(
        finalize(() => this.isChangingStatus.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.completeChange('Estado del pedido actualizado correctamente.'),
        error: (error: unknown) =>
          this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible actualizar el estado del pedido.')),
      });
  }

  protected cancel(): void {
    const order = this.order();
    if (order === null || !this.canCancel()) {
      return;
    }

    const reasonControl = this.actionForm.controls.cancellationReason;
    if (reasonControl.invalid) {
      reasonControl.markAsTouched();
      return;
    }

    this.isCancelling.set(true);
    this.orderApiService
      .cancel(order.id, reasonControl.getRawValue().trim())
      .pipe(
        finalize(() => this.isCancelling.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.completeChange('Pedido cancelado correctamente.'),
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible cancelar el pedido.')),
      });
  }

  protected nextStatusLabel(): string | null {
    const order = this.order();
    if (order === null) {
      return null;
    }

    const status = nextOrderStatus(order.status, order.fulfillmentType);
    return status === null ? null : orderStatusLabel(status);
  }

  protected orderStatusLabel = orderStatusLabel;
  protected fulfillmentTypeLabel = fulfillmentTypeLabel;

  protected auditActionLabel(audit: OrderAudit): string {
    switch (audit.action) {
      case 'CREATED':
        return 'Pedido Generado';
      case 'ASSIGNED':
        return 'Pedido Asignado';
      case 'STATUS_CHANGED':
        return audit.currentStatus === null ? 'Estado Actualizado' : `Estado: ${orderStatusLabel(audit.currentStatus)}`;
      case 'CANCELLED':
        return 'Pedido Cancelado';
    }
  }

  protected assignedOperatorName(operatorId: number | null): string {
    if (operatorId === null) {
      return 'Sin asignar';
    }

    const operator = this.operators().find((item) => item.id === operatorId);
    return operator === undefined ? `Operador #${operatorId}` : `${operator.names} ${operator.lastNames}`;
  }

  private loadOrder(id: number): void {
    this.isLoading.set(true);
    this.orderApiService
      .getById(id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.actionForm.reset({ operatorId: order.assignedOperatorId, cancellationReason: '' });
        },
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible cargar el pedido.')),
      });

    this.orderApiService
      .getAuditTrail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (auditTrail) => this.auditTrail.set(auditTrail),
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible cargar el historial del pedido.')),
      });
  }

  private loadOperators(): void {
    if (this.user()?.role !== 'ADMIN' || this.operators().length > 0) {
      return;
    }

    this.operatorApiService
      .list(0, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.operators.set(response.items.filter((operator) => operator.role === 'OPERATOR' && operator.active)),
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible cargar los operadores.')),
      });
  }

  private completeChange(message: string): void {
    const id = this.orderId();
    this.notificationService.success(message);
    this.changed.emit();
    if (id !== null) {
      this.loadOrder(id);
    }
  }
}
