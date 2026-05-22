import type { Page, Route } from '@playwright/test';

import { createCashOnDeliveryCheckoutResponse } from '../factories/checkout.factory';
import { e2eCatalogItems } from '../fixtures/catalog.fixture';

export const mockCatalogProducts = async (page: Page) => {
  const fulfillProducts = async (route: Route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: e2eCatalogItems,
    });
  };

  await page.route('**/products**', fulfillProducts);
};

export const mockCashOnDeliveryCheckout = async (
  page: Page,
  assertRequest?: (payload: unknown) => void
) => {
  const fulfillCheckout = async (route: Route) => {
    assertRequest?.(route.request().postDataJSON());

    await route.fulfill({
      contentType: 'application/json',
      json: createCashOnDeliveryCheckoutResponse(),
    });
  };

  await page.route('**/orders/checkout**', fulfillCheckout);
};
