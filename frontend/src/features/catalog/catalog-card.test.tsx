import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { renderWithProviders } from '@/test/render';
import { useFavoritesStore } from '@/features/favorites/store/favorites.store';

import { createProductItem } from './api/products.factory';
import CatalogCard from './catalog-card';

const resetFavoritesStore = () => {
  localStorage.clear();
  useFavoritesStore.setState({ ids: [] });
};

describe('CatalogCard', () => {
  beforeEach(() => {
    resetFavoritesStore();
  });

  test('toggles favorite state with accessible pressed state and label', async () => {
    const item = createProductItem({
      id: 'white-harmony',
      name: 'White harmony',
    });

    const { user } = renderWithProviders(<CatalogCard item={item} />, {
      locale: 'en',
    });

    const addButton = await screen.findByRole('button', {
      name: /add.*white harmony.*favorites/i,
    });

    expect(addButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(addButton);

    const removeButton = screen.getByRole('button', {
      name: /remove.*white harmony.*favorites/i,
    });
    expect(removeButton).toHaveAttribute('aria-pressed', 'true');
  });
});
