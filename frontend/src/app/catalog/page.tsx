import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/page-layout';
import CatalogGrid from '@/features/catalog/list/catalog-grid';
import ProductsService from '@/features/catalog/api/products.service';
import { productsQueryKeys } from '@/features/catalog/api/query-keys';
import { DEFAULT_CATALOG_PARAMS } from '@/features/catalog/list/catalog.config';
import { getServerTranslator } from '@/i18n/server';
import { createQueryClient } from '@/services/api/query/query-client';
import { getServerApiBaseUrl } from '@/services/api/server/server-api-url';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('label_bouquet_catalog'),
    description: t('metadata_catalog_description'),
  };
}

export default async function CatalogPage() {
  const { locale, t } = await getServerTranslator();

  const queryClient = createQueryClient();
  const serverApiBaseUrl = await getServerApiBaseUrl();
  const requestConfig = serverApiBaseUrl
    ? { baseURL: serverApiBaseUrl }
    : undefined;

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: productsQueryKeys.paginatedList(locale, DEFAULT_CATALOG_PARAMS),
      queryFn: () =>
        ProductsService.getProductList(
          { ...DEFAULT_CATALOG_PARAMS, lang: locale },
          requestConfig
        ),
    }),
    queryClient.prefetchQuery({
      queryKey: productsQueryKeys.filters(locale),
      queryFn: () =>
        ProductsService.getProductFilters({ lang: locale }, requestConfig),
    }),
  ]);

  return (
    <PageShell
      header={{
        label: t('sections_catalog_label'),
        title: t('label_bouquet_catalog'),
        description: t('sections_catalog_description'),
      }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CatalogGrid />
      </HydrationBoundary>
    </PageShell>
  );
}
