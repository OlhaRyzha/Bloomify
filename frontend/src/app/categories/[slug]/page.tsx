import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/page-layout';
import FeedbackState from '@/components/ui/feedback-state';
import { getAbsoluteLocalizedUrl, getLanguageAlternates } from '@/config/site';
import CategoriesService from '@/features/categories/api/categories.service';
import type { CategoryDetail } from '@/features/categories/api/categories.schemas';
import CategoryContentBlocks from '@/features/categories/category-content-blocks';
import CatalogGrid from '@/features/catalog/list/catalog-grid';
import { getLocalizedPath } from '@/i18n/routing';
import { getServerTranslator } from '@/i18n/server';
import type { Locale } from '@/locales/translations';
import { getServerApiBaseUrl } from '@/services/api/server/server-api-url';
import { serializeJsonLd } from '@/utils/json-ld';
import { buildBreadcrumbJsonLd } from '@/utils/structured-data';

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

const fetchCategory = async (
  slug: string,
  locale: Locale
): Promise<CategoryDetail | null> => {
  const serverApiBaseUrl = await getServerApiBaseUrl();

  return CategoriesService.getCategoryBySlug(
    slug,
    { lang: locale },
    serverApiBaseUrl ? { baseURL: serverApiBaseUrl } : undefined
  ).catch(() => null);
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getServerTranslator();
  const category = await fetchCategory(slug, locale);

  if (!category) {
    return { robots: { index: false, follow: true } };
  }

  const path = `/categories/${category.slug}`;

  return {
    title: category.name,
    alternates: {
      canonical: getAbsoluteLocalizedUrl(path, locale),
      languages: getLanguageAlternates(path),
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const { locale, t } = await getServerTranslator();

  const category = await fetchCategory(slug, locale);

  if (!category) {
    return (
      <PageShell>
        <FeedbackState
          title={t('category_not_found_title')}
          description={t('category_not_found_description')}
          actionLabel={t('product_back_to_catalog')}
          actionHref={getLocalizedPath('/catalog', locale)}
        />
      </PageShell>
    );
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: t('breadcrumb_home'), path: '/' },
      { name: category.name, path: `/categories/${category.slug}` },
    ],
    locale
  );

  return (
    <PageShell header={{ title: category.name }}>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      {category.kind === 'catalog' ? (
        category.items.length > 0 ? (
          <CatalogGrid
            items={category.items}
            hideControls
          />
        ) : (
          <FeedbackState
            title={t('category_empty_title')}
            description={t('category_empty_description')}
            actionLabel={t('product_back_to_catalog')}
            actionHref={getLocalizedPath('/catalog', locale)}
          />
        )
      ) : (
        <CategoryContentBlocks blocks={category.blocks} />
      )}
    </PageShell>
  );
}
