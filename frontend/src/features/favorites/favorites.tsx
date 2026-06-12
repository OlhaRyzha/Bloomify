'use client';

import { useMemo } from 'react';
import {
  CatalogActionFeedbackState,
  RetryFeedbackState,
} from '@/components/ui/translated-feedback-state';
import CatalogGrid from '@/features/catalog/list/catalog-grid';
import { useGetProducts } from '@/features/catalog/api/use-products';
import { useHydrated } from '@/hooks/use-hydrated';
import { selectFavoriteIds } from './store/favorites.selectors';
import { useFavoritesStore } from './store/favorites.store';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';
import { getFavoriteCatalogItems } from './favorites.helpers';

export default function FavoritesFeature() {
  const isHydrated = useHydrated();
  const favoriteIds = useFavoritesStore(selectFavoriteIds);
  const { data, isError, isLoading, refetch } = useGetProducts();

  const favoriteItems = useMemo(
    () => (isHydrated ? getFavoriteCatalogItems(data ?? [], favoriteIds) : []),
    [data, favoriteIds, isHydrated]
  );

  if (!isHydrated) {
    return null;
  }

  if (isError) {
    return (
      <RetryFeedbackState
        translationKeyPrefix='sections_favorites'
        onRetry={async () => {
          await refetch();
        }}
      />
    );
  }

  if (!isNonEmptyArray(favoriteItems) && !isLoading) {
    return (
      <CatalogActionFeedbackState translationKeyPrefix='sections_favorites' />
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
