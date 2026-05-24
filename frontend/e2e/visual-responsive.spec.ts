import { expect, test, type Page } from '@playwright/test';

import { e2ePrimaryCatalogItem } from './fixtures/catalog.fixture';
import { mockCatalogProducts } from './helpers/api';
import { goToAppPage, seedCart } from './helpers/user-flows';

const viewports = [
  { height: 900, name: 'desktop', width: 1440 },
  { height: 844, name: 'mobile', width: 390 },
] as const;

const preparePage = async (page: Page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockCatalogProducts(page);
};

test.describe('responsive visual baseline', () => {
  for (const viewport of viewports) {
    test(`home page ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await preparePage(page);
      await goToAppPage(page, '/uk');

      await expect(page.getByRole('main')).toHaveScreenshot(
        `home-${viewport.name}.png`,
        {
          animations: 'disabled',
          maxDiffPixelRatio: 0.01,
        }
      );
    });

    test(`catalog page ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await preparePage(page);
      await goToAppPage(page, '/uk/catalog');

      await expect(page.getByRole('main')).toHaveScreenshot(
        `catalog-${viewport.name}.png`,
        {
          animations: 'disabled',
          maxDiffPixelRatio: 0.01,
        }
      );
    });

    test(`checkout page ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await preparePage(page);
      await seedCart(page, [{ id: e2ePrimaryCatalogItem.id, quantity: 1 }]);
      await goToAppPage(page, '/uk/checkout');

      await expect(page.getByRole('main')).toHaveScreenshot(
        `checkout-${viewport.name}.png`,
        {
          animations: 'disabled',
          maxDiffPixelRatio: 0.01,
        }
      );
    });
  }
});
