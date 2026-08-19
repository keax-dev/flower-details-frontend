import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { Component, effect, inject, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Category, CategoryPayload } from '../../domain/model/category.model';

@Component({
  selector: 'app-category-form-dialog',
  imports: [
    BrnDialogImports,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmInputImports,
    HlmLabelImports,
    HlmTextareaImports,
    ReactiveFormsModule,
  ],
  templateUrl: './category-form-dialog.html',
})
export class CategoryFormDialog {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly category = input<Category | null>(null);
  readonly isOpen = input(false);
  readonly isSaving = input(false);

  readonly save = output<CategoryPayload>();
  readonly closed = output<void>();

  protected readonly categoryForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    active: [true],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.populateForm(this.category());
      }
    });
  }

  protected submit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.save.emit(this.categoryForm.getRawValue());
  }

  protected hasError(controlName: 'title' | 'description'): boolean {
    const control = this.categoryForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private populateForm(category: Category | null): void {
    this.categoryForm.reset(
      category === null
        ? { title: '', description: '', active: true }
        : {
            title: category.title,
            description: category.description,
            active: category.active,
          },
    );
  }
}
