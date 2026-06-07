import type { Locale } from '@/locales/translations';

export const ordersQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersQueryKeys.all, 'list'] as const,
  list: (locale: Locale) => [...ordersQueryKeys.lists(), locale] as const,
  details: () => [...ordersQueryKeys.all, 'detail'] as const,
  detail: (id: string, locale: Locale) =>
    [...ordersQueryKeys.details(), id, locale] as const,
};
