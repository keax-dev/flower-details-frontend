import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/catalog/presentation/catalog-page/catalog-page').then((module) => module.CatalogPage),
  },
  {
    path: ':id',
    loadComponent: () => import('@features/catalog/presentation/catalog-detail-page/catalog-detail-page').then((module) => module.CatalogDetailPage),
  },
];
