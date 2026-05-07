'use client';

import { useMemo } from 'react';

import { withSkeleton } from '@/components/hoc/with-skeleton';
import { PaginationContainer } from '@/components/pagination/pagination';
import { useTranslation } from '@/hooks/use-translation';
import type { CatalogItem } from '@/types/catalog';

import { useGetProducts } from './api/use-products';
import CatalogCard from './catalog-card';
import CatalogCardSkeleton from './catalog-card-skeleton';
import { CatalogControls } from './catalog-controls';
import { useCatalogGridState } from './use-catalog-grid-state';

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

  const shouldFetchCatalogItems = items === undefined;
  const { data: catalogItems = [], isLoading: isCatalogLoading } =
    useGetProducts({
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
    updateSearch,
    updateSort,
    updateTagFilter,
    updatePerPage,
  } = useCatalogGridState({ items: effectiveItems, pageSize });

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
          onSortChange={updateSort}
          tagFilter={tagFilter}
          onTagFilterChange={updateTagFilter}
          availableTags={availableTags}
        />
      )}

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
        itemsCountSuffix={t('catalog_items_count_suffix')}
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
    </div>
  );
}
