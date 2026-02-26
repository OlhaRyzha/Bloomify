'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProductFeature from '@/features/product/product';
import { useGetProductById } from '@/hooks/tan-stack-query/products/use-products';
import { useParamId } from '@/hooks/use-id';
import { withSkeleton } from '@/components/hoc/with-skeleton';
import ProductSkeleton from '@/features/product/product-skeleton';

const ProductWithSkeleton = withSkeleton(ProductFeature, {
  skeleton: <ProductSkeleton />,
});

export default function CatalogItemPage() {
  const { id } = useParamId();
  const { data: product, isLoading } = useGetProductById(id);

  if (!product && !isLoading) {
    return (
      <section className='bg-background pb-16 pt-28'>
        <div className='mx-auto max-w-6xl px-4'>
          <p className='text-sm text-muted-foreground'>Букет не знайдено.</p>
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
    <section className='bg-background pb-16 pt-28'>
      <div className='mx-auto max-w-6xl px-4'>
        <div className='mb-10 flex flex-wrap items-center justify-between gap-4'>
          <Button
            asChild
            variant='ghost'>
            <Link href='/catalog'>До каталогу</Link>
          </Button>
          <span className='text-sm text-muted-foreground'>
            Артикул: {product?.id.padStart(3, '0')}
          </span>
        </div>

        <ProductWithSkeleton
          loading={isLoading}
          product={product!}
        />
      </div>
    </section>
  );
}
