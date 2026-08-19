import { Component, computed, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';

import { PageResponse } from '../../../../shared/domain/pagination/page-response.model';
import { Product } from '../../domain/model/product.model';

@Component({
  selector: 'app-product-list',
  imports: [HlmButtonImports],
  templateUrl: './product-list.html',
})
export class ProductList {
  readonly products = input.required<readonly Product[]>();
  readonly pageResponse = input<PageResponse<Product> | null>(null);
  readonly isLoading = input(false);
  readonly edit = output<Product>();
  readonly remove = output<Product>();
  readonly pageChange = output<number>();

  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly hasNextPage = computed(() => {
    const page = this.pageResponse();
    return page !== null && page.page + 1 < page.totalPages;
  });

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(price);
  }

  protected previousPage(): void {
    if (this.hasPreviousPage()) this.pageChange.emit(this.currentPage() - 1);
  }

  protected nextPage(): void {
    if (this.hasNextPage()) this.pageChange.emit(this.currentPage() + 1);
  }
}
