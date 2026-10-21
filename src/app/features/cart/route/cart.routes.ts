import { Routes } from '@angular/router';

export const CART_ROUTES: Routes = [
  {
    path: 'checkout',
    loadComponent: () => import('@features/cart/presentation/checkout-page/checkout-page').then((module) => module.CheckoutPage),
  },
  {
    path: 'confirmation/:id',
    loadComponent: () =>
      import('@features/cart/presentation/order-confirmation-page/order-confirmation-page').then((module) => module.OrderConfirmationPage),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('@features/cart/presentation/cart-page/cart-page').then((module) => module.CartPage),
  },
];
