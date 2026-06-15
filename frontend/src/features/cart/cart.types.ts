import type { CatalogItem } from '@/types/catalog';

export type CartItemWithDetails = CatalogItem & {
  quantity: number;
};

export type CartSummaryModel = {
  cartItems: CartItemWithDetails[];
  deliveryCost: number;
  discount: number;
  itemCount: number;
  subtotal: number;
  total: number;
};
