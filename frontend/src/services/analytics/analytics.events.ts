import type { CartItemWithDetails } from '@/features/cart/cart.types';
import type { CheckoutPaymentMethod } from '@/features/checkout/api/checkout.service';
import type { CatalogItem } from '@/types/catalog';

import { toAnalyticsItem } from './analytics.helpers';
import Analytics from './analytics.service';

type LocalePayload = {
  locale?: string;
};

export const trackCatalogViewed = ({
  itemCount,
  itemListName,
  locale,
}: LocalePayload & {
  itemCount: number;
  itemListName: string;
}) => {
  Analytics.track('view_item_list', {
    itemListName,
    itemCount,
    locale,
  });
};

export const trackCatalogSearch = ({
  query,
  resultCount,
  locale,
}: LocalePayload & {
  query: string;
  resultCount: number;
}) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return;

  Analytics.track('search', {
    queryLength: normalizedQuery.length,
    resultCount,
    hasResults: resultCount > 0,
    locale,
  });
};

export const trackCatalogSort = ({
  resultCount,
  sort,
  locale,
}: LocalePayload & {
  resultCount: number;
  sort: string;
}) => {
  Analytics.track('sort_catalog', {
    sort,
    resultCount,
    locale,
  });
};

export const trackCatalogTagFilter = ({
  resultCount,
  tag,
  locale,
}: LocalePayload & {
  resultCount: number;
  tag: string;
}) => {
  Analytics.track('filter_catalog', {
    filterName: 'tag',
    filterValue: tag,
    resultCount,
    locale,
  });
};

export const trackProductSelected = ({
  item,
  itemListName = 'catalog',
  locale,
}: LocalePayload & {
  item: CatalogItem;
  itemListName?: string;
}) => {
  Analytics.track('select_item', {
    item: toAnalyticsItem(item),
    itemListName,
    locale,
  });
};

export const trackProductViewed = ({
  item,
  locale,
}: LocalePayload & {
  item: CatalogItem;
}) => {
  Analytics.track('view_item', {
    item: toAnalyticsItem(item),
    locale,
  });
};

export const trackCartItemAdded = ({
  item,
  locale,
  quantity = 1,
  source,
}: LocalePayload & {
  item: CatalogItem | CartItemWithDetails;
  quantity?: number;
  source?: string;
}) => {
  Analytics.track('add_to_cart', {
    item: toAnalyticsItem(item, quantity),
    currency: 'UAH',
    value: item.price ? item.price * quantity : undefined,
    source,
    locale,
  });
};

export const trackCartItemRemoved = ({
  item,
  locale,
  quantity = 1,
  source,
}: LocalePayload & {
  item: CatalogItem | CartItemWithDetails;
  quantity?: number;
  source?: string;
}) => {
  Analytics.track('remove_from_cart', {
    item: toAnalyticsItem(item, quantity),
    currency: 'UAH',
    value: item.price ? item.price * quantity : undefined,
    source,
    locale,
  });
};

export const trackCartViewed = ({
  itemCount,
  locale,
  value,
}: LocalePayload & {
  itemCount: number;
  value: number;
}) => {
  Analytics.track('view_cart', {
    currency: 'UAH',
    itemCount,
    value,
    locale,
  });
};

export const trackCheckoutStarted = ({
  itemCount,
  locale,
  paymentMethod,
  value,
}: LocalePayload & {
  itemCount: number;
  paymentMethod?: CheckoutPaymentMethod;
  value: number;
}) => {
  Analytics.track('begin_checkout', {
    currency: 'UAH',
    itemCount,
    paymentMethod,
    value,
    locale,
  });
};

export const trackCheckoutSubmitted = ({
  itemCount,
  locale,
  paymentMethod,
  value,
}: LocalePayload & {
  itemCount: number;
  paymentMethod: CheckoutPaymentMethod;
  value: number;
}) => {
  Analytics.track('checkout_submit', {
    currency: 'UAH',
    itemCount,
    paymentMethod,
    value,
    locale,
  });
};

export const trackPurchaseCompleted = ({
  itemCount,
  locale,
  orderId,
  paymentMethod,
  value,
}: LocalePayload & {
  itemCount: number;
  orderId: string | number;
  paymentMethod: CheckoutPaymentMethod;
  value: number;
}) => {
  Analytics.track('purchase', {
    currency: 'UAH',
    itemCount,
    orderId: String(orderId),
    paymentMethod,
    value,
    locale,
  });
};

export const trackPaymentFailed = ({
  locale,
  paymentMethod,
  reason,
}: LocalePayload & {
  paymentMethod: CheckoutPaymentMethod;
  reason: string;
}) => {
  Analytics.track('payment_failed', {
    paymentMethod,
    reason,
    locale,
  });
};

export const trackNewsletterSubscribed = ({
  locale,
  source = 'footer',
}: LocalePayload & {
  source?: string;
}) => {
  Analytics.track('newsletter_subscribe', {
    source,
    locale,
  });
};

export const trackAuthSignedIn = ({ locale }: LocalePayload) => {
  Analytics.track('auth_sign_in', {
    method: 'password',
    locale,
  });
};

export const trackAuthSignedUp = ({ locale }: LocalePayload) => {
  Analytics.track('auth_sign_up', {
    method: 'password',
    locale,
  });
};

export const trackAuthSignedOut = ({ locale }: LocalePayload) => {
  Analytics.track('auth_sign_out', {
    locale,
  });
};
