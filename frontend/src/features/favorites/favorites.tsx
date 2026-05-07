'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CatalogGrid from '@/features/catalog/catalog-grid';
import { useGetProducts } from '@/features/catalog/api/use-products';
import { useHydrated } from '@/hooks/use-hydrated';
import { selectFavoriteIds } from './store/favorites.selectors';
import { useFavoritesStore } from './store/favorites.store';
import { useTranslation } from '@/hooks/use-translation';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';
import { getFavoriteCatalogItems } from './favorites.helpers';

export default function FavoritesFeature() {
  const isHydrated = useHydrated();
  const favoriteIds = useFavoritesStore(selectFavoriteIds);
  const { data, isLoading } = useGetProducts();
  const { t } = useTranslation();

  const favoriteItems = useMemo(
    () =>
      isHydrated ? getFavoriteCatalogItems(data ?? [], favoriteIds) : [],
    [data, favoriteIds, isHydrated]
  );

  if (!isHydrated) {
    return null;
  }

  if (!isNonEmptyArray(favoriteItems) && !isLoading) {
    return (
      <section
        className='rounded-2xl bg-gradient-card p-10 text-center shadow-card'
        aria-labelledby='favorites-empty-title'>
        <h2
          id='favorites-empty-title'
          className='font-display mb-3 text-2xl font-bold'>
          {t('sections_favorites_empty_title')}
        </h2>
        <p className='mb-6 text-sm text-muted-foreground'>
          {t('sections_favorites_empty_description')}
        </p>
        <Button
          asChild
          size='lg'>
          <Link href='/catalog'>{t('sections_favorites_empty_cta')}</Link>
        </Button>
      </section>
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
