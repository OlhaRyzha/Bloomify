import type { CheckoutPaymentMethod } from '@/features/checkout/api/checkout.service';

export type AnalyticsEventName =
  | 'view_item_list'
  | 'select_item'
  | 'view_item'
  | 'search'
  | 'filter_catalog'
  | 'sort_catalog'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'checkout_submit'
  | 'purchase'
  | 'payment_failed'
  | 'newsletter_subscribe'
  | 'auth_sign_in'
  | 'auth_sign_up'
  | 'auth_sign_out';

export type AnalyticsItem = {
  itemId: string;
  itemName: string;
  itemCategory?: string;
  price?: number;
  quantity?: number;
};

export type AnalyticsEventPayloadMap = {
  view_item_list: {
    itemListName: string;
    itemCount: number;
    locale?: string;
  };
  select_item: {
    item: AnalyticsItem;
    itemListName?: string;
    locale?: string;
  };
  view_item: {
    item: AnalyticsItem;
    locale?: string;
  };
  search: {
    hasResults: boolean;
    queryLength: number;
    resultCount: number;
    locale?: string;
  };
  filter_catalog: {
    filterName: 'tag';
    filterValue: string;
    resultCount: number;
    locale?: string;
  };
  sort_catalog: {
    sort: string;
    resultCount: number;
    locale?: string;
  };
  add_to_cart: {
    item: AnalyticsItem;
    currency: 'UAH';
    value?: number;
    source?: string;
    locale?: string;
  };
  remove_from_cart: {
    item: AnalyticsItem;
    currency: 'UAH';
    value?: number;
    source?: string;
    locale?: string;
  };
  view_cart: {
    currency: 'UAH';
    itemCount: number;
    value: number;
    locale?: string;
  };
  begin_checkout: {
    currency: 'UAH';
    itemCount: number;
    paymentMethod?: CheckoutPaymentMethod;
    value: number;
    locale?: string;
  };
  checkout_submit: {
    currency: 'UAH';
    itemCount: number;
    paymentMethod: CheckoutPaymentMethod;
    value: number;
    locale?: string;
  };
  purchase: {
    currency: 'UAH';
    itemCount: number;
    orderId: string;
    paymentMethod: CheckoutPaymentMethod;
    value: number;
    locale?: string;
  };
  payment_failed: {
    paymentMethod: CheckoutPaymentMethod;
    reason: string;
    locale?: string;
  };
  newsletter_subscribe: {
    source?: string;
    locale?: string;
  };
  auth_sign_in: {
    method: 'password' | 'google';
    locale?: string;
  };
  auth_sign_up: {
    method: 'password' | 'google';
    locale?: string;
  };
  auth_sign_out: {
    locale?: string;
  };
};

export type AnalyticsEventPayload<TName extends AnalyticsEventName> =
  AnalyticsEventPayloadMap[TName];

export type AnalyticsProvider = {
  track: <TName extends AnalyticsEventName>(
    name: TName,
    payload: AnalyticsEventPayload<TName>
  ) => void;
};
