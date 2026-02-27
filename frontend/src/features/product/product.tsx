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
    <div className='grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start'>
      <div className='relative aspect-square overflow-hidden rounded-3xl bg-gradient-card shadow-card'>
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          loading='eager'
          priority
          sizes='(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 50vw'
          className='object-cover'
        />
      </div>

      <div>
        <span className='inline-flex rounded-full bg-secondary/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground'>
          {product.tag}
        </span>
        <h1 className='font-display mt-4 text-4xl font-bold md:text-5xl'>
          {product.name}
        </h1>
        <p className='mt-4 text-base text-muted-foreground md:text-lg'>
          {product.description}
        </p>

        <div className='mt-6 flex flex-wrap items-center gap-4'>
          <span className='font-display text-3xl font-bold text-primary'>
            {product.price} ₴
          </span>
          <AddToCartButton
            size='lg'
            itemId={product.id}
          />
        </div>

        <div className='mt-8 grid gap-4 md:grid-cols-2'>
          <InfoCard title={t('product.infoCards.delivery.title')}>
            {t('product.infoCards.delivery.description')}
          </InfoCard>
          <InfoCard title={t('product.infoCards.composition.title')}>
            {t('product.infoCards.composition.description')}
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
