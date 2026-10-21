import { CurrencyPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { OrderAudit } from '@features/order/models/order-audit.model';
import { Order } from '@features/order/models/order.model';
import { fulfillmentTypeLabel, orderStatusLabel } from '@features/order/models/order-status.config';
import { OrderApiService } from '@features/order/services/order-api.service';

@Component({
  selector: 'app-customer-order-detail-page',
  imports: [CurrencyPipe, DatePipe, NgOptimizedImage, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-order-detail-page.html',
  styleUrl: './customer-order-detail-page.css',
})
export class CustomerOrderDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly orderApi = inject(OrderApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly backLink = viewChild.required<ElementRef<HTMLAnchorElement>>('backLink');
  private readonly reasonField = viewChild<ElementRef<HTMLTextAreaElement>>('reasonField');
  private orderSubscription?: Subscription;
  private auditSubscription?: Subscription;
  private orderId: number | null = null;

  protected readonly order = signal<Order | null>(null);
  protected readonly auditTrail = signal<readonly OrderAudit[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isAuditLoading = signal(false);
  protected readonly isCancelling = signal(false);
  protected readonly isCancellationOpen = signal(false);
  protected readonly errorMessage = signal<string | string[] | null>(null);
  protected readonly canRetry = signal(false);
  protected readonly auditError = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessages = computed(() => {
    const message = this.errorMessage();
    return message === null ? [] : Array.isArray(message) ? message : [message];
  });
  protected readonly cancellationReason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500), (control) => (control.value.trim() ? null : { blank: true })],
  });
  protected readonly statusLabel = orderStatusLabel;
  protected readonly fulfillmentLabel = fulfillmentTypeLabel;

  constructor() {
    effect(() => {
      if (this.isCancellationOpen()) this.reasonField()?.nativeElement.focus();
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const rawId = params.get('id');
      const id = Number(rawId);
      this.orderId = rawId !== null && Number.isSafeInteger(id) && id > 0 ? id : null;
      this.successMessage.set(null);
      this.loadOrder();
    });
  }

  protected retry(): void {
    this.loadOrder();
  }

  protected retryAudit(): void {
    if (this.orderId !== null) this.loadAudit(this.orderId);
  }

  protected openCancellation(): void {
    if (this.order()?.status !== 'GENERATED') return;
    this.errorMessage.set(null);
    this.cancellationReason.reset('');
    this.isCancellationOpen.set(true);
  }

  protected closeCancellation(): void {
    this.isCancellationOpen.set(false);
    this.cancellationReason.reset('');
  }

  protected cancelOrder(): void {
    const order = this.order();
    if (order?.status !== 'GENERATED' || this.isCancelling()) return;
    if (this.cancellationReason.invalid) {
      this.cancellationReason.markAsTouched();
      this.reasonField()?.nativeElement.focus();
      return;
    }

    this.errorMessage.set(null);
    this.isCancelling.set(true);
    this.orderApi
      .cancel(order.id, this.cancellationReason.value.trim())
      .pipe(
        finalize(() => this.isCancelling.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.closeCancellation();
          this.successMessage.set('Pedido cancelado correctamente.');
          this.backLink().nativeElement.focus();
          this.loadOrder();
        },
        error: (error: unknown) =>
          this.errorMessage.set(resolveApiErrorMessage(error, 'No fue posible cancelar el pedido. Actualiza e inténtalo nuevamente.')),
      });
  }

  protected auditActionLabel(audit: OrderAudit): string {
    switch (audit.action) {
      case 'CREATED':
        return 'Pedido generado';
      case 'ASSIGNED':
        return 'Pedido asignado';
      case 'STATUS_CHANGED':
        return audit.currentStatus === null ? 'Estado actualizado' : `Estado: ${orderStatusLabel(audit.currentStatus)}`;
      case 'CANCELLED':
        return 'Pedido cancelado';
    }
  }

  private loadOrder(): void {
    this.orderSubscription?.unsubscribe();
    this.auditSubscription?.unsubscribe();
    this.order.set(null);
    this.auditTrail.set([]);
    this.auditError.set(false);
    this.errorMessage.set(null);
    this.canRetry.set(false);
    this.isCancellationOpen.set(false);

    if (this.orderId === null) {
      this.isLoading.set(false);
      this.errorMessage.set('El pedido solicitado no es válido.');
      return;
    }

    this.isLoading.set(true);
    const id = this.orderId;
    this.orderSubscription = this.orderApi
      .getById(id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.loadAudit(id);
        },
        error: (error: unknown) => {
          this.errorMessage.set(resolveApiErrorMessage(error, 'No fue posible cargar este pedido. Inténtalo nuevamente.'));
          this.canRetry.set(true);
        },
      });
  }

  private loadAudit(id: number): void {
    this.auditSubscription?.unsubscribe();
    this.auditTrail.set([]);
    this.auditError.set(false);
    this.isAuditLoading.set(true);
    this.auditSubscription = this.orderApi
      .getAuditTrail(id)
      .pipe(
        finalize(() => this.isAuditLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (audit) => this.auditTrail.set(audit),
        error: () => this.auditError.set(true),
      });
  }
}
