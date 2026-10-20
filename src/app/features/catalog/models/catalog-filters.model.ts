export interface CatalogFilters {
  q?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'title' | 'price';
  direction?: 'asc' | 'desc';
}
