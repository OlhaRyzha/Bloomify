'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { CatalogItem } from '@/types/catalog';
import { useDebounce } from '@/hooks/use-debounce';
import {
  getCatalogQueryParams,
  setCatalogQueryParams,
} from './catalog-query-params';
import { selectCatalogGridState } from './store/catalog.selectors';
import { useCatalogStore } from './store/catalog.store';
import type { SortOption } from './catalog.types';

type UseCatalogGridStateProps = {
  items: CatalogItem[];
  pageSize: number;
};

export function useCatalogGridState({
  items,
  pageSize,
}: UseCatalogGridStateProps) {
  const hydratedFromUrl = useRef(false);
  const {
    page,
    perPage,
    sort,
    tagFilter,
    searchInput,
    setPage,
    setPerPage,
    setSort,
    setTag,
    setSearch,
    hydrate,
  } = useCatalogStore(useShallow(selectCatalogGridState));
  const debouncedSearch = useDebounce(searchInput);
  const isInitialSearchSync = useRef(false);

  useEffect(() => {
    const paramsFromUrl = getCatalogQueryParams(window.location.search, {
      perPage: pageSize,
    });
    hydrate(paramsFromUrl);
    hydratedFromUrl.current = true;
  }, [pageSize, hydrate]);

  useEffect(() => {
    if (!isInitialSearchSync.current) {
      isInitialSearchSync.current = true;
      return;
    }
    setPage(1);
  }, [debouncedSearch, setPage]);

  useEffect(() => {
    if (!hydratedFromUrl.current) {
      return;
    }

    setCatalogQueryParams({
      page,
      perPage,
      search: searchInput,
      sort,
      tag: tagFilter,
    });
  }, [page, perPage, searchInput, sort, tagFilter]);

  const availableTags = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => item.tag)
            .filter((tag): tag is string => Boolean(tag))
        )
      ),
    [items]
  );

  useEffect(() => {
    if (tagFilter !== 'all' && !availableTags.includes(tagFilter)) {
      setTag('all');
    }
  }, [availableTags, setTag, tagFilter]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    const searchFiltered =
      normalizedSearch.length === 0
        ? items
        : items.filter((item) => {
            const haystack = `${item.name} ${
              item.description ?? ''
            }`.toLowerCase();
            return haystack.includes(normalizedSearch);
          });

    if (tagFilter === 'all') {
      return searchFiltered;
    }
    return searchFiltered.filter((item) => item.tag === tagFilter);
  }, [items, tagFilter, debouncedSearch]);

  const sortedItems = useMemo(() => {
    const itemsToSort = [...filteredItems];
    switch (sort) {
      case 'price-asc':
        return itemsToSort.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return itemsToSort.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return itemsToSort.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return itemsToSort;
    }
  }, [filteredItems, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / perPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages, setPage]);

  const skeletonItems = useMemo(
    () =>
      Array.from({ length: perPage }, (_, idx) => ({
        id: `skeleton-${idx}`,
        name: '',
        price: 0,
      })) as CatalogItem[],
    [perPage]
  );

  const updateSearch = (value: string) => {
    setSearch(value);
  };

  const updateSort = (value: SortOption) => {
    setSort(value);
  };

  const updateTagFilter = (value: string) => {
    setTag(value);
  };

  const updatePerPage = (value: number) => {
    setPerPage(value);
  };

  return {
    page,
    perPage,
    sort,
    tagFilter,
    searchInput,
    debouncedSearch,
    availableTags,
    filteredItems,
    sortedItems,
    skeletonItems,
    setPage,
    updateSearch,
    updateSort,
    updateTagFilter,
    updatePerPage,
  };
}
