import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowRight, faEye, faFilter, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { NzInputModule } from 'ng-zorro-antd/input';
import { finalize, Subscription } from 'rxjs';

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

function validateDateRange(control: AbstractControl): ValidationErrors | null {
  const createdFrom: unknown = control.get('createdFrom')?.value;
  const createdTo: unknown = control.get('createdTo')?.value;
  return typeof createdFrom === 'string' && typeof createdTo === 'string' && createdFrom !== '' && createdTo !== '' && createdFrom > createdTo
    ? { dateRange: true }
    : null;
}

@Component({
  selector: 'app-order-list',
  imports: [CurrencyPipe, DatePipe, FontAwesomeModule, ReactiveFormsModule, NzInputModule],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderList {
  private readonly orderApiService = inject(OrderApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private listSubscription?: Subscription;
  private appliedQuery: OrderQuery = {};

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

  protected readonly filterForm = this.formBuilder.group(
    {
      q: ['', [Validators.maxLength(120)]],
      customerId: [null as number | null, [Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      operatorId: [null as number | null, [Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
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
    effect(() => {
      this.refreshVersion();
      this.loadOrders();
    });
  }

  protected applyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    const value = this.filterForm.getRawValue();
    this.appliedQuery = {
      ...(value.q.trim() && { q: value.q.trim() }),
      ...(value.customerId !== null && { customerId: value.customerId }),
      ...(value.operatorId !== null && { operatorId: value.operatorId }),
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
      customerId: null,
      operatorId: null,
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
    this.listSubscription?.unsubscribe();
    this.isLoading.set(true);
    this.listSubscription = this.orderApiService
      .list(page, PAGE_SIZE, this.appliedQuery)
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
}
