export interface OrderItem {
  id: number;
  productId: number;
  productTitle: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
