export interface ProductCategory {
  id: number;
  title: string;
}

export interface ProductImage {
  id: number;
  url: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
}

export interface Product {
  id: number;
  category: ProductCategory;
  title: string;
  description: string;
  price: number;
  active: boolean;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductPayload {
  categoryId: number;
  title: string;
  description: string;
  price: number;
  active: boolean;
}
