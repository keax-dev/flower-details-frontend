import { Routes } from '@angular/router';

export const CART_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/cart/presentation/cart-page/cart-page').then((module) => module.CartPage),
  },
];
