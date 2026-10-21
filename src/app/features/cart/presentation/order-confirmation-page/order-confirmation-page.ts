import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { Order } from '@features/order/models/order.model';
import { OrderApiService } from '@features/order/services/order-api.service';

@Component({
  selector: 'app-order-confirmation-page',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './order-confirmation-page.html',
  styleUrl: './order-confirmation-page.css',
})
export class OrderConfirmationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly orderApi = inject(OrderApiService);
  private readonly destroyRef = inject(DestroyRef);
  private orderSubscription?: Subscription;
  private orderId: number | null = null;

  protected readonly order = signal<Order | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly canRetry = signal(false);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const rawId = params.get('id');
      const id = Number(rawId);
      this.orderId = rawId !== null && Number.isSafeInteger(id) && id > 0 ? id : null;
      this.loadOrder();
    });
  }

  protected retry(): void {
    this.loadOrder();
  }

  private loadOrder(): void {
    this.orderSubscription?.unsubscribe();
    this.order.set(null);
    this.errorMessage.set(null);
    this.canRetry.set(false);

    if (this.orderId === null) {
      this.isLoading.set(false);
      this.errorMessage.set('El pedido solicitado no es válido.');
      return;
    }

    this.isLoading.set(true);
    this.orderSubscription = this.orderApi
      .getById(this.orderId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => this.order.set(order),
        error: () => {
          this.errorMessage.set('No fue posible cargar el pedido. Inténtalo nuevamente.');
          this.canRetry.set(true);
        },
      });
  }
}
