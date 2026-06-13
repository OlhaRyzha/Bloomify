import type { Page, Route } from '@playwright/test';

import { createCashOnDeliveryCheckoutResponse } from '../factories/checkout.factory';
import { e2eCatalogItems } from '../fixtures/catalog.fixture';

const catalogTags = Array.from(
  new Set(e2eCatalogItems.map((item) => item.tag).filter(Boolean))
);

const createPaginatedCatalogResponse = () => ({
  items: e2eCatalogItems,
  page: 1,
  pageSize: e2eCatalogItems.length,
  total: e2eCatalogItems.length,
  totalPages: 1,
  hasNextPage: false,
  nextPage: null,
});

const isCatalogListRequest = (requestUrl: URL) => {
  const listParamNames = [
    'page',
    'pageSize',
    'perPage',
    'sort',
    'tag',
    'search',
  ];

  return listParamNames.some((paramName) =>
    requestUrl.searchParams.has(paramName)
  );
};

export const mockCatalogProducts = async (page: Page) => {
  const fulfillProducts = async (route: Route) => {
    const requestUrl = new URL(route.request().url());
    const pathParts = requestUrl.pathname.split('/').filter(Boolean);
    const lastPathPart = pathParts.at(-1);

    if (lastPathPart === 'filters') {
      await route.fulfill({
        contentType: 'application/json',
        json: {
          tags: catalogTags,
        },
      });
      return;
    }

    const product = e2eCatalogItems.find((item) => item.id === lastPathPart);

    if (product) {
      await route.fulfill({
        contentType: 'application/json',
        json: product,
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      json: isCatalogListRequest(requestUrl)
        ? createPaginatedCatalogResponse()
        : e2eCatalogItems,
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
