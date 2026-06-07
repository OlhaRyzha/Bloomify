'use client';

import { useEffect, useMemo, useRef } from 'react';

import { withSkeleton } from '@/components/hoc/with-skeleton';
import { PaginationContainer } from '@/components/pagination/pagination';
import FeedbackState from '@/components/ui/feedback-state';
import { useTranslation } from '@/hooks/use-translation';
import type { CatalogItem } from '@/types/catalog';
import { getBouquetCountLabel } from '@/utils/i18n';
import { useLocale } from '@/components/providers/locale-provider';
import {
  trackCatalogSearch,
  trackCatalogSort,
  trackCatalogTagFilter,
  trackCatalogViewed,
} from '@/services/analytics/analytics.events';

import { useGetProducts } from '../api/use-products';
import CatalogCard from '../card/catalog-card';
import CatalogCardSkeleton from '../card/catalog-card-skeleton';
import { CatalogControls } from './catalog-controls';
import { useCatalogGridState } from './hooks/use-catalog-grid-state';

const CatalogCardWithSkeleton = withSkeleton(CatalogCard, {
  skeleton: <CatalogCardSkeleton />,
});

type CatalogGridProps = {
  items?: CatalogItem[];
  pageSize?: number;
  className?: string;
  loading?: boolean;
  hideControls?: boolean;
  maxItems?: number;
  perPageOptions?: number[];
};

type CatalogSkeletonItem = {
  id: string;
  isSkeleton: true;
};

type CatalogRenderItem = CatalogItem | CatalogSkeletonItem;

const isCatalogSkeletonItem = (
  item: CatalogRenderItem
): item is CatalogSkeletonItem => {
  return 'isSkeleton' in item;
};

const removeDuplicatedCatalogItems = (items: CatalogItem[]): CatalogItem[] => {
  const uniqueItems = new Map<CatalogItem['id'], CatalogItem>();

  items.forEach((item) => {
    if (!uniqueItems.has(item.id)) {
      uniqueItems.set(item.id, item);
    }
  });

  return Array.from(uniqueItems.values());
};

export default function CatalogGrid({
  items,
  pageSize = 6,
  className,
  loading: loadingProp,
  hideControls,
  maxItems,
  perPageOptions = [6, 9, 12],
}: CatalogGridProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const shouldFetchCatalogItems = items === undefined;
  const {
    data: catalogItems = [],
    isError: isCatalogError,
    isLoading: isCatalogLoading,
    refetch: refetchCatalogItems,
  } = useGetProducts({
    enabled: shouldFetchCatalogItems,
  });

  const loading = loadingProp ?? isCatalogLoading;

  const effectiveItems = useMemo(() => {
    const uniqueItems = removeDuplicatedCatalogItems(items ?? catalogItems);

    return maxItems ? uniqueItems.slice(0, maxItems) : uniqueItems;
  }, [items, catalogItems, maxItems]);

  const {
    page,
    perPage,
    sort,
    tagFilter,
    searchInput,
    availableTags,
    filteredItems,
    sortedItems,
    setPage,
    debouncedSearch,
    updateSearch,
    updateSort,
    updateTagFilter,
    updatePerPage,
  } = useCatalogGridState({ items: effectiveItems, pageSize });
  const trackedItemListKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || effectiveItems.length === 0) {
      return;
    }

    const listKey = `${locale}:${effectiveItems.map((item) => item.id).join(',')}`;
    if (trackedItemListKeyRef.current === listKey) {
      return;
    }

    trackedItemListKeyRef.current = listKey;
    trackCatalogViewed({
      itemListName: hideControls ? 'featured_catalog' : 'catalog',
      itemCount: effectiveItems.length,
      locale,
    });
  }, [effectiveItems, hideControls, loading, locale]);

  useEffect(() => {
    trackCatalogSearch({
      query: debouncedSearch,
      resultCount: filteredItems.length,
      locale,
    });
  }, [debouncedSearch, filteredItems.length, locale]);

  const handleSortChange = (value: Parameters<typeof updateSort>[0]) => {
    updateSort(value);
    trackCatalogSort({
      sort: value,
      resultCount: filteredItems.length,
      locale,
    });
  };

  const handleTagFilterChange = (value: string) => {
    updateTagFilter(value);
    trackCatalogTagFilter({
      tag: value,
      resultCount: filteredItems.length,
      locale,
    });
  };

  const skeletonItems: CatalogSkeletonItem[] = Array.from(
    { length: perPage },
    (_, index) => ({
      id: `catalog-card-skeleton-${index}`,
      isSkeleton: true,
    })
  );

  const itemsForRender: CatalogRenderItem[] =
    loading && effectiveItems.length === 0 ? skeletonItems : sortedItems;

  return (
    <div className={className}>
      {!hideControls && (
        <CatalogControls
          searchInput={searchInput}
          onSearchChange={updateSearch}
          sort={sort}
          onSortChange={handleSortChange}
          tagFilter={tagFilter}
          onTagFilterChange={handleTagFilterChange}
          availableTags={availableTags}
        />
      )}

      {isCatalogError && shouldFetchCatalogItems ? (
        <FeedbackState
          tone='error'
          title={t('catalog_error_title')}
          description={t('catalog_error_description')}
          actionLabel={t('common_try_again')}
          onAction={async () => {
            await refetchCatalogItems();
          }}
        />
      ) : !loading && sortedItems.length === 0 ? (
        <FeedbackState
          title={t('catalog_empty_title')}
          description={t('catalog_empty_description')}
        />
      ) : (
        <PaginationContainer
          items={itemsForRender}
          pageSize={perPage}
          page={page}
          onPageChange={setPage}
          hideControls={hideControls}
          scrollToTopOnChange
          showPageSizeControl={!hideControls}
          pageSizeOptions={perPageOptions}
          onPageSizeChange={updatePerPage}
          showItemsCount={!hideControls}
          itemsCount={filteredItems.length}
          itemsCountPrefix={t('catalog_items_count_prefix')}
          itemsCountSuffix={getBouquetCountLabel(filteredItems.length, locale)}
          renderPage={(pageItems) => (
            <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
              {pageItems.map((product) =>
                isCatalogSkeletonItem(product) ? (
                  <CatalogCardSkeleton key={product.id} />
                ) : (
                  <CatalogCardWithSkeleton
                    key={product.id}
                    loading={loading}
                    item={product}
                  />
                )
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}
