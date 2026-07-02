import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/page-layout';
import CatalogGrid from '@/features/catalog/list/catalog-grid';
import ProductsService from '@/features/catalog/api/products.service';
import { productsQueryKeys } from '@/features/catalog/api/query-keys';
import { DEFAULT_CATALOG_PARAMS } from '@/features/catalog/list/catalog.config';
import SeoTextBlock from '@/components/seo/seo-text-block';
import { getAbsoluteLocalizedUrl, getLanguageAlternates } from '@/config/site';
import { getServerTranslator } from '@/i18n/server';
import { createQueryClient } from '@/services/api/query/query-client';
import { getServerApiBaseUrl } from '@/services/api/server/server-api-url';
import { serializeJsonLd } from '@/utils/json-ld';
import { buildBreadcrumbJsonLd } from '@/utils/structured-data';

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerTranslator();

  return {
    title: t('label_bouquet_catalog'),
    description: t('metadata_catalog_description'),
    // Without a page-level canonical Next.js inherits the root layout's
    // alternates, which point to "/" — search engines then treat the catalog
    // as a duplicate of the home page.
    alternates: {
      canonical: getAbsoluteLocalizedUrl('/catalog', locale),
      languages: getLanguageAlternates('/catalog'),
    },
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

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: t('breadcrumb_home'), path: '/' },
      { name: t('label_bouquet_catalog'), path: '/catalog' },
    ],
    locale
  );

  return (
    <>
      <PageShell
        header={{
          label: t('sections_catalog_label'),
          title: t('label_bouquet_catalog'),
          description: t('sections_catalog_description'),
        }}>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(breadcrumbJsonLd),
          }}
        />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <CatalogGrid />
        </HydrationBoundary>
      </PageShell>
      <SeoTextBlock
        titleKey='seo_catalog_title'
        paragraphKeys={['seo_catalog_p1', 'seo_catalog_p2', 'seo_catalog_p3']}
      />
    </>
  );
}
