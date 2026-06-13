import { useEffect, useRef } from 'react';

import type { CatalogItem } from '@/types/catalog';
import {
  trackCatalogSearch,
  trackCatalogSort,
  trackCatalogTagFilter,
  trackCatalogViewed,
} from '@/services/analytics/analytics.events';
import { buildListIdentityKey } from '@/utils/list/build-list-identity-key';

type TrackCatalogSortValue = Parameters<typeof trackCatalogSort>[0]['sort'];

type UseCatalogAnalyticsParams = {
  products: CatalogItem[];
  productsCount: number;
  locale: string;
  loading: boolean;
  isEmptyProducts: boolean;
  debouncedSearch: string;
  hideControls?: boolean;
};

export function useCatalogAnalytics({
  products,
  productsCount,
  locale,
  loading,
  isEmptyProducts,
  debouncedSearch,
  hideControls,
}: UseCatalogAnalyticsParams) {
  const trackedItemListKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || isEmptyProducts) {
      return;
    }

    const listKey = buildListIdentityKey(locale, products);

    if (trackedItemListKeyRef.current === listKey) {
      return;
    }

    trackedItemListKeyRef.current = listKey;

    trackCatalogViewed({
      itemListName: hideControls ? 'featured_catalog' : 'catalog',
      itemCount: productsCount,
      locale,
    });
  }, [hideControls, isEmptyProducts, loading, locale, products, productsCount]);

  useEffect(() => {
    trackCatalogSearch({
      query: debouncedSearch,
      resultCount: productsCount,
      locale,
    });
  }, [debouncedSearch, locale, productsCount]);

  const trackSortChange = (sort: TrackCatalogSortValue) => {
    trackCatalogSort({
      sort,
      resultCount: productsCount,
      locale,
    });
  };

  const trackTagFilterChange = (tag: string) => {
    trackCatalogTagFilter({
      tag,
      resultCount: productsCount,
      locale,
    });
  };

  return {
    trackSortChange,
    trackTagFilterChange,
  };
}
