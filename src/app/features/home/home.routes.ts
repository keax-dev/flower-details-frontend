import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/home-page/home-page').then((module) => module.HomePage),
  },
];
