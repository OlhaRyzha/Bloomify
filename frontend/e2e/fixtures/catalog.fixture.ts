import type { ProductItem } from '@/features/catalog/api/products.shemas';

export const e2eCatalogItems: ProductItem[] = [
  {
    id: 'white-harmony',
    name: 'Біла гармонія',
    description: 'Класична композиція з білих лілій та троянд',
    price: '1650',
    discountedPrice: null,
    isSale: false,
    imageUrl: '/images/white-harmony.jpg',
    tag: 'Класика',
  },
  {
    id: 'blue-harmony',
    name: 'Блакитна гармонія',
    description: 'Витончений букет із білих лілій та гортензії',
    price: '1750',
    discountedPrice: null,
    isSale: false,
    imageUrl: '/images/blue-harmony.jpg',
    tag: 'Класика',
  },
];

export const e2ePrimaryCatalogItem = e2eCatalogItems[0];
