import type { ProductItem } from '@/schemas/products.shemas';
import type { CatalogItem } from '@/types/catalog';
import { catalogItems } from './catalog-items';

const FALLBACK_IMAGE = catalogItems[0]?.image;

export const mapProductToCatalogItem = (product: ProductItem): CatalogItem => ({
  id: product.id,
  name: product.name,
  description: product.description ?? '',
  price: product.price,
  image: product.imageUrl ?? FALLBACK_IMAGE ?? '',
  tag: product.tag ?? 'Букет',
});
