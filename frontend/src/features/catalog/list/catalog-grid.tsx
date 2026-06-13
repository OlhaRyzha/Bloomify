'use client';

import { PaginationContainer } from '@/components/pagination/pagination';
import { useTranslation } from '@/hooks/use-translation';
import type { CatalogItem } from '@/types/catalog';
import { getBouquetCountLabel } from '@/utils/i18n';

import { useGetProductFilters, useGetProductList } from '../api/use-products';
import CatalogCard from '../card/catalog-card';
import {
  CATALOG_GRID_CLASSNAME,
  CATALOG_PAGE_SIZE_OPTIONS,
  DEFAULT_PER_PAGE,
} from './catalog.config';
import { CatalogControls } from './components/catalog-controls';
import { CatalogListState } from './components/catalog-list-state';
import { useCatalogAnalytics } from './hooks/use-catalog-analytics';
import { useCatalogGridState } from './hooks/use-catalog-grid-state';

const EMPTY_PRODUCTS: CatalogItem[] = [];

type CatalogGridProps = {
  items?: CatalogItem[];
  className?: string;
  loading?: boolean;
  hideControls?: boolean;
};

export default function CatalogGrid({
  items,
  className,
  loading: loadingProp,
  hideControls,
}: CatalogGridProps) {
  const { locale, t } = useTranslation();

  const isServerList = items === undefined;

  const { data: productFilters, isLoading: isProductFiltersLoading } =
    useGetProductFilters({
      enabled: isServerList && !hideControls,
    });

  const {
    page,
    perPage,
    sort,
    tagFilter,
    searchInput,
    queryParams,
    setPage,
    debouncedSearch,
    updateSearch,
    updateSort,
    updateTagFilter,
    updatePerPage,
  } = useCatalogGridState({
    availableTags: productFilters?.tags ?? [],
    pageSize: DEFAULT_PER_PAGE,
  });

  const {
    data: productList,
    isError,
    isLoading: isProductListLoading,
    refetch,
  } = useGetProductList(queryParams, {
    enabled: isServerList,
  });

  const products = items ?? productList?.items ?? EMPTY_PRODUCTS;
  const productsCount = items?.length ?? productList?.total ?? products.length;
  const isLoading =
    loadingProp ?? (isProductListLoading || isProductFiltersLoading);

  const isEmpty = products.length === 0;

  const { trackSortChange, trackTagFilterChange } = useCatalogAnalytics({
    products,
    productsCount,
    locale,
    loading: isLoading,
    isEmptyProducts: isEmpty,
    debouncedSearch,
    hideControls,
  });

  const handleSortChange = (value: Parameters<typeof updateSort>[0]) => {
    updateSort(value);
    trackSortChange(value);
  };

  const handleTagFilterChange = (value: string) => {
    updateTagFilter(value);
    trackTagFilterChange(value);
  };

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
          availableTags={productFilters?.tags ?? []}
        />
      )}

      <CatalogListState
        isError={isError && isServerList}
        isEmpty={isEmpty}
        isLoading={isLoading}
        skeletonCount={perPage}
        onRetry={refetch}
      />

      {!isError && !isEmpty && (
        <PaginationContainer
          items={products}
          pageSize={perPage}
          page={page}
          onPageChange={setPage}
          totalItems={isServerList ? productsCount : undefined}
          hideControls={hideControls}
          scrollToTopOnChange
          showPageSizeControl={!hideControls}
          pageSizeOptions={CATALOG_PAGE_SIZE_OPTIONS}
          onPageSizeChange={updatePerPage}
          showItemsCount={!hideControls}
          itemsCount={productsCount}
          itemsCountPrefix={t('catalog_items_count_prefix')}
          itemsCountSuffix={getBouquetCountLabel(productsCount, locale)}
          renderPage={(pageItems) => (
            <div className={CATALOG_GRID_CLASSNAME}>
              {pageItems.map((product) => (
                <CatalogCard
                  key={product.id}
                  item={product}
                />
              ))}
            </div>
          )}
        />
      )}
    </div>
  );
}
