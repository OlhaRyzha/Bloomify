import Link from 'next/link';
import {
  Container,
  PageSection,
  PageShell,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import FeedbackState from '@/components/ui/feedback-state';
import ProductsService from '@/features/catalog/api/products.service';
import ProductFeature from '@/features/product/product';
import { getServerTranslator } from '@/i18n/server';
import { getLocalizedPath } from '@/i18n/routing';

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

  return (
    <PageSection aria-labelledby='product-details-title'>
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
