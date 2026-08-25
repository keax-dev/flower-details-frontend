import { CategoryFormDialog } from '@features/category/presentation/category-form-dialog/category-form-dialog';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Component, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CategoryList } from '@features/category/presentation/category-list/category-list';
import { Category } from '@app/features/category/models/category.model';

@Component({
  selector: 'app-category-page',
  imports: [NzButtonModule, FontAwesomeModule, CategoryFormDialog, CategoryList],
  templateUrl: './category-page.html',
  styleUrl: './category-page.css',
})
export class CategoryPage {
  protected readonly faPlus = faPlus;
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
