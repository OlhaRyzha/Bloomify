'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDebounce } from '@/hooks/use-debounce';
import {
  getCatalogQueryParams,
  setCatalogQueryParams,
} from '../catalog-query-params';
import { selectCatalogGridState } from '../../store/catalog.selectors';
import { useCatalogStore } from '../../store/catalog.store';
import type { CatalogQueryParams, SortOption } from '../types';
import { isDefaultTag } from '@/utils/guards/is-default-tag';
import { DEFAULT_TAG } from '../catalog.config';

type UseCatalogGridStateProps = {
  pageSize: number;
  availableTags?: string[];
};
export function useCatalogGridState({
  pageSize,
  availableTags = [],
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

  useEffect(() => {
    if (
      availableTags.length > 0 &&
      !isDefaultTag(tagFilter) &&
      !availableTags.includes(tagFilter)
    ) {
      setTag(DEFAULT_TAG);
    }
  }, [availableTags, setTag, tagFilter]);

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

  const queryParams = useMemo<CatalogQueryParams>(
    () => ({
      page,
      perPage,
      search: debouncedSearch,
      sort,
      tag: tagFilter,
    }),
    [debouncedSearch, page, perPage, sort, tagFilter]
  );

  return {
    page,
    perPage,
    sort,
    tagFilter,
    searchInput,
    debouncedSearch,
    availableTags,
    queryParams,
    setPage,
    updateSearch,
    updateSort,
    updateTagFilter,
    updatePerPage,
  };
}
