import type { MetadataRoute } from 'next';
import {
  getAbsoluteLocalizedUrl,
  getLanguageAlternates,
} from '@/config/site';
import { defaultLocale } from '@/locales/translations';
import CategoriesService from '@/features/categories/api/categories.service';
import ProductsService from '@/features/catalog/api/products.service';
import { getServerApiBaseUrl } from '@/services/api/server/server-api-url';

// Regenerate at most once an hour so freshly added products appear in search
// without rebuilding the whole site.
export const revalidate = 3600;

// Public, indexable routes only — transactional/private pages are excluded
// here and disallowed in robots.ts.
const STATIC_PATHS = [
  '/',
  '/catalog',
  '/subscriptions',
  '/privacy',
  '/terms',
] as const;

const getStaticChangeFrequency = (
  path: string
): MetadataRoute.Sitemap[number]['changeFrequency'] =>
  path === '/' || path === '/catalog' ? 'daily' : 'monthly';

const fetchProductIds = async (): Promise<string[]> => {
  try {
    const serverApiBaseUrl = await getServerApiBaseUrl();
    const products = await ProductsService.getProducts(
      { lang: defaultLocale },
      serverApiBaseUrl ? { baseURL: serverApiBaseUrl } : undefined
    );
    return products.map((product) => product.id);
  } catch {
    // A transient API failure must not break the sitemap — static routes
    // still get served and products reappear on the next revalidation.
    return [];
  }
};

const fetchCategorySlugs = async (): Promise<string[]> => {
  try {
    const serverApiBaseUrl = await getServerApiBaseUrl();
    const categories = await CategoriesService.getCategories(
      { lang: defaultLocale },
      serverApiBaseUrl ? { baseURL: serverApiBaseUrl } : undefined
    );
    return categories.map((category) => category.slug);
  } catch {
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: getAbsoluteLocalizedUrl(path, defaultLocale),
    changeFrequency: getStaticChangeFrequency(path),
    priority: path === '/' ? 1 : 0.7,
    alternates: { languages: getLanguageAlternates(path) },
  }));

  const productIds = await fetchProductIds();
  for (const id of productIds) {
    const path = `/catalog/${id}`;
    entries.push({
      url: getAbsoluteLocalizedUrl(path, defaultLocale),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: getLanguageAlternates(path) },
    });
  }

  const categorySlugs = await fetchCategorySlugs();
  for (const slug of categorySlugs) {
    const path = `/categories/${slug}`;
    entries.push({
      url: getAbsoluteLocalizedUrl(path, defaultLocale),
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: { languages: getLanguageAlternates(path) },
    });
  }

  return entries;
}
