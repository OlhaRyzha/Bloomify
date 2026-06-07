import type { CatalogQueryParams } from './catalog.types';

export const DEFAULT_CATALOG_PARAMS: CatalogQueryParams = {
  page: 1,
  perPage: 6,
  search: '',
  sort: 'default',
  tag: 'all',
};
