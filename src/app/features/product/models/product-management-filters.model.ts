export interface ProductManagementFilters {
  q?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  active?: boolean;
  sortBy?: 'createdAt' | 'title' | 'price';
  direction?: 'asc' | 'desc';
}
