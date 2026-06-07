import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createProductItem } from '../../api/products.factory';
import {
  createCatalogGridItems,
  resetCatalogStore,
} from '../catalog.test-utils';
import { useCatalogGridState } from './use-catalog-grid-state';

const items = createCatalogGridItems();

describe('useCatalogGridState', () => {
  beforeEach(() => {
    vi.useRealTimers();
    resetCatalogStore();
  });

  test('hydrates from URL params and exposes available tags', async () => {
    const paginatedItems = [
      ...items,
      createProductItem({
        id: 'rose-box',
        name: 'Rose box',
        description: 'Classic rose box',
        price: '1800',
        tag: 'classic',
      }),
      createProductItem({
        id: 'rose-cloud',
        name: 'Rose cloud',
        description: 'Classic rose cloud',
        price: '1700',
        tag: 'classic',
      }),
    ];

    window.history.pushState(
      {},
      '',
      '/catalog?page=2&perPage=2&sort=price-desc&tag=classic&search=rose'
    );

    const { result } = renderHook(() =>
      useCatalogGridState({ items: paginatedItems, pageSize: 6 })
    );

    await waitFor(() => {
      expect(result.current.page).toBe(2);
    });

    expect(result.current.perPage).toBe(2);
    expect(result.current.sort).toBe('price-desc');
    expect(result.current.tagFilter).toBe('classic');
    expect(result.current.searchInput).toBe('rose');
    expect(result.current.availableTags).toEqual([
      'classic',
      'white',
      'summer',
    ]);
  });

  test('sorts and filters catalog items', async () => {
    const { result } = renderHook(() =>
      useCatalogGridState({ items, pageSize: 6 })
    );

    await waitFor(() => {
      expect(result.current.sortedItems).toHaveLength(3);
    });

    result.current.updateTagFilter('classic');
    result.current.updateSort('price-asc');

    await waitFor(() => {
      expect(result.current.tagFilter).toBe('classic');
    });

    expect(result.current.filteredItems.map((item) => item.id)).toEqual([
      'rose-bouquet',
    ]);
    expect(result.current.sortedItems.map((item) => item.id)).toEqual([
      'rose-bouquet',
    ]);
  });

  test('resets invalid tag to all', async () => {
    window.history.pushState({}, '', '/catalog?tag=missing');

    const { result } = renderHook(() =>
      useCatalogGridState({ items, pageSize: 6 })
    );

    await waitFor(() => {
      expect(result.current.tagFilter).toBe('all');
    });
  });

  test('resets page when debounced search changes and writes query params', async () => {
    const { result } = renderHook(() =>
      useCatalogGridState({ items, pageSize: 6 })
    );

    await waitFor(() => {
      expect(result.current.page).toBe(1);
    });

    act(() => {
      result.current.setPage(2);
      result.current.updateSearch('white');
    });

    await waitFor(
      () => {
        expect(result.current.page).toBe(1);
      },
      { timeout: 1000 }
    );

    expect(window.location.search).toContain('search=white');
  });
});
