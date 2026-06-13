import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DEFAULT_PAGE, DEFAULT_PER_PAGE, DEFAULT_TAG } from '../catalog.config';
import { availableTags, resetCatalogStore } from '../tests/catalog.test-utils';
import { useCatalogGridState } from './use-catalog-grid-state';

const renderCatalogGridStateHook = () =>
  renderHook(() =>
    useCatalogGridState({
      pageSize: DEFAULT_PER_PAGE,
      availableTags,
    })
  );

describe('useCatalogGridState', () => {
  beforeEach(() => {
    vi.useRealTimers();
    resetCatalogStore();
    window.history.pushState({}, '', '/catalog');
  });

  test('hydrates from URL params and exposes available tags', async () => {
    window.history.pushState(
      {},
      '',
      '/catalog?page=2&perPage=2&sort=price-desc&tag=classic&search=rose'
    );

    const { result } = renderCatalogGridStateHook();

    await waitFor(() => {
      expect(result.current.page).toBe(2);
    });

    expect(result.current.perPage).toBe(2);
    expect(result.current.sort).toBe('price-desc');
    expect(result.current.tagFilter).toBe('classic');
    expect(result.current.searchInput).toBe('rose');
    expect(result.current.availableTags).toEqual(availableTags);
    expect(result.current.queryParams).toMatchObject({
      page: 2,
      perPage: 2,
      sort: 'price-desc',
      tag: 'classic',
    });
  });

  test('updates server query params when tag and sort change', async () => {
    const { result } = renderCatalogGridStateHook();

    await waitFor(() => {
      expect(result.current.page).toBe(1);
    });

    act(() => {
      result.current.updateTagFilter('classic');
      result.current.updateSort('price-asc');
    });

    await waitFor(() => {
      expect(result.current.tagFilter).toBe('classic');
    });

    expect(result.current.queryParams).toMatchObject({
      page: 1,
      sort: 'price-asc',
      tag: 'classic',
    });
  });

  test('resets invalid tag to all', async () => {
    window.history.pushState({}, '', '/catalog?tag=missing');

    const { result } = renderCatalogGridStateHook();

    await waitFor(() => {
      expect(result.current.tagFilter).toBe(DEFAULT_TAG);
    });
  });

  test('resets page when debounced search changes and writes query params', async () => {
    const { result } = renderCatalogGridStateHook();

    await waitFor(() => {
      expect(result.current.page).toBe(1);
    });

    act(() => {
      result.current.setPage(2);
      result.current.updateSearch('white');
    });

    await waitFor(
      () => {
        expect(result.current.page).toBe(DEFAULT_PAGE);
      },
      { timeout: 1000 }
    );

    expect(window.location.search).toContain('search=white');
    expect(result.current.queryParams.search).toBe('white');
  });
});
