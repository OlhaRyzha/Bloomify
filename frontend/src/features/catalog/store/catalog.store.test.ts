import { beforeEach, describe, expect, test } from 'vitest';

import { useCatalogStore } from './catalog.store';
import {
  selectCatalogGridState,
  selectCatalogPage,
  selectCatalogPerPage,
  selectCatalogSearch,
  selectCatalogSort,
  selectCatalogTag,
  selectHydrateCatalog,
  selectSetCatalogPage,
  selectSetCatalogPerPage,
  selectSetCatalogSearch,
  selectSetCatalogSort,
  selectSetCatalogTag,
} from './catalog.selectors';
import { DEFAULT_CATALOG_PARAMS } from '../list/catalog.config';

const resetCatalogStore = () => {
  useCatalogStore.setState(DEFAULT_CATALOG_PARAMS);
};

describe('catalog store', () => {
  beforeEach(() => {
    resetCatalogStore();
  });

  test('updates page and search independently', () => {
    selectSetCatalogPage(useCatalogStore.getState())(3);
    selectSetCatalogSearch(useCatalogStore.getState())('rose');

    expect(selectCatalogPage(useCatalogStore.getState())).toBe(3);
    expect(selectCatalogSearch(useCatalogStore.getState())).toBe('rose');
  });

  test('resets page when changing perPage, sort, or tag', () => {
    selectSetCatalogPage(useCatalogStore.getState())(4);

    selectSetCatalogPerPage(useCatalogStore.getState())(9);
    expect(selectCatalogPage(useCatalogStore.getState())).toBe(1);
    expect(selectCatalogPerPage(useCatalogStore.getState())).toBe(9);

    selectSetCatalogPage(useCatalogStore.getState())(3);
    selectSetCatalogSort(useCatalogStore.getState())('price-asc');
    expect(selectCatalogPage(useCatalogStore.getState())).toBe(1);
    expect(selectCatalogSort(useCatalogStore.getState())).toBe('price-asc');

    selectSetCatalogPage(useCatalogStore.getState())(2);
    selectSetCatalogTag(useCatalogStore.getState())('classic');
    expect(selectCatalogPage(useCatalogStore.getState())).toBe(1);
    expect(selectCatalogTag(useCatalogStore.getState())).toBe('classic');
  });

  test('hydrates state from query params and exposes grid selector shape', () => {
    selectHydrateCatalog(useCatalogStore.getState())({
      page: 2,
      perPage: 12,
      search: 'lily',
      sort: 'name-asc',
      tag: 'white',
    });

    expect(selectCatalogGridState(useCatalogStore.getState())).toMatchObject({
      page: 2,
      perPage: 12,
      searchInput: 'lily',
      sort: 'name-asc',
      tagFilter: 'white',
    });
  });
});
