import type { CartState } from './cart.store';

export const selectCartItems = (state: CartState) => state.items;
export const selectAddCartItem = (state: CartState) => state.addItem;
export const selectRemoveCartItem = (state: CartState) => state.removeItem;
export const selectUpdateCartQuantity = (state: CartState) =>
  state.updateQuantity;
export const selectClearCart = (state: CartState) => state.clearCart;
export const selectCartItemQuantity = (id?: string) => (state: CartState) =>
  id ? (state.items.find((item) => item.id === id)?.quantity ?? 0) : 0;
export const selectCartCount = (state: CartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0);

export const selectCartViewState = (state: CartState) => ({
  items: state.items,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
});
