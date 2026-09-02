import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowRight, faEye, faFilter, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { finalize } from 'rxjs';

import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { FULFILLMENT_TYPE_OPTIONS, fulfillmentTypeLabel, ORDER_STATUS_OPTIONS, orderStatusLabel } from '@features/order/models/order-status.config';
import { FulfillmentType } from '@features/order/models/fulfillment-type.model';
import { OrderQuery } from '@features/order/models/order-query.model';
import { OrderStatus } from '@features/order/models/order-status.model';
import { Order } from '@features/order/models/order.model';
import { OrderApiService } from '@features/order/services/order-api.service';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-order-list',
  imports: [CurrencyPipe, DatePipe, FontAwesomeModule, FormsModule, NzInputModule, NzSelectModule],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderList {
  private readonly orderApiService = inject(OrderApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly refreshVersion = input(0);
  readonly details = output<number>();

  protected readonly orders = signal<readonly Order[]>([]);
  protected readonly pageResponse = signal<PageResponse<Order> | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faArrowRight = faArrowRight;
  protected readonly faEye = faEye;
  protected readonly faFilter = faFilter;
  protected readonly faRotateLeft = faRotateLeft;
  protected readonly statusOptions = ORDER_STATUS_OPTIONS;
  protected readonly fulfillmentTypeOptions = FULFILLMENT_TYPE_OPTIONS;
  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly hasNextPage = computed(() => {
    const page = this.pageResponse();
    return page !== null && page.page + 1 < page.totalPages;
  });

  protected searchQuery = '';
  protected selectedStatus: OrderStatus | null = null;
  protected selectedFulfillmentType: FulfillmentType | null = null;

  constructor() {
    effect(() => {
      this.refreshVersion();
      this.loadOrders();
    });
  }

  protected applyFilters(): void {
    this.loadOrders();
  }

  protected clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedFulfillmentType = null;
    this.loadOrders();
  }

  protected previousPage(): void {
    if (this.hasPreviousPage()) {
      this.loadOrders(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage()) {
      this.loadOrders(this.currentPage() + 1);
    }
  }

  protected orderStatusLabel = orderStatusLabel;
  protected fulfillmentTypeLabel = fulfillmentTypeLabel;

  private loadOrders(page = 0): void {
    this.isLoading.set(true);
    this.orderApiService
      .list(page, PAGE_SIZE, this.query())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.orders.set(response.items);
          this.pageResponse.set(response);
        },
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible cargar los pedidos.')),
      });
  }

  private query(): OrderQuery {
    return {
      q: this.searchQuery,
      status: this.selectedStatus ?? undefined,
      fulfillmentType: this.selectedFulfillmentType ?? undefined,
    };
  }
}
