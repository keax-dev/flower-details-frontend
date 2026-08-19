import { Routes } from '@angular/router';

import { roleGuard } from '@features/auth/presentation/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: 'categories',
        loadChildren: () =>
          import('@features/category/category.routes').then((module) => module.CATEGORY_ROUTES),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('@features/product/product.routes').then((module) => module.PRODUCT_ROUTES),
      },
      { path: '', pathMatch: 'full', redirectTo: 'categories' },
    ],
  },
];
