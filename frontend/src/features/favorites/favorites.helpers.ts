import type { CatalogItem } from '@/types/catalog';

export const getFavoriteCatalogItems = (
  items: CatalogItem[],
  favoriteIds: string[]
): CatalogItem[] => {
  const favoriteIdSet = new Set(favoriteIds);

  return items.filter((item) => favoriteIdSet.has(item.id));
};
