import { Component, computed, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { PageResponse } from '@shared/domain/pagination/page-response.model';
import { Category } from '@features/category/domain/model/category.model';

@Component({
  selector: 'app-category-list',
  imports: [HlmButtonImports],
  templateUrl: './category-list.html',
})
export class CategoryList {
  readonly pageResponse = input<PageResponse<Category> | null>(null);
  readonly categories = input.required<readonly Category[]>();
  readonly isLoading = input(false);

  readonly pageChange = output<number>();
  readonly remove = output<Category>();
  readonly edit = output<Category>();

  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasNextPage = computed(() => {
    const page = this.pageResponse();
    return page !== null && page.page + 1 < page.totalPages;
  });

  protected previousPage(): void {
    if (this.hasPreviousPage()) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
