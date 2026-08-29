import { Routes } from '@angular/router';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/product/presentation/product-page/product-page').then((module) => module.ProductPage),
  },
];
