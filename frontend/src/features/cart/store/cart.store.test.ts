import { beforeEach, describe, expect, test } from 'vitest';

import {
  selectCartCount,
  selectCartItemQuantity,
  selectCartItems,
} from './cart.selectors';
import { type CartState, useCartStore } from './cart.store';

const resetCartStore = () => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
};

const createCartState = (items: CartState['items']): CartState => ({
  items,
  appliedPromoCode: null,
  addItem: () => undefined,
  removeItem: () => undefined,
  updateQuantity: () => undefined,
  clearCart: () => undefined,
  setPromoCode: () => undefined,
  clearPromoCode: () => undefined,
});

describe('cart store', () => {
  beforeEach(() => {
    resetCartStore();
  });

  test('adds a new item with quantity one', () => {
    useCartStore.getState().addItem('rose-bouquet');

    expect(useCartStore.getState().items).toEqual([
      { id: 'rose-bouquet', quantity: 1 },
    ]);
  });

  test('increments quantity when adding the same item again', () => {
    const { addItem } = useCartStore.getState();

    addItem('rose-bouquet');
    addItem('rose-bouquet');

    expect(useCartStore.getState().items).toEqual([
      { id: 'rose-bouquet', quantity: 2 },
    ]);
  });

  test('removes an item by id', () => {
    const { addItem, removeItem } = useCartStore.getState();

    addItem('rose-bouquet');
    addItem('white-harmony');
    removeItem('rose-bouquet');

    expect(useCartStore.getState().items).toEqual([
      { id: 'white-harmony', quantity: 1 },
    ]);
  });

  test('updates item quantity', () => {
    const { addItem, updateQuantity } = useCartStore.getState();

    addItem('rose-bouquet');
    updateQuantity('rose-bouquet', 4);

    expect(useCartStore.getState().items).toEqual([
      { id: 'rose-bouquet', quantity: 4 },
    ]);
  });

  test('removes item when updated quantity is zero or lower', () => {
    const { addItem, updateQuantity } = useCartStore.getState();

    addItem('rose-bouquet');
    updateQuantity('rose-bouquet', 0);

    expect(useCartStore.getState().items).toEqual([]);
  });

  test('ignores NaN quantity updates', () => {
    const { addItem, updateQuantity } = useCartStore.getState();

    addItem('rose-bouquet');
    updateQuantity('rose-bouquet', Number.NaN);

    expect(useCartStore.getState().items).toEqual([
      { id: 'rose-bouquet', quantity: 1 },
    ]);
  });

  test('does not create an item when updating missing id', () => {
    useCartStore.getState().updateQuantity('missing-bouquet', 3);

    expect(useCartStore.getState().items).toEqual([]);
  });

  test('clears all cart items', () => {
    const { addItem, clearCart } = useCartStore.getState();

    addItem('rose-bouquet');
    addItem('white-harmony');
    clearCart();

    expect(useCartStore.getState().items).toEqual([]);
  });
});

describe('cart selectors', () => {
  test('selects cart items', () => {
    const items = [
      { id: 'rose-bouquet', quantity: 1 },
      { id: 'white-harmony', quantity: 2 },
    ];

    expect(selectCartItems(createCartState(items))).toEqual(items);
  });

  test('selects total item count', () => {
    const state = createCartState([
      { id: 'rose-bouquet', quantity: 1 },
      { id: 'white-harmony', quantity: 2 },
    ]);

    expect(selectCartCount(state)).toBe(3);
  });

  test('selects item quantity by id', () => {
    const state = createCartState([{ id: 'rose-bouquet', quantity: 2 }]);

    expect(selectCartItemQuantity('rose-bouquet')(state)).toBe(2);
    expect(selectCartItemQuantity('missing-bouquet')(state)).toBe(0);
    expect(selectCartItemQuantity()(state)).toBe(0);
  });
});
