import { CategoryFormDialog } from '@features/category/presentation/category-form-dialog/category-form-dialog';
import { Component, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { CategoryList } from '@features/category/presentation/category-list/category-list';
import { Category } from '@app/features/category/models/category.model';


@Component({
  selector: 'app-category-page',
  imports: [HlmButtonImports, CategoryFormDialog, CategoryList],
  templateUrl: './category-page.html',
})
export class CategoryPage {
  protected readonly listRefreshVersion = signal(0);
  protected readonly editingCategory = signal<Category | null>(null);
  protected readonly isFormVisible = signal(false);

  protected openCreateForm(): void {
    this.editingCategory.set(null);
    this.isFormVisible.set(true);
  }

  protected openEditForm(category: Category): void {
    this.editingCategory.set(category);
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.editingCategory.set(null);
    this.isFormVisible.set(false);
  }

  protected refreshList(): void {
    this.closeForm();
    this.listRefreshVersion.update((version) => version + 1);
  }
}
