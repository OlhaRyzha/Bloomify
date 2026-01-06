import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type FavoritesState = {
  ids: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggleFavorite: (id) => {
        const ids = get().ids;
        const next = ids.includes(id)
          ? ids.filter((itemId) => itemId !== id)
          : [...ids, id];
        set({ ids: next });
      },
      isFavorite: (id) => get().ids.includes(id),
      clearFavorites: () => set({ ids: [] }),
    }),
    {
      name: 'bloomify-favorites',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ids: state.ids }),
    }
  )
);
