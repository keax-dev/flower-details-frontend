import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faCalendarDay, faChartLine, faClock, faXmark } from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { DashboardOverview } from '@features/dashboard/models/dashboard-overview.model';
import { DashboardApiService } from '@features/dashboard/services/dashboard-api.service';
import { orderStatusLabel } from '@features/order/models/order-status.config';
import { OrderStatus } from '@features/order/models/order-status.model';

@Component({
  selector: 'app-dashboard-page',
  imports: [CurrencyPipe, DatePipe, FontAwesomeModule, FormsModule, NzDatePickerModule, RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage {
  private readonly dashboardApiService = inject(DashboardApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly overview = signal<DashboardOverview | null>(null);
  protected readonly isLoading = signal(true);
  protected period: [Date, Date] = [this.startOfCurrentMonth(), new Date()];
  protected readonly faArrowRight = faArrowRight;
  protected readonly faCalendarDay = faCalendarDay;
  protected readonly faChartLine = faChartLine;
  protected readonly faClock = faClock;
  protected readonly faXmark = faXmark;
  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly statuses: readonly OrderStatus[] = [
    'GENERATED',
    'ASSIGNED',
    'IN_PREPARATION',
    'READY_FOR_DELIVERY',
    'ON_THE_WAY',
    'DELIVERED',
    'CANCELLED',
  ];
  constructor() {
    this.loadOverview();
  }

  protected applyPeriod(): void {
    const [from, to] = this.period;
    if (from > to) {
      this.notificationService.warning('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    this.loadOverview();
  }

  private loadOverview(): void {
    this.isLoading.set(true);
    this.dashboardApiService
      .overview(this.toIsoDate(this.period[0]), this.toIsoDate(this.period[1]))
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (overview) => this.overview.set(overview),
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible cargar el dashboard.')),
      });
  }
  protected statusTotal(status: OrderStatus): number {
    return this.overview()?.ordersByStatus.find((item) => item.status === status)?.total ?? 0;
  }

  private startOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
