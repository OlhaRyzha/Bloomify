import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { catalogItems } from '@/features/catalog/catalog-items';
import ProductFeature from '@/features/product/product';

type CatalogPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CatalogItemPage({ params }: CatalogPageProps) {
  const { id } = await params;
  const product = catalogItems.find((item) => item.id === id);

  if (!product) notFound();

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
            Артикул: {product.id.padStart(3, '0')}
          </span>
        </div>

        <ProductFeature product={product} />
      </div>
    </section>
  );
}
