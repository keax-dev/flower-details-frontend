import { Routes } from '@angular/router';

export const OPERATOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/operator/presentation/operator-page/operator-page').then((module) => module.OperatorPage),
  },
];
