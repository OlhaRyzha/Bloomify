'use client';

import { useMemo } from 'react';
import FeedbackState from '@/components/ui/feedback-state';
import CatalogGrid from '@/features/catalog/catalog-grid';
import { useGetProducts } from '@/features/catalog/api/use-products';
import { useHydrated } from '@/hooks/use-hydrated';
import { selectFavoriteIds } from './store/favorites.selectors';
import { useFavoritesStore } from './store/favorites.store';
import { useTranslation } from '@/hooks/use-translation';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';
import { getFavoriteCatalogItems } from './favorites.helpers';
import { getLocalizedPath } from '@/i18n/routing';

export default function FavoritesFeature() {
  const isHydrated = useHydrated();
  const favoriteIds = useFavoritesStore(selectFavoriteIds);
  const { data, isError, isLoading, refetch } = useGetProducts();
  const { locale, t } = useTranslation();

  const favoriteItems = useMemo(
    () => (isHydrated ? getFavoriteCatalogItems(data ?? [], favoriteIds) : []),
    [data, favoriteIds, isHydrated]
  );

  if (!isHydrated) {
    return null;
  }

  if (isError) {
    return (
      <FeedbackState
        tone='error'
        title={t('sections_favorites_error_title')}
        description={t('sections_favorites_error_description')}
        actionLabel={t('common_try_again')}
        onAction={async () => {
          await refetch();
        }}
      />
    );
  }

  if (!isNonEmptyArray(favoriteItems) && !isLoading) {
    return (
      <FeedbackState
        title={t('sections_favorites_empty_title')}
        description={t('sections_favorites_empty_description')}
        actionLabel={t('sections_favorites_empty_cta')}
        actionHref={getLocalizedPath('/catalog', locale)}
        className='bg-gradient-card shadow-card'
      />
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
