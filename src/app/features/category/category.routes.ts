import { Routes } from '@angular/router';

export const CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/category-page/category-page').then((module) => module.CategoryPage),
  },
];
