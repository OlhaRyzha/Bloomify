import type { StaticImageData } from 'next/image';
import type { ProductItem } from '@/features/catalog/api/products.shemas';

// API shape is defined by ProductItem (derived from Zod schema + satisfies ApiProduct).
// CatalogItem extends it with an optional static image field used only in frontend demos.
export type CatalogItem = ProductItem & {
  image?: StaticImageData | string;
};
