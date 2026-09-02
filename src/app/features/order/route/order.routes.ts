import { Routes } from '@angular/router';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/order/presentation/order-page/order-page').then((module) => module.OrderPage),
  },
];
