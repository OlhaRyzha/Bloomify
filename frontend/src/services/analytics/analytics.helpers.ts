import type { CartItemWithDetails } from '@/features/cart/cart.types';
import type { CatalogItem } from '@/types/catalog';

import type { AnalyticsItem } from './analytics.types';

export const toAnalyticsItem = (
  item: CatalogItem | CartItemWithDetails,
  quantity?: number
): AnalyticsItem => ({
  itemId: item.id,
  itemName: item.name,
  itemCategory: item.tag,
  price: item.price,
  quantity,
});
