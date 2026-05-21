import type { Page } from '@playwright/test';

import { apiUrl } from '../config/env';
import { createCashOnDeliveryCheckoutResponse } from '../factories/checkout.factory';
import { e2eCatalogItems } from '../fixtures/catalog.fixture';

export const mockCatalogProducts = async (page: Page) => {
  await page.route(`${apiUrl('products')}**`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: e2eCatalogItems,
    });
  });
};

export const mockCashOnDeliveryCheckout = async (
  page: Page,
  assertRequest?: (payload: unknown) => void
) => {
  await page.route(`${apiUrl('orders/checkout')}**`, async (route) => {
    assertRequest?.(route.request().postDataJSON());

    await route.fulfill({
      contentType: 'application/json',
      json: createCashOnDeliveryCheckoutResponse(),
    });
  });
};
