import { Routes } from '@angular/router';
import { roleGuard } from '@features/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: 'catalog',
    loadChildren: () => import('@features/catalog/route/catalog.routes').then((module) => module.CATALOG_ROUTES),
  },
  {
    path: 'cart',
    canActivate: [roleGuard],
    data: { roles: ['CUSTOMER'] },
    loadChildren: () => import('@features/cart/route/cart.routes').then((module) => module.CART_ROUTES),
  },
  {
    path: 'my-orders',
    canActivate: [roleGuard],
    data: { roles: ['CUSTOMER'] },
    loadChildren: () => import('@features/order/route/customer-order.routes').then((module) => module.CUSTOMER_ORDER_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () => import('@features/dashboard/route/dashboard.routes').then((module) => module.DASHBOARD_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('@features/admin/admin.routes').then((module) => module.ADMIN_ROUTES),
  },
  {
    path: 'orders',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'OPERATOR'] },
    loadChildren: () => import('@features/order/route/order.routes').then((module) => module.ORDER_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('@app/features/auth/route/auth.routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: 'home',
    loadChildren: () => import('@app/features/home/route/home.routes').then((module) => module.HOME_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
