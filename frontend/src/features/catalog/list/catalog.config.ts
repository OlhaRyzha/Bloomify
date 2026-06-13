import type { CatalogQueryParams } from './types';

export const DEFAULT_TAG = 'all';
export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 6;
export const DEFAULT_SORT = 'default';

export const DEFAULT_CATALOG_PARAMS: CatalogQueryParams = {
  page: DEFAULT_PAGE,
  perPage: DEFAULT_PER_PAGE,
  search: '',
  sort: DEFAULT_SORT,
  tag: DEFAULT_TAG,
};

export const CATALOG_PAGE_SIZE_OPTIONS = [6, 9, 12];

export const CATALOG_GRID_CLASSNAME =
  'grid gap-8 sm:grid-cols-2 lg:grid-cols-3';
