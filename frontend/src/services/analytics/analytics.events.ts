import type { CartItemWithDetails } from '@/features/cart/cart.types';
import type { CatalogItem } from '@/types/catalog';

import { toAnalyticsItem } from './analytics.helpers';
import Analytics from './analytics.service';
import type { AnalyticsEventPayload } from './analytics.types';

type LocalePayload = {
  locale?: string;
};

type CatalogAnalyticsItem = CatalogItem;
type CartAnalyticsItem = CatalogItem | CartItemWithDetails;

type ProductItemPayload = LocalePayload & {
  item: CatalogAnalyticsItem;
};

type CartItemPayload = LocalePayload & {
  item: CartAnalyticsItem;
  quantity?: number;
  source?: string;
};

type CatalogViewedPayload = AnalyticsEventPayload<'view_item_list'>;

type CatalogSearchPayload = LocalePayload & {
  query: string;
  resultCount: number;
};

type CatalogSortPayload = AnalyticsEventPayload<'sort_catalog'>;

type CatalogTagFilterPayload = LocalePayload & {
  resultCount: number;
  tag: string;
};

type ProductSelectedPayload = ProductItemPayload & {
  itemListName?: AnalyticsEventPayload<'select_item'>['itemListName'];
};

type CartViewedPayload = Omit<AnalyticsEventPayload<'view_cart'>, 'currency'>;

type CheckoutStartedPayload = Omit<
  AnalyticsEventPayload<'begin_checkout'>,
  'currency'
>;

type CheckoutSubmittedPayload = Omit<
  AnalyticsEventPayload<'checkout_submit'>,
  'currency'
>;

type PurchaseCompletedPayload = Omit<
  AnalyticsEventPayload<'purchase'>,
  'currency'
>;

type PaymentFailedPayload = AnalyticsEventPayload<'payment_failed'>;

type NewsletterSubscribedPayload =
  AnalyticsEventPayload<'newsletter_subscribe'>;

const CURRENCY = 'UAH' as const;

const getCartItemValue = (
  item: CartAnalyticsItem,
  quantity: number
): number | undefined => {
  if (!item.price) return undefined;

  return Number(item.price) * quantity;
};

export const trackCatalogViewed = ({
  itemCount,
  itemListName,
  locale,
}: CatalogViewedPayload) => {
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
}: CatalogSearchPayload) => {
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
}: CatalogSortPayload) => {
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
}: CatalogTagFilterPayload) => {
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
}: ProductSelectedPayload) => {
  Analytics.track('select_item', {
    item: toAnalyticsItem(item),
    itemListName,
    locale,
  });
};

export const trackProductViewed = ({ item, locale }: ProductItemPayload) => {
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
}: CartItemPayload) => {
  Analytics.track('add_to_cart', {
    item: toAnalyticsItem(item, quantity),
    currency: CURRENCY,
    value: getCartItemValue(item, quantity),
    source,
    locale,
  });
};

export const trackCartItemRemoved = ({
  item,
  locale,
  quantity = 1,
  source,
}: CartItemPayload) => {
  Analytics.track('remove_from_cart', {
    item: toAnalyticsItem(item, quantity),
    currency: CURRENCY,
    value: getCartItemValue(item, quantity),
    source,
    locale,
  });
};

export const trackCartViewed = ({
  itemCount,
  locale,
  value,
}: CartViewedPayload) => {
  Analytics.track('view_cart', {
    currency: CURRENCY,
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
}: CheckoutStartedPayload) => {
  Analytics.track('begin_checkout', {
    currency: CURRENCY,
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
}: CheckoutSubmittedPayload) => {
  Analytics.track('checkout_submit', {
    currency: CURRENCY,
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
}: PurchaseCompletedPayload) => {
  Analytics.track('purchase', {
    currency: CURRENCY,
    itemCount,
    orderId,
    paymentMethod,
    value,
    locale,
  });
};

export const trackPaymentFailed = ({
  locale,
  paymentMethod,
  reason,
}: PaymentFailedPayload) => {
  Analytics.track('payment_failed', {
    paymentMethod,
    reason,
    locale,
  });
};

export const trackNewsletterSubscribed = ({
  locale,
  source = 'footer',
}: NewsletterSubscribedPayload) => {
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
