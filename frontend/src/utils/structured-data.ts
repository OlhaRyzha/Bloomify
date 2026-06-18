import { getAbsoluteLocalizedUrl } from '@/config/site';
import type { Locale } from '@/locales/translations';

type BreadcrumbItem = {
  name: string;
  path: string;
};

export const buildBreadcrumbJsonLd = (
  items: BreadcrumbItem[],
  locale: Locale
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: getAbsoluteLocalizedUrl(item.path, locale),
  })),
});
