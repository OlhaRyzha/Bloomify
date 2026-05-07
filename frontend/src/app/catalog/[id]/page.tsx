import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProductsService from '@/features/catalog/api/products.service';
import ProductFeature from '@/features/product/product';
import { getServerTranslator } from '@/i18n/server';

type CatalogItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CatalogItemPage({
  params,
}: CatalogItemPageProps) {
  const { id } = await params;
  const { locale, t } = await getServerTranslator();

  const product = await ProductsService.getProductById(id, {
    lang: locale,
  }).catch(() => null);

  if (!product) {
    return (
      <section
        className='bg-background pb-16 pt-28'
        aria-labelledby='product-not-found-title'>
        <div className='mx-auto max-w-6xl px-4'>
          <h1
            id='product-not-found-title'
            className='font-display text-3xl font-bold'>
            {t('product_not_found_title')}
          </h1>
          <p className='mt-3 max-w-xl text-sm text-muted-foreground'>
            {t('product_not_found_description')}
          </p>
          <Button
            asChild
            variant='ghost'
            className='mt-4'>
            <Link href='/catalog'>{t('product_back_to_catalog')}</Link>
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
            <Link href='/catalog'>{t('product_back_to_catalog')}</Link>
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
            deliveryTitle: t('product_info_cards_delivery_title'),
            infoLabel: t('product_info_label'),
          }}
        />
      </div>
    </section>
  );
}
