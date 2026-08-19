import { Component, computed, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';

import { Category } from '@features/category/domain/model/category.model';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

@Component({
  selector: 'app-category-list',
  imports: [HlmButtonImports],
  templateUrl: './category-list.html',
})
export class CategoryList {
  readonly categories = input.required<readonly Category[]>();
  readonly pageResponse = input<PageResponse<Category> | null>(null);
  readonly isLoading = input(false);

  readonly edit = output<Category>();
  readonly remove = output<Category>();
  readonly pageChange = output<number>();

  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
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
