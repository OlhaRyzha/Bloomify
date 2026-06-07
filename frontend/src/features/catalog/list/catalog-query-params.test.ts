import { beforeEach, describe, expect, test } from 'vitest';

import {
  getCatalogQueryParams,
  setCatalogQueryParams,
} from './catalog-query-params';
import { DEFAULT_CATALOG_PARAMS } from './catalog.config';

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
    ).toEqual({
      page: 3,
      perPage: 12,
      search: 'rose',
      sort: 'price-desc',
      tag: 'classic',
    });
  });

  test('falls back to defaults for invalid numeric and sort params', () => {
    expect(
      getCatalogQueryParams('?page=-1&perPage=0&sort=unknown', {
        page: 2,
        perPage: 9,
      })
    ).toEqual({
      ...DEFAULT_CATALOG_PARAMS,
      page: 2,
      perPage: 9,
    });
  });

  test('serializes only meaningful params and keeps page params', () => {
    setCatalogQueryParams({
      page: 2,
      perPage: 9,
      search: '  lily  ',
      sort: 'name-asc',
      tag: 'wedding',
    });

    expect(window.location.pathname).toBe('/catalog');
    expect(window.location.search).toBe(
      '?page=2&perPage=9&search=lily&sort=name-asc&tag=wedding'
    );
  });

  test('removes default and empty params while keeping page params', () => {
    setCatalogQueryParams({
      page: 1,
      perPage: 6,
      search: '   ',
      sort: 'default',
      tag: 'all',
    });

    expect(window.location.search).toBe('?page=1&perPage=6');
  });
});
