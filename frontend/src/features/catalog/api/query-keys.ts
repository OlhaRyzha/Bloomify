import type { Locale } from '@/locales/translations';
import type { CatalogQueryParams } from '../list/types';

export const productsQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productsQueryKeys.all, 'list'] as const,
  list: (locale: Locale) => [...productsQueryKeys.lists(), locale] as const,
  paginatedList: (locale: Locale, params: CatalogQueryParams) =>
    [...productsQueryKeys.lists(), locale, params] as const,
  filters: (locale: Locale) =>
    [...productsQueryKeys.all, 'filters', locale] as const,
  details: () => [...productsQueryKeys.all, 'detail'] as const,
  detail: (id: string, locale: Locale) =>
    [...productsQueryKeys.details(), id, locale] as const,
};
