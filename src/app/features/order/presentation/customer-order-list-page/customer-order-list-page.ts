import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { CustomerOrderQuery } from '@features/order/models/customer-order-query.model';
import { FulfillmentType } from '@features/order/models/fulfillment-type.model';
import { Order } from '@features/order/models/order.model';
import { FULFILLMENT_TYPE_OPTIONS, fulfillmentTypeLabel, ORDER_STATUS_OPTIONS, orderStatusLabel } from '@features/order/models/order-status.config';
import { OrderStatus } from '@features/order/models/order-status.model';
import { OrderApiService } from '@features/order/services/order-api.service';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

const PAGE_SIZE = 10;

function validateDateRange(control: AbstractControl): ValidationErrors | null {
  const from: unknown = control.get('createdFrom')?.value;
  const to: unknown = control.get('createdTo')?.value;
  return typeof from === 'string' && typeof to === 'string' && from !== '' && to !== '' && from > to ? { dateRange: true } : null;
}

@Component({
  selector: 'app-customer-order-list-page',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-order-list-page.html',
  styleUrl: './customer-order-list-page.css',
})
export class CustomerOrderListPage {
  private readonly orderApi = inject(OrderApiService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private listSubscription?: Subscription;
  private appliedQuery: CustomerOrderQuery = {};
  private requestedPage = 0;

  protected readonly orders = signal<readonly Order[]>([]);
  protected readonly pageResponse = signal<PageResponse<Order> | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly statusOptions = ORDER_STATUS_OPTIONS;
  protected readonly fulfillmentOptions = FULFILLMENT_TYPE_OPTIONS;
  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly hasNextPage = computed(() => {
    const response = this.pageResponse();
    return response !== null && response.page + 1 < response.totalPages;
  });
  protected readonly filterForm = this.formBuilder.group(
    {
      q: ['', [Validators.maxLength(120)]],
      status: ['' as OrderStatus | ''],
      fulfillmentType: ['' as FulfillmentType | ''],
      createdFrom: [''],
      createdTo: [''],
      sortBy: ['createdAt' as 'createdAt' | 'total' | 'status'],
      direction: ['desc' as 'asc' | 'desc'],
    },
    { validators: validateDateRange },
  );

  constructor() {
    this.loadOrders();
  }

  protected applyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    const value = this.filterForm.getRawValue();
    this.appliedQuery = {
      ...(value.q.trim() && { q: value.q.trim() }),
      ...(value.status && { status: value.status }),
      ...(value.fulfillmentType && { fulfillmentType: value.fulfillmentType }),
      ...(value.createdFrom && { createdFrom: value.createdFrom }),
      ...(value.createdTo && { createdTo: value.createdTo }),
      sortBy: value.sortBy,
      direction: value.direction,
    };
    this.loadOrders();
  }

  protected clearFilters(): void {
    this.filterForm.reset({
      q: '',
      status: '',
      fulfillmentType: '',
      createdFrom: '',
      createdTo: '',
      sortBy: 'createdAt',
      direction: 'desc',
    });
    this.appliedQuery = {};
    this.loadOrders();
  }

  protected previousPage(): void {
    if (this.hasPreviousPage() && !this.isLoading()) this.loadOrders(this.currentPage() - 1);
  }

  protected nextPage(): void {
    if (this.hasNextPage() && !this.isLoading()) this.loadOrders(this.currentPage() + 1);
  }

  protected retry(): void {
    this.loadOrders(this.requestedPage);
  }

  protected readonly statusLabel = orderStatusLabel;
  protected readonly fulfillmentLabel = fulfillmentTypeLabel;

  private loadOrders(page = 0): void {
    this.listSubscription?.unsubscribe();
    this.requestedPage = page;
    this.orders.set([]);
    this.pageResponse.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(true);
    this.listSubscription = this.orderApi
      .listMine(page, PAGE_SIZE, this.appliedQuery)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.orders.set(response.items);
          this.pageResponse.set(response);
        },
        error: () => this.errorMessage.set('No fue posible cargar tus pedidos. Inténtalo nuevamente.'),
      });
  }
}
