import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import ProductDetailsClient from './ProductDetails.client';
import { productsQueryKeys } from '@/constants/query-keys.constants';
import { getServerTranslator } from '@/i18n/server';
import ProductsService from '@/services/api/products/products';
import { createQueryClient } from '@/services/queryClient';

type CatalogItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CatalogItemPage({ params }: CatalogItemPageProps) {
  const { id } = await params;
  const { locale } = await getServerTranslator();
  const queryClient = createQueryClient();

  await queryClient.prefetchQuery({
    queryKey: productsQueryKeys.detail(id, locale),
    queryFn: () => ProductsService.getProductById(id, { lang: locale }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailsClient />
    </HydrationBoundary>
  );
}
