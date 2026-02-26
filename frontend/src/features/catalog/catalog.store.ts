'use client';

import { create } from 'zustand';
import type { CatalogQueryParams, SortOption } from './catalog.types';

type CatalogState = CatalogQueryParams & {
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSort: (sort: SortOption) => void;
  setTag: (tag: string) => void;
  setSearch: (search: string) => void;
  hydrate: (params: CatalogQueryParams) => void;
};

export const useCatalogStore = create<CatalogState>((set) => ({
  page: 1,
  perPage: 6,
  search: '',
  sort: 'default',
  tag: 'all',
  setPage: (page) => set({ page }),
  setPerPage: (perPage) => set({ perPage, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setTag: (tag) => set({ tag, page: 1 }),
  setSearch: (search) => set({ search }),
  hydrate: (params) => set(params),
}));
