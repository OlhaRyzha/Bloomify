import { beforeEach, describe, expect, test } from 'vitest';
import {
  getCatalogQueryParams,
  setCatalogQueryParams,
} from '../catalog-query-params';
import { DEFAULT_CATALOG_PARAMS } from '../catalog.config';
import {
  testCatalogParams1,
  testCatalogParams2,
  testCatalogParams3,
} from './catalog.fixture';

describe('catalog query params', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/catalog');
  });

  test('returns defaults for empty search params', () => {
    expect(getCatalogQueryParams('')).toEqual(DEFAULT_CATALOG_PARAMS);
  });

  test('parses and trims supported params', () => {
    expect(
      getCatalogQueryParams(
        '?page=3&perPage=12&search=%20rose%20&sort=price-desc&tag=%20classic%20'
      )
    ).toEqual(testCatalogParams1);
  });

  test('falls back to defaults for invalid numeric and sort params', () => {
    expect(
      getCatalogQueryParams(
        '?page=-1&perPage=0&sort=unknown',
        testCatalogParams3
      )
    ).toEqual({
      ...DEFAULT_CATALOG_PARAMS,
      ...testCatalogParams3,
    });
  });

  test('serializes only meaningful params and keeps page params', () => {
    setCatalogQueryParams(testCatalogParams2);

    expect(window.location.pathname).toBe('/catalog');
    expect(window.location.search).toBe(
      '?page=2&perPage=9&search=lily&sort=name-asc&tag=wedding'
    );
  });

  test('removes default and empty params while keeping page params', () => {
    setCatalogQueryParams(DEFAULT_CATALOG_PARAMS);

    expect(window.location.search).toBe('?page=1&perPage=6');
  });
});
