import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@features/auth/presentation/login-page/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('@features/auth/presentation/register-page/register-page').then((module) => module.RegisterPage),
  },
];
