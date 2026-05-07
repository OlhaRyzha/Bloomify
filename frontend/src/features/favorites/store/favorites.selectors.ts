import type { FavoritesState } from './favorites.store';

export const selectFavoriteIds = (state: FavoritesState) => state.ids;
export const selectToggleFavorite = (state: FavoritesState) =>
  state.toggleFavorite;
export const selectIsFavorite = (id: string) => (state: FavoritesState) =>
  state.isFavorite(id);
export const selectClearFavorites = (state: FavoritesState) =>
  state.clearFavorites;
