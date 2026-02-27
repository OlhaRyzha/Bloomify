'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CatalogGrid from '@/features/catalog/catalog-grid';
import { useHydrated } from '@/hooks/use-hydrated';
import { useGetProducts } from '@/hooks/tan-stack-query/products/use-products';
import { useFavoritesStore } from './favorites.store';
import useTranslations from '@/hooks/use-translations';

export default function FavoritesFeature() {
  const isHydrated = useHydrated();
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const { data, isLoading } = useGetProducts();
  const strings = useTranslations();
  const favoritesCopy = strings.sections.favorites;

  const favoriteItems = useMemo(
    () =>
      isHydrated
        ? (data ?? []).filter((item) => favoriteIds.includes(item.id))
        : [],
    [data, favoriteIds, isHydrated]
  );

  if (!isHydrated) {
    return null;
  }

  if (favoriteItems.length === 0 && !isLoading) {
    return (
      <div className='rounded-2xl bg-gradient-card p-10 text-center shadow-card'>
        <h2 className='font-display mb-3 text-2xl font-bold'>
          {favoritesCopy.emptyTitle}
        </h2>
        <p className='mb-6 text-sm text-muted-foreground'>
          {favoritesCopy.emptyDescription}
        </p>
        <Button
          asChild
          size='lg'>
          <Link href='/catalog'>{favoritesCopy.emptyCta}</Link>
        </Button>
      </div>
    );
  }

  return (
    <CatalogGrid
      items={favoriteItems}
      loading={isLoading}
      hideControls
    />
  );
}
