import AddToCartButton from '@/components/ui/add-to-cart-button';
import FallbackImage from '@/components/ui/fallback-image';
import InfoCard from '@/components/ui/info-card';
import type { CatalogItem } from '@/types/catalog';
import { getCatalogItemImage } from '@/features/catalog/lib/get-catalog-item-image';
import ProductAnalytics from './product-analytics.client';

export type ProductFeatureCopy = {
  actionsLabel: string;
  compositionDescription: string;
  compositionTitle: string;
  deliveryDescription: string;
  deliveryTitle: string;
  infoLabel: string;
};

type ProductFeatureProps = {
  copy: ProductFeatureCopy;
  product: CatalogItem;
};

export default function ProductFeature({ copy, product }: ProductFeatureProps) {
  const imageSrc = getCatalogItemImage(product);

  return (
    <article className='grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start'>
      <ProductAnalytics product={product} />
      <figure className='relative aspect-square overflow-hidden rounded-3xl bg-gradient-card shadow-card'>
        <FallbackImage
          src={imageSrc}
          alt={product.name}
          fill
          priority
          sizes='(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 50vw'
          className='object-cover'
        />
      </figure>

      <div className='space-y-8'>
        <header>
          <span className='inline-flex rounded-full bg-secondary/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground'>
            {product.tag}
          </span>
          <h1
            id='product-details-title'
            className='font-display mt-4 text-4xl font-bold md:text-5xl'>
            {product.name}
          </h1>
          <p className='mt-4 text-base text-muted-foreground md:text-lg'>
            {product.description}
          </p>
        </header>

        <section
          className='flex flex-wrap items-center gap-4'
          aria-label={copy.actionsLabel}>
          <p className='font-display text-3xl font-bold text-primary'>
            {product.price} ₴
          </p>
          <AddToCartButton
            size='lg'
            itemId={product.id}
            itemName={product.name}
            itemCategory={product.tag}
            itemPrice={product.price}
            source='product_detail'
          />
        </section>

        <section aria-label={copy.infoLabel}>
          <div className='grid gap-4 md:grid-cols-2'>
            <InfoCard title={copy.deliveryTitle}>
              {copy.deliveryDescription}
            </InfoCard>
            <InfoCard title={copy.compositionTitle}>
              {copy.compositionDescription}
            </InfoCard>
          </div>
        </section>
      </div>
    </article>
  );
}
