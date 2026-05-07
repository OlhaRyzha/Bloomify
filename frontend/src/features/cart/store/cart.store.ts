import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (id) => {
        const items = get().items;
        const existing = items.find((item) => item.id === id);
        const nextItems = existing
          ? items.map((item) =>
              item.id === id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...items, { id, quantity: 1 }];
        set({ items: nextItems });
      },
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        if (Number.isNaN(quantity)) {
          return;
        }

        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.id !== id) });
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'bloomify-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
