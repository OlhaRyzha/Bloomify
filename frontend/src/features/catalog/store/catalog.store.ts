'use client';

import { create } from 'zustand';
import type { CatalogQueryParams, SortOption } from '../list/types';
import { DEFAULT_CATALOG_PARAMS } from '../list/catalog.config';

export type CatalogState = CatalogQueryParams & {
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSort: (sort: SortOption) => void;
  setTag: (tag: string) => void;
  setSearch: (search: string) => void;
  hydrate: (params: CatalogQueryParams) => void;
};

export const useCatalogStore = create<CatalogState>((set) => ({
  ...DEFAULT_CATALOG_PARAMS,
  setPage: (page) => set({ page }),
  setPerPage: (perPage) => set({ perPage, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setTag: (tag) => set({ tag, page: 1 }),
  setSearch: (search) => set({ search }),
  hydrate: (params) => set(params),
}));
