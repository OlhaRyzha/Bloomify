import {
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
} from '@/constants/delivery.constants';
import type { CatalogItem } from '@/types/catalog';
import type { CartItem } from '../store/cart.store';
import type { CartItemWithDetails, CartSummaryModel } from '../cart.types';

export const getCartItemsWithDetails = (
  items: CartItem[],
  catalogItems: CatalogItem[]
): CartItemWithDetails[] => {
  const catalogItemsById = new Map(
    catalogItems.map((catalogItem) => [catalogItem.id, catalogItem])
  );

  return items.reduce<CartItemWithDetails[]>((acc, item) => {
    const catalogItem = catalogItemsById.get(item.id);

    if (!catalogItem) {
      return acc;
    }

    acc.push({ ...catalogItem, quantity: item.quantity });
    return acc;
  }, []);
};

export const getCartSubtotal = (items: CartItemWithDetails[]) =>
  items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

export const getCartItemCount = (items: CartItemWithDetails[]) =>
  items.reduce((total, item) => total + item.quantity, 0);

export const getCartDeliveryCost = (subtotal: number) =>
  subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;

export const getCartTotal = (
  subtotal: number,
  deliveryCost: number,
  discount = 0
) => Math.max(subtotal + deliveryCost - discount, 0);

export const getCartSummary = (
  items: CartItem[],
  catalogItems: CatalogItem[],
  discount = 0
): CartSummaryModel => {
  const cartItems = getCartItemsWithDetails(items, catalogItems);
  const subtotal = getCartSubtotal(cartItems);
  const itemCount = getCartItemCount(cartItems);
  const deliveryCost = getCartDeliveryCost(subtotal);
  const total = getCartTotal(subtotal, deliveryCost, discount);

  return {
    cartItems,
    deliveryCost,
    discount,
    itemCount,
    subtotal,
    total,
  };
};
