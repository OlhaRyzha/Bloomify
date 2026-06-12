import Image, { type ImageProps } from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { FALLBACK_IMAGE_SRC } from '@/constants/image.constants';
import ProductsService from '@/features/catalog/api/products.service';
import { getCatalogItemImage } from '@/features/catalog/lib/get-catalog-item-image';
import { getLocalizedPath } from '@/i18n/routing';
import { getServerTranslator } from '@/i18n/server';
import { cn } from '@/lib/utils';
import type { Locale } from '@/locales/translations';
import type { CatalogItem } from '@/types/catalog';
import { formatCurrency } from '@/utils/i18n';
import { isString } from '@/utils/guards/is-string';

const FEATURED_PRODUCTS_LIMIT = 3;
const skeletonItems = Array.from({ length: FEATURED_PRODUCTS_LIMIT }, (_, index) => ({
  id: `featured-catalog-skeleton-${index}`,
}));

function normalizeImageSrc(src: ImageProps['src'] | null): ImageProps['src'] {
  if (!src) {
    return FALLBACK_IMAGE_SRC;
  }

  if (!isString(src)) {
    return src;
  }

  if (src.startsWith('http') || src.startsWith('/')) {
    return src;
  }

  return `/${src}`;
}

async function getFeaturedProducts(locale: Locale): Promise<CatalogItem[]> {
  try {
    const products = await ProductsService.getProducts({ lang: locale });

    return products.slice(0, FEATURED_PRODUCTS_LIMIT);
  } catch {
    return [];
  }
}

function FeaturedProductCard({
  item,
  locale,
  index,
}: {
  item: CatalogItem;
  locale: Locale;
  index: number;
}) {
  const imageSrc = normalizeImageSrc(getCatalogItemImage(item));
  const productHref = getLocalizedPath(`/catalog/${item.id}`, locale);

  return (
    <Card
      className='featured-catalog-card group flex h-full flex-col overflow-hidden border-0 bg-gradient-card py-0 shadow-card transition-shadow duration-300 hover:shadow-elevated'
      style={{ animationDelay: `${index * 120}ms` }}>
      <Link
        href={productHref}
        className='relative aspect-square overflow-hidden'>
        <Image
          src={imageSrc}
          alt={item.name}
          fill
          sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
          className='object-cover transition-transform duration-500 group-hover:scale-105'
        />
      </Link>

      <CardContent className='flex flex-1 flex-col p-6'>
        {item.tag && (
          <span className='mb-4 w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
            {item.tag}
          </span>
        )}
        <h3 className='font-display mb-2 text-xl font-semibold leading-tight'>
          <Link
            href={productHref}
            className='transition-colors hover:text-primary'>
            {item.name}
          </Link>
        </h3>
        {item.description && (
          <p className='mb-4 text-sm text-muted-foreground line-clamp-2'>
            {item.description}
          </p>
        )}
        <p className='font-display mt-auto text-2xl font-bold text-primary'>
          {formatCurrency(Number(item.price), locale)}
        </p>
      </CardContent>
    </Card>
  );
}

function FeaturedProductSkeleton() {
  return (
    <Card className='flex h-full flex-col overflow-hidden border-0 bg-gradient-card py-0 shadow-card'>
      <div className='aspect-square animate-pulse bg-muted' />
      <CardContent className='flex flex-1 flex-col p-6'>
        <div className='mb-4 h-6 w-20 rounded-full bg-muted' />
        <div className='mb-3 h-7 w-4/5 rounded-md bg-muted' />
        <div className='mb-2 h-4 rounded-md bg-muted' />
        <div className='mb-6 h-4 w-3/4 rounded-md bg-muted' />
        <div className='mt-auto h-8 w-24 rounded-md bg-muted' />
      </CardContent>
    </Card>
  );
}

export default async function CatalogSectionPreview({
  className,
}: {
  className?: string;
}) {
  const { locale } = await getServerTranslator();
  const products = await getFeaturedProducts(locale);

  return (
    <div className={cn('grid gap-8 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {products.length > 0
        ? products.map((product, index) => (
            <FeaturedProductCard
              key={product.id}
              item={product}
              locale={locale}
              index={index}
            />
          ))
        : skeletonItems.map((item) => <FeaturedProductSkeleton key={item.id} />)}
    </div>
  );
}
