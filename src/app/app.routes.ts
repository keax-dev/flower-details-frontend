import { Routes } from '@angular/router';
import { roleGuard } from '@features/auth/guards/role.guard';

export const routes: Routes = [
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
