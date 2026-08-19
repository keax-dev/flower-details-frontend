import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Category } from '../../../category/domain/model/category.model';
import { Product, ProductPayload } from '../../domain/model/product.model';

export interface ProductFormSubmission {
  payload: ProductPayload;
  files: File[];
}

@Component({
  selector: 'app-product-form-dialog',
  imports: [
    BrnDialogImports,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSelectImports,
    HlmTextareaImports,
    ReactiveFormsModule,
  ],
  templateUrl: './product-form-dialog.html',
})
export class ProductFormDialog {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  readonly product = input<Product | null>(null);
  readonly categories = input.required<readonly Category[]>();
  readonly isOpen = input(false);
  readonly isSaving = input(false);
  readonly save = output<ProductFormSubmission>();
  readonly closed = output<void>();
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly productForm = this.formBuilder.group({
    categoryId: [0, [Validators.required, Validators.min(1)]],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    active: [true],
  });
  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.populateForm(this.product());
      }
    });
  }
  protected setCategory(categoryId: number | null | undefined): void {
    this.productForm.controls.categoryId.setValue(categoryId ?? 0);
    this.productForm.controls.categoryId.markAsTouched();
  }
  protected selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles.set(Array.from(input.files ?? []));
  }
  protected submit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.save.emit({ payload: this.productForm.getRawValue(), files: this.selectedFiles() });
  }
  protected hasError(controlName: 'categoryId' | 'title' | 'description' | 'price'): boolean {
    const control = this.productForm.controls[controlName];
    return control.invalid && control.touched;
  }
  private populateForm(product: Product | null): void {
    this.productForm.reset(
      product === null
        ? { categoryId: 0, title: '', description: '', price: 0, active: true }
        : {
            categoryId: product.category.id,
            title: product.title,
            description: product.description,
            price: product.price,
            active: product.active,
          },
    );
    this.selectedFiles.set([]);
  }
}
