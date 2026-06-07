import type { ProductItem } from '@/features/catalog/api/products.shemas';

export const createProductItem = (
  overrides: Partial<ProductItem> = {}
): ProductItem => ({
  id: 'rose-bouquet',
  name: 'Rose bouquet',
  description: 'Fresh roses and seasonal greenery.',
  price: '1750',
  imageUrl: '/images/rose-bouquet.jpg',
  tag: 'roses',
  ...overrides,
});
