import { Routes } from '@angular/router';
export const DASHBOARD_ROUTES: Routes = [
  { path: '', loadComponent: () => import('@features/dashboard/presentation/dashboard-page/dashboard-page').then((module) => module.DashboardPage) },
];
