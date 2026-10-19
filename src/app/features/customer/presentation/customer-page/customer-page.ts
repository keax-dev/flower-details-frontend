import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowRight, faEye, faPowerOff, faTrash } from '@fortawesome/free-solid-svg-icons';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { finalize } from 'rxjs';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { Customer } from '@features/customer/models/customer.model';
import { CustomerApiService } from '@features/customer/services/customer-api.service';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-customer-page',
  imports: [DatePipe, FontAwesomeModule, NzModalModule, NzPopconfirmModule],
  templateUrl: './customer-page.html',
  styleUrl: './customer-page.css',
})
export class CustomerPage {
  private readonly customerApiService = inject(CustomerApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly customers = signal<readonly Customer[]>([]);
  protected readonly pageResponse = signal<PageResponse<Customer> | null>(null);
  protected readonly selectedCustomer = signal<Customer | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly pendingActionId = signal<number | null>(null);
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faArrowRight = faArrowRight;
  protected readonly faEye = faEye;
  protected readonly faPowerOff = faPowerOff;
  protected readonly faTrash = faTrash;
  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly hasNextPage = computed(() => {
    const response = this.pageResponse();
    return response !== null && response.page + 1 < response.totalPages;
  });

  constructor() {
    this.loadCustomers();
  }

  protected openDetail(customer: Customer): void {
    this.selectedCustomer.set(customer);
  }

  protected closeDetail(): void {
    this.selectedCustomer.set(null);
  }

  protected updateStatus(customer: Customer): void {
    if (this.pendingActionId() !== null) {
      return;
    }
    this.pendingActionId.set(customer.id);
    const request$ = customer.active ? this.customerApiService.deactivate(customer.id) : this.customerApiService.activate(customer.id);
    request$
      .pipe(
        finalize(() => this.pendingActionId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedCustomer) => {
          this.customers.update((customers) => customers.map((item) => (item.id === updatedCustomer.id ? updatedCustomer : item)));
          if (this.selectedCustomer()?.id === updatedCustomer.id) {
            this.selectedCustomer.set(updatedCustomer);
          }
          this.notificationService.success(customer.active ? 'Cliente desactivado correctamente.' : 'Cliente activado correctamente.');
        },
        error: (error: unknown) =>
          this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible actualizar el estado del cliente.')),
      });
  }

  protected deleteCustomer(customer: Customer): void {
    if (this.pendingActionId() !== null) {
      return;
    }
    this.pendingActionId.set(customer.id);
    this.customerApiService
      .delete(customer.id)
      .pipe(
        finalize(() => this.pendingActionId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          if (this.selectedCustomer()?.id === customer.id) {
            this.closeDetail();
          }
          this.notificationService.success('Cliente eliminado correctamente.');
          this.loadCustomers(this.customers().length === 1 ? Math.max(0, this.currentPage() - 1) : this.currentPage());
        },
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible eliminar el cliente.')),
      });
  }

  protected previousPage(): void {
    if (this.hasPreviousPage() && !this.isLoading()) {
      this.loadCustomers(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage() && !this.isLoading()) {
      this.loadCustomers(this.currentPage() + 1);
    }
  }

  private loadCustomers(page = 0): void {
    this.isLoading.set(true);
    this.customerApiService
      .list(page, PAGE_SIZE)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.customers.set(response.items);
          this.pageResponse.set(response);
        },
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible cargar los clientes.')),
      });
  }
}
