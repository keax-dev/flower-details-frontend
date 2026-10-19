import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/customer/presentation/customer-page/customer-page').then((module) => module.CustomerPage),
  },
];
