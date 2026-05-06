'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { withSkeleton } from '@/components/hoc/with-skeleton';
import ProductFeature from '@/features/product/product';
import ProductSkeleton from '@/features/product/product-skeleton';
import { useGetProductById } from '@/hooks/tan-stack-query/products/use-products';

const ProductWithSkeleton = withSkeleton(ProductFeature, {
  skeleton: <ProductSkeleton />,
});

export default function ProductDetailsClient() {
  const { id } = useParams<{ id: string }>();
  const {
    data: product,
    isLoading,
    error,
  } = useGetProductById(id, {
    refetchOnMount: false,
  });

  if ((error || !product) && !isLoading) {
    return (
      <section
        className='bg-background pb-16 pt-28'
        aria-labelledby='product-not-found-title'>
        <div className='mx-auto max-w-6xl px-4'>
          <h1
            id='product-not-found-title'
            className='font-display text-3xl font-bold'>
            Букет не знайдено
          </h1>
          <p className='mt-3 max-w-xl text-sm text-muted-foreground'>
            Спробуйте повернутися до каталогу та обрати іншу композицію.
          </p>
          <Button
            asChild
            variant='ghost'
            className='mt-4'>
            <Link href='/catalog'>До каталогу</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className='bg-background pb-16 pt-28'
      aria-labelledby='product-details-title'>
      <div className='mx-auto max-w-6xl px-4'>
        <header className='mb-10 flex flex-wrap items-center justify-between gap-4'>
          <Button
            asChild
            variant='ghost'>
            <Link href='/catalog'>До каталогу</Link>
          </Button>
          {product && (
            <p className='text-sm text-muted-foreground'>
              Артикул: {product.id.padStart(3, '0')}
            </p>
          )}
        </header>

        <ProductWithSkeleton
          loading={isLoading}
          product={product!}
        />
      </div>
    </section>
  );
}
