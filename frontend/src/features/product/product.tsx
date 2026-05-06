'use client';

import Image from 'next/image';
import AddToCartButton from '@/components/ui/add-to-cart-button';
import InfoCard from '@/components/ui/info-card';
import type { CatalogItem } from '@/types/catalog';
import { getCatalogItemImage } from '@/utils/get-catalog-item-image';
import { useTranslation } from '@/hooks/use-translation';

type ProductFeatureProps = {
  product: CatalogItem;
};

export default function ProductFeature({ product }: ProductFeatureProps) {
  const imageSrc = getCatalogItemImage(product);
  const { t } = useTranslation();

  return (
    <article className='grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start'>
      <figure className='relative aspect-square overflow-hidden rounded-3xl bg-gradient-card shadow-card'>
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          loading='eager'
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
          aria-label='Дії з товаром'>
          <p className='font-display text-3xl font-bold text-primary'>
            {product.price} ₴
          </p>
          <AddToCartButton
            size='lg'
            itemId={product.id}
          />
        </section>

        <section aria-label='Інформація про товар'>
          <div className='grid gap-4 md:grid-cols-2'>
            <InfoCard title={t('product_infoCards_delivery_title')}>
              {t('product_infoCards_delivery_description')}
            </InfoCard>
            <InfoCard title={t('product_infoCards_composition_title')}>
              {t('product_infoCards_composition_description')}
            </InfoCard>
          </div>
        </section>
      </div>
    </article>
  );
}
