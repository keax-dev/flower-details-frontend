export interface CartProduct {
  id: number;
  title: string;
  imageUrl: string | null;
  available: boolean;
}

export interface CartItem {
  id: number;
  product: CartProduct;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  id: number | null;
  items: readonly CartItem[];
  total: number;
}
