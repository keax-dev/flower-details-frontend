import { ProductCategory } from '@features/product/models/product-category.model';
import { ProductImage } from '@features/product/models/product-image.model';

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
