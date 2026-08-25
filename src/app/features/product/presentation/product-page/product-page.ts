import { Component, signal } from '@angular/core';
import { Product } from '@features/product/models/product.model';
import { ProductFormDialog } from '@features/product/presentation/product-form-dialog/product-form-dialog';
import { ProductList } from '@features/product/presentation/product-list/product-list';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-product-page',
  imports: [NzButtonModule, FontAwesomeModule, ProductFormDialog, ProductList],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage {
  protected readonly faPlus = faPlus;
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly isFormVisible = signal(false);
  protected readonly listRefreshVersion = signal(0);

  protected openCreateForm(): void {
    this.editingProduct.set(null);
    this.isFormVisible.set(true);
  }

  protected openEditForm(product: Product): void {
    this.editingProduct.set(product);
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.editingProduct.set(null);
    this.isFormVisible.set(false);
  }

  protected refreshList(): void {
    this.closeForm();
    this.listRefreshVersion.update((version) => version + 1);
  }
}
