import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { e2ePrimaryCatalogItem } from './fixtures/catalog.fixture';
import { goToAppPage, seedCart, seedFavorites } from './helpers/user-flows';

const criticalPages = [
  { name: 'home', path: '/uk' },
  { name: 'catalog', path: '/uk/catalog' },
  { name: 'product details', path: '/uk/catalog/white-harmony' },
  { name: 'sign in', path: '/uk/sign-in' },
] as const;

test.describe('accessibility smoke', () => {
  for (const pageConfig of criticalPages) {
    test(`${pageConfig.name} has no automated axe violations`, async ({
      page,
    }) => {
      await goToAppPage(page, pageConfig.path);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test('cart, favorites, and checkout states have no automated axe violations', async ({
    page,
  }) => {
    await seedCart(page, [{ id: e2ePrimaryCatalogItem.id, quantity: 1 }]);
    await seedFavorites(page, [e2ePrimaryCatalogItem.id]);

    for (const path of ['/uk/cart', '/uk/favorites', '/uk/checkout']) {
      await goToAppPage(page, path);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    }
  });
});
