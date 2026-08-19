import { Routes } from '@angular/router';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/product-page/product-page').then((module) => module.ProductPage),
  },
];
