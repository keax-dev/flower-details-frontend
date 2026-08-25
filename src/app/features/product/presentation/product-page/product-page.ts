import { Component, signal } from '@angular/core';
import { Product } from '@features/product/models/product.model';
import { ProductFormDialog } from '@features/product/presentation/product-form-dialog/product-form-dialog';
import { ProductImageDialog } from '@features/product/presentation/product-image-dialog/product-image-dialog';
import { ProductList } from '@features/product/presentation/product-list/product-list';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-product-page',
  imports: [FontAwesomeModule, ProductFormDialog, ProductImageDialog, ProductList],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage {
  protected readonly faPlus = faPlus;
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly isFormVisible = signal(false);
  protected readonly imageProduct = signal<Product | null>(null);
  protected readonly isImageManagerVisible = signal(false);
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

  protected handleProductSaved(product: Product): void {
    const isNewProduct = this.editingProduct() === null;
    this.closeForm();
    this.listRefreshVersion.update((version) => version + 1);
    if (isNewProduct) {
      this.openImageManager(product);
    }
  }

  protected openImageManager(product: Product): void {
    this.imageProduct.set(product);
    this.isImageManagerVisible.set(true);
  }

  protected closeImageManager(): void {
    this.isImageManagerVisible.set(false);
    this.imageProduct.set(null);
  }

  protected handleImagesUploaded(product: Product): void {
    this.imageProduct.set(product);
    this.listRefreshVersion.update((version) => version + 1);
  }
}
