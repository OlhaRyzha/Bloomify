import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { useCartStore } from '@/features/cart/store/cart.store';
import { renderWithProviders } from '@/test/render';

import AddToCartButton from './add-to-cart-button';

describe('AddToCartButton', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  test('adds an item and switches to accessible quantity controls', async () => {
    const { user } = renderWithProviders(
      <AddToCartButton
        itemId='rose-1'
        itemName='White rose'
      />,
      { locale: 'en' }
    );

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(useCartStore.getState().items).toEqual([
      { id: 'rose-1', quantity: 1 },
    ]);
    expect(
      screen.getByRole('group', { name: /quantity of.*white rose.*in cart/i })
    ).toBeInTheDocument();
  });

  test('increases and decreases existing quantity with named icon buttons', async () => {
    useCartStore.setState({ items: [{ id: 'rose-1', quantity: 2 }] });

    const { user } = renderWithProviders(
      <AddToCartButton
        itemId='rose-1'
        itemName='White rose'
      />,
      { locale: 'en' }
    );

    await user.click(
      screen.getByRole('button', { name: /increase.*white rose.*quantity/i })
    );
    expect(useCartStore.getState().items).toEqual([
      { id: 'rose-1', quantity: 3 },
    ]);

    await user.click(
      screen.getByRole('button', { name: /decrease.*white rose.*quantity/i })
    );
    await user.click(
      screen.getByRole('button', { name: /decrease.*white rose.*quantity/i })
    );
    await user.click(
      screen.getByRole('button', { name: /decrease.*white rose.*quantity/i })
    );

    expect(useCartStore.getState().items).toEqual([]);
  });
});
