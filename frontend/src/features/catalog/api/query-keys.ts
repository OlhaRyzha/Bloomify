import type { Locale } from '@/locales/translations';

export const productsQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productsQueryKeys.all, 'list'] as const,
  list: (locale: Locale) => [...productsQueryKeys.lists(), locale] as const,
  details: () => [...productsQueryKeys.all, 'detail'] as const,
  detail: (id: string, locale: Locale) =>
    [...productsQueryKeys.details(), id, locale] as const,
};
