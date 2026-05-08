import { beforeEach, describe, expect, test } from 'vitest';

import {
  selectFavoriteIds,
  selectIsFavorite,
} from './favorites.selectors';
import {
  type FavoritesState,
  useFavoritesStore,
} from './favorites.store';

const resetFavoritesStore = () => {
  localStorage.clear();
  useFavoritesStore.setState({ ids: [] });
};

const createFavoritesState = (ids: string[]): FavoritesState => ({
  ids,
  toggleFavorite: () => undefined,
  isFavorite: (id) => ids.includes(id),
  clearFavorites: () => undefined,
});

describe('favorites store', () => {
  beforeEach(() => {
    resetFavoritesStore();
  });

  test('adds an id when toggling a missing favorite', () => {
    useFavoritesStore.getState().toggleFavorite('rose-bouquet');

    expect(useFavoritesStore.getState().ids).toEqual(['rose-bouquet']);
  });

  test('removes an id when toggling an existing favorite', () => {
    const { toggleFavorite } = useFavoritesStore.getState();

    toggleFavorite('rose-bouquet');
    toggleFavorite('rose-bouquet');

    expect(useFavoritesStore.getState().ids).toEqual([]);
  });

  test('keeps other favorite ids when removing one item', () => {
    const { toggleFavorite } = useFavoritesStore.getState();

    toggleFavorite('rose-bouquet');
    toggleFavorite('white-harmony');
    toggleFavorite('rose-bouquet');

    expect(useFavoritesStore.getState().ids).toEqual(['white-harmony']);
  });

  test('checks whether an id is favorite', () => {
    const { toggleFavorite, isFavorite } = useFavoritesStore.getState();

    toggleFavorite('rose-bouquet');

    expect(isFavorite('rose-bouquet')).toBe(true);
    expect(isFavorite('white-harmony')).toBe(false);
  });

  test('clears all favorite ids', () => {
    const { toggleFavorite, clearFavorites } = useFavoritesStore.getState();

    toggleFavorite('rose-bouquet');
    toggleFavorite('white-harmony');
    clearFavorites();

    expect(useFavoritesStore.getState().ids).toEqual([]);
  });
});

describe('favorites selectors', () => {
  test('selects favorite ids', () => {
    const ids = ['rose-bouquet', 'white-harmony'];

    expect(selectFavoriteIds(createFavoritesState(ids))).toEqual(ids);
  });

  test('selects favorite status by id', () => {
    const state = createFavoritesState(['rose-bouquet']);

    expect(selectIsFavorite('rose-bouquet')(state)).toBe(true);
    expect(selectIsFavorite('white-harmony')(state)).toBe(false);
  });
});
