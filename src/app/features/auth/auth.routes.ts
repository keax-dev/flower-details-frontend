import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./presentation/login-page/login-page').then((module) => module.LoginPage),
  },
];
