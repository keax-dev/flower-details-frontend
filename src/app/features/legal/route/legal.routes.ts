import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: 'terms',
    loadComponent: () => import('@features/legal/presentation/terms-page/terms-page').then((module) => module.TermsPage),
  },
  {
    path: 'privacy',
    loadComponent: () => import('@features/legal/presentation/privacy-page/privacy-page').then((module) => module.PrivacyPage),
  },
];
