import type { CartItemWithDetails } from '@/features/cart/cart.types';
import type { CatalogItem } from '@/types/catalog';

import type { AnalyticsItem } from './analytics.types';

type AnalyticsItemInput =
  | (Pick<CatalogItem, 'id' | 'name' | 'price'> & { tag?: string })
  | CartItemWithDetails;

export const toAnalyticsItem = (
  item: AnalyticsItemInput,
  quantity?: number
): AnalyticsItem => ({
  itemId: item.id,
  itemName: item.name,
  itemCategory: item.tag,
  price: item.price,
  quantity,
});
