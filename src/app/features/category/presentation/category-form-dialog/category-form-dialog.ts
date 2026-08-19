import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, effect, inject, input, output } from '@angular/core';
import { Category } from '@app/features/category/models/category.model';
import { CategoryPayload } from '@app/features/category/models/category-payload.model';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';

@Component({
  selector: 'app-category-form-dialog',
  imports: [
    ReactiveFormsModule,
    HlmCheckboxImports,
    HlmTextareaImports,
    BrnDialogImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
  ],
  templateUrl: './category-form-dialog.html',
})
export class CategoryFormDialog {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly category = input<Category | null>(null);
  readonly isSaving = input(false);
  readonly isOpen = input(false);

  readonly closed = output<void>();
  readonly save = output<CategoryPayload>();

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
