import { roleGuard } from '@app/features/auth/guards/role.guard';
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: 'categories',
        loadChildren: () =>
          import('@app/features/category/route/category.routes').then(
            (module) => module.CATEGORY_ROUTES,
          ),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('@app/features/product/route/product.routes').then(
            (module) => module.PRODUCT_ROUTES,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'categories' },
    ],
  },
];
