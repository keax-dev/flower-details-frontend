import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('@features/admin/admin.routes').then((module) => module.ADMIN_ROUTES),
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
