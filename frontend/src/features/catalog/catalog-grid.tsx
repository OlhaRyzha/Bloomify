'use client';

import { PaginationContainer } from '@/components/pagination/pagination';
import type { CatalogItem } from '@/types/catalog';
import { useGetProducts } from '@/hooks/tan-stack-query/products/use-products';
import { withSkeleton } from '@/components/hoc/with-skeleton';
import CatalogCard from './catalog-card';
import CatalogCardSkeleton from './catalog-card-skeleton';
import { CatalogControls } from './catalog-controls';
import { useCatalogGridState } from './use-catalog-grid-state';
import { useTranslation } from '@/hooks/use-translation';

const CatalogCardWithSkeleton = withSkeleton(CatalogCard, {
  skeleton: <CatalogCardSkeleton />,
});

type CatalogGridProps = {
  items?: CatalogItem[];
  pageSize?: number;
  className?: string;
  loading?: boolean;
  hideControls?: boolean;
  perPageOptions?: number[];
};

export default function CatalogGrid({
  items,
  pageSize = 6,
  className,
  loading: loadingProp,
  hideControls,
  perPageOptions = [6, 9, 12],
}: CatalogGridProps) {
  const { t } = useTranslation();
  const { data: catalogItems = [], isLoading: isCatalogLoading } =
    useGetProducts();
  const loading = loadingProp ?? isCatalogLoading;
  const effectiveItems = items ?? catalogItems;

  const {
    page,
    perPage,
    sort,
    tagFilter,
    searchInput,
    availableTags,
    filteredItems,
    sortedItems,
    skeletonItems,
    setPage,
    updateSearch,
    updateSort,
    updateTagFilter,
    updatePerPage,
  } = useCatalogGridState({ items: effectiveItems, pageSize });

  const itemsForRender =
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
          itemsCountPrefix={t('catalog_itemsCountPrefix')}
          itemsCountSuffix={t('catalog_itemsCountSuffix')}
        renderPage={(pageItems) => (
          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {pageItems.map((product) => (
              <CatalogCardWithSkeleton
                key={product.id}
                loading={loading}
                item={product}
              />
            ))}
          </div>
        )}
      />
    </div>
  );
}
