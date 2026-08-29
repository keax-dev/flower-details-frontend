import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/home/presentation/home-page/home-page').then((module) => module.HomePage),
  },
];
