import CategoriesService from '@/features/categories/api/categories.service';
import type { CategoryListItem } from '@/features/categories/api/categories.schemas';
import type { Locale } from '@/locales/translations';
import { getServerApiBaseUrl } from '@/services/api/server/server-api-url';

/**
 * Admin-managed categories for the header menu and footer.
 * An API failure must not break the page shell — fall back to no categories.
 */
export async function getNavigationCategories(
  locale: Locale
): Promise<CategoryListItem[]> {
  const serverApiBaseUrl = await getServerApiBaseUrl();

  return CategoriesService.getCategories(
    { lang: locale },
    serverApiBaseUrl ? { baseURL: serverApiBaseUrl } : undefined
  ).catch(() => []);
}
