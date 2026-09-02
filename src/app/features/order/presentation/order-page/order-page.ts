import { Component, signal } from '@angular/core';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { OrderDetailDialog } from '@features/order/presentation/order-detail-dialog/order-detail-dialog';
import { OrderList } from '@features/order/presentation/order-list/order-list';

@Component({
  selector: 'app-order-page',
  imports: [FontAwesomeModule, OrderDetailDialog, OrderList],
  templateUrl: './order-page.html',
  styleUrl: './order-page.css',
})
export class OrderPage {
  protected readonly faClipboardList = faClipboardList;
  protected readonly refreshVersion = signal(0);
  protected readonly selectedOrderId = signal<number | null>(null);
  protected readonly isDetailVisible = signal(false);

  protected openDetail(orderId: number): void {
    this.selectedOrderId.set(orderId);
    this.isDetailVisible.set(true);
  }

  protected closeDetail(): void {
    this.isDetailVisible.set(false);
    this.selectedOrderId.set(null);
  }

  protected refreshOrders(): void {
    this.refreshVersion.update((version) => version + 1);
  }
}
