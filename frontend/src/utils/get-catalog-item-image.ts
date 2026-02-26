import { FALLBACK_IMAGE_SRC } from '@/constants/image.constants';
import type { CatalogItem } from '@/types/catalog';

type CatalogItemWithImage = Pick<CatalogItem, 'image' | 'imageUrl'>;

export const getCatalogItemImage = (item: CatalogItemWithImage) =>
  item.image ?? item.imageUrl ?? FALLBACK_IMAGE_SRC;
