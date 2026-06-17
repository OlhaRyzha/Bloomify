import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
  PageSection,
  PageShell,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import FeedbackState from '@/components/ui/feedback-state';
import ProductsService from '@/features/catalog/api/products.service';
import type { ProductItem } from '@/features/catalog/api/products.shemas';
import { getCatalogItemImage } from '@/features/catalog/lib/get-catalog-item-image';
import ProductFeature from '@/features/product/product';
import { getServerTranslator } from '@/i18n/server';
import { getLocalizedPath } from '@/i18n/routing';
import { getServerApiBaseUrl } from '@/services/api/server/server-api-url';
import {
  getAbsoluteLocalizedUrl,
  getLanguageAlternates,
  OG_LOCALES,
  toAbsoluteUrl,
} from '@/config/site';
import type { Locale } from '@/locales/translations';
import { serializeJsonLd } from '@/utils/json-ld';

type CatalogItemPageProps = {
  params: Promise<{ id: string }>;
};

const fetchProduct = async (
  id: string,
  locale: Locale
): Promise<ProductItem | null> => {
  const serverApiBaseUrl = await getServerApiBaseUrl();

  return ProductsService.getProductById(
    id,
    { lang: locale },
    serverApiBaseUrl ? { baseURL: serverApiBaseUrl } : undefined
  ).catch(() => null);
};

const getOfferPrice = (product: ProductItem): string =>
  product.isSale && product.discountedPrice
    ? product.discountedPrice
    : product.price;

const getProductImageUrl = (product: ProductItem): string => {
  const image = getCatalogItemImage(product);
  return toAbsoluteUrl(typeof image === 'string' ? image : image.src);
};

export async function generateMetadata({
  params,
}: CatalogItemPageProps): Promise<Metadata> {
  const { id } = await params;
  const { locale } = await getServerTranslator();
  const product = await fetchProduct(id, locale);

  if (!product) {
    return { robots: { index: false, follow: true } };
  }

  const path = `/catalog/${product.id}`;
  const imageUrl = getProductImageUrl(product);

  return {
    title: product.name,
    description: product.description,
    alternates: {
      canonical: getAbsoluteLocalizedUrl(path, locale),
      languages: getLanguageAlternates(path),
    },
    openGraph: {
      type: 'website',
      title: product.name,
      description: product.description,
      url: getAbsoluteLocalizedUrl(path, locale),
      locale: OG_LOCALES[locale],
      images: [{ url: imageUrl, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [imageUrl],
    },
  };
}

export default async function CatalogItemPage({
  params,
}: CatalogItemPageProps) {
  const { id } = await params;
  const { locale, t } = await getServerTranslator();

  const product = await fetchProduct(id, locale);

  if (!product) {
    return (
      <PageShell>
        <FeedbackState
          title={t('product_not_found_title')}
          description={t('product_not_found_description')}
          actionLabel={t('product_back_to_catalog')}
          actionHref={getLocalizedPath('/catalog', locale)}
        />
      </PageShell>
    );
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: getProductImageUrl(product),
    sku: product.id,
    category: product.tag,
    offers: {
      '@type': 'Offer',
      price: getOfferPrice(product),
      priceCurrency: 'UAH',
      availability: 'https://schema.org/InStock',
      url: getAbsoluteLocalizedUrl(`/catalog/${product.id}`, locale),
    },
  };

  return (
    <PageSection aria-labelledby='product-details-title'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <Container>
        <header className='mb-10 flex flex-wrap items-center justify-between gap-4'>
          <Button
            asChild
            variant='ghost'>
            <Link href={getLocalizedPath('/catalog', locale)}>
              {t('product_back_to_catalog')}
            </Link>
          </Button>
          <p className='text-sm text-muted-foreground'>
            {t('product_article')}: {product.id.padStart(3, '0')}
          </p>
        </header>

        <ProductFeature
          product={product}
          copy={{
            actionsLabel: t('product_actions_label'),
            compositionDescription: t(
              'product_info_cards_composition_description'
            ),
            compositionTitle: t('product_info_cards_composition_title'),
            deliveryDescription: t('product_info_cards_delivery_description'),
            deliveryTitle: t('label_delivery'),
            infoLabel: t('product_info_label'),
          }}
        />
      </Container>
    </PageSection>
  );
}
