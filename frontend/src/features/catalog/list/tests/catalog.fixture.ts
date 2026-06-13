import type { Locale } from '@/locales/translations';

import { DEFAULT_PER_PAGE } from '../catalog.config';
import type { CatalogQueryParams } from '../types';
import { availableTags } from './catalog.test-utils';

export const catalogState = { availableTags, pageSize: DEFAULT_PER_PAGE };

export const testCatalogParams1: CatalogQueryParams = {
  page: 3,
  perPage: 12,
  search: 'rose',
  sort: 'price-desc',
  tag: 'classic',
};

export const testCatalogParams2: CatalogQueryParams = {
  page: 2,
  perPage: 9,
  search: '  lily  ',
  sort: 'name-asc',
  tag: 'wedding',
};

export const testCatalogParams3 = {
  page: 2,
  perPage: 9,
};

export const testCatalogParams4: CatalogQueryParams & { lang: Locale } = {
  lang: 'en',
  page: 2,
  perPage: 9,
  search: 'white',
  sort: 'price-asc',
  tag: 'classic',
};

export const testProductItem1 = {
  id: 'rose-bouquet',
  name: 'Rose bouquet',
  description: 'Fresh roses and seasonal greenery.',
  price: '2500',
  tag: 'roses',
};
export const testProductItem2 = {
  id: 'white-harmony',
  name: 'White harmony',
  description: 'White lilies and eucalyptus.',
  price: '1200',
  tag: 'white',
};

export const testProductItem3 = {
  id: 'rose-bouquet',
  name: 'Rose bouquet',
  description: 'Classic red roses',
  price: '2000',
  tag: 'classic',
};
export const testProductItem4 = {
  id: 'white-lily',
  name: 'White lily',
  description: 'Soft white flowers',
  price: '1500',
  tag: 'white',
};
export const testProductItem5 = {
  id: 'sunflower',
  name: 'Sunflower',
  description: 'Bright yellow bouquet',
  price: '1200',
  tag: 'summer',
};
