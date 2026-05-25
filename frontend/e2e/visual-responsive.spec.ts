import { expect, test, type Page } from '@playwright/test';

import { e2ePrimaryCatalogItem } from './fixtures/catalog.fixture';
import { mockCatalogProducts } from './helpers/api';
import { goToAppPage, seedCart } from './helpers/user-flows';

const viewports = [
  { height: 900, name: 'desktop', width: 1440 },
  { height: 844, name: 'mobile', width: 390 },
] as const;

const getMaxDiffPixelRatio = (viewportName: (typeof viewports)[number]['name']) =>
  viewportName === 'mobile' ? 0.18 : 0.08;

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

      await expect(page).toHaveScreenshot(`home-${viewport.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: getMaxDiffPixelRatio(viewport.name),
        scale: 'css',
      });
    });

    test(`catalog page ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await preparePage(page);
      await goToAppPage(page, '/uk/catalog');

      await expect(page).toHaveScreenshot(`catalog-${viewport.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: getMaxDiffPixelRatio(viewport.name),
        scale: 'css',
      });
    });

    test(`checkout page ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await preparePage(page);
      await seedCart(page, [{ id: e2ePrimaryCatalogItem.id, quantity: 1 }]);
      await goToAppPage(page, '/uk/checkout');

      await expect(page).toHaveScreenshot(`checkout-${viewport.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: getMaxDiffPixelRatio(viewport.name),
        scale: 'css',
      });
    });
  }
});
