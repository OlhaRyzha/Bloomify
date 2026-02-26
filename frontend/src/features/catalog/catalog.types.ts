'use client';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

export type CatalogQueryParams = {
  page: number;
  perPage: number;
  search: string;
  sort: SortOption;
  tag: string;
};
