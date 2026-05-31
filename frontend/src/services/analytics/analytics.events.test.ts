import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { CatalogItem } from '@/types/catalog';

import {
  trackAuthSignedIn,
  trackCartItemAdded,
  trackCatalogSearch,
  trackCheckoutSubmitted,
  trackPurchaseCompleted,
} from './analytics.events';

const trackMock = vi.hoisted(() => vi.fn());

vi.mock('./analytics.service', () => ({
  default: {
    track: trackMock,
  },
}));

const catalogItem: CatalogItem = {
  id: 'bouquet-1',
  name: 'Біла гармонія',
  price: 1650,
  tag: 'Класика',
};

describe('analytics event helpers', () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  test('tracks search metadata without raw query text', () => {
    trackCatalogSearch({
      query: ' olha@example.com secret bouquet ',
      resultCount: 0,
      locale: 'uk',
    });

    expect(trackMock).toHaveBeenCalledWith('search', {
      queryLength: 'olha@example.com secret bouquet'.length,
      resultCount: 0,
      hasResults: false,
      locale: 'uk',
    });
    expect(JSON.stringify(trackMock.mock.calls[0])).not.toContain(
      'olha@example.com'
    );
  });

  test('does not track empty search input', () => {
    trackCatalogSearch({
      query: '   ',
      resultCount: 22,
      locale: 'uk',
    });

    expect(trackMock).not.toHaveBeenCalled();
  });

  test('maps cart additions to product analytics payloads', () => {
    trackCartItemAdded({
      item: catalogItem,
      quantity: 2,
      source: 'catalog_card',
      locale: 'uk',
    });

    expect(trackMock).toHaveBeenCalledWith('add_to_cart', {
      item: {
        itemId: 'bouquet-1',
        itemName: 'Біла гармонія',
        itemCategory: 'Класика',
        price: 1650,
        quantity: 2,
      },
      currency: 'UAH',
      value: 3300,
      source: 'catalog_card',
      locale: 'uk',
    });
  });

  test('tracks checkout submission without customer personal data', () => {
    trackCheckoutSubmitted({
      itemCount: 3,
      paymentMethod: 'cash_on_delivery',
      value: 4950,
      locale: 'uk',
    });

    expect(trackMock).toHaveBeenCalledWith('checkout_submit', {
      currency: 'UAH',
      itemCount: 3,
      paymentMethod: 'cash_on_delivery',
      value: 4950,
      locale: 'uk',
    });
    expect(JSON.stringify(trackMock.mock.calls[0])).not.toMatch(
      /email|phone|address|token/i
    );
  });

  test('coerces purchase order id for provider-safe deduplication', () => {
    trackPurchaseCompleted({
      itemCount: 1,
      orderId: 42,
      paymentMethod: 'cash_on_delivery',
      value: 1650,
      locale: 'uk',
    });

    expect(trackMock).toHaveBeenCalledWith('purchase', {
      currency: 'UAH',
      itemCount: 1,
      orderId: '42',
      paymentMethod: 'cash_on_delivery',
      value: 1650,
      locale: 'uk',
    });
  });

  test('tracks auth success with method only', () => {
    trackAuthSignedIn({ locale: 'uk' });

    expect(trackMock).toHaveBeenCalledWith('auth_sign_in', {
      method: 'password',
      locale: 'uk',
    });
  });
});
