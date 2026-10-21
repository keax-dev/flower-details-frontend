import { Routes } from '@angular/router';

export const CUSTOMER_ORDER_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('@features/order/presentation/customer-order-list-page/customer-order-list-page').then((module) => module.CustomerOrderListPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('@features/order/presentation/customer-order-detail-page/customer-order-detail-page').then((module) => module.CustomerOrderDetailPage),
  },
];
