import type { CatalogState } from './catalog.store';

export const selectCatalogPage = (state: CatalogState) => state.page;
export const selectCatalogPerPage = (state: CatalogState) => state.perPage;
export const selectCatalogSearch = (state: CatalogState) => state.search;
export const selectCatalogSort = (state: CatalogState) => state.sort;
export const selectCatalogTag = (state: CatalogState) => state.tag;
export const selectSetCatalogPage = (state: CatalogState) => state.setPage;
export const selectSetCatalogPerPage = (state: CatalogState) =>
  state.setPerPage;
export const selectSetCatalogSort = (state: CatalogState) => state.setSort;
export const selectSetCatalogTag = (state: CatalogState) => state.setTag;
export const selectSetCatalogSearch = (state: CatalogState) => state.setSearch;
export const selectHydrateCatalog = (state: CatalogState) => state.hydrate;

export const selectCatalogGridState = (state: CatalogState) => ({
  page: state.page,
  perPage: state.perPage,
  sort: state.sort,
  tagFilter: state.tag,
  searchInput: state.search,
  setPage: state.setPage,
  setPerPage: state.setPerPage,
  setSort: state.setSort,
  setTag: state.setTag,
  setSearch: state.setSearch,
  hydrate: state.hydrate,
});
