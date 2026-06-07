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

type AnalyticsLocalePayload = {
  locale?: string;
};

type AnalyticsCurrencyPayload = {
  currency: 'UAH';
};

type AnalyticsValuePayload = AnalyticsCurrencyPayload & {
  value: number;
};

type AnalyticsOptionalValuePayload = AnalyticsCurrencyPayload & {
  value?: number;
};

type AnalyticsItemCountPayload = {
  itemCount: number;
};

type AnalyticsResultCountPayload = {
  resultCount: number;
};

type AnalyticsPaymentMethodPayload = {
  paymentMethod: CheckoutPaymentMethod;
};

type AnalyticsOptionalPaymentMethodPayload = {
  paymentMethod?: CheckoutPaymentMethod;
};

type AnalyticsAuthMethodPayload = {
  method: 'password' | 'google';
};

export type AnalyticsItem = {
  itemId: string;
  itemName: string;
  itemCategory?: string;
  price?: string;
  quantity?: number;
};

type AnalyticsItemPayload = {
  item: AnalyticsItem;
};

type AnalyticsCartItemPayload = AnalyticsItemPayload &
  AnalyticsOptionalValuePayload &
  AnalyticsLocalePayload & {
    source?: string;
  };

type AnalyticsCheckoutPayload = AnalyticsItemCountPayload &
  AnalyticsValuePayload &
  AnalyticsLocalePayload;

type AnalyticsCheckoutWithPaymentPayload = AnalyticsCheckoutPayload &
  AnalyticsPaymentMethodPayload;

export type AnalyticsEventPayloadMap = {
  view_item_list: AnalyticsItemCountPayload &
    AnalyticsLocalePayload & {
      itemListName: string;
    };

  select_item: AnalyticsItemPayload &
    AnalyticsLocalePayload & {
      itemListName?: string;
    };

  view_item: AnalyticsItemPayload & AnalyticsLocalePayload;

  search: AnalyticsResultCountPayload &
    AnalyticsLocalePayload & {
      hasResults: boolean;
      queryLength: number;
    };

  filter_catalog: AnalyticsResultCountPayload &
    AnalyticsLocalePayload & {
      filterName: 'tag';
      filterValue: string;
    };

  sort_catalog: AnalyticsResultCountPayload &
    AnalyticsLocalePayload & {
      sort: string;
    };

  add_to_cart: AnalyticsCartItemPayload;

  remove_from_cart: AnalyticsCartItemPayload;

  view_cart: AnalyticsCheckoutPayload;

  begin_checkout: AnalyticsCheckoutPayload &
    AnalyticsOptionalPaymentMethodPayload;

  checkout_submit: AnalyticsCheckoutWithPaymentPayload;

  purchase: AnalyticsCheckoutWithPaymentPayload & {
    orderId: number;
  };

  payment_failed: AnalyticsPaymentMethodPayload &
    AnalyticsLocalePayload & {
      reason: string;
    };

  newsletter_subscribe: AnalyticsLocalePayload & {
    source?: string;
  };

  auth_sign_in: AnalyticsAuthMethodPayload & AnalyticsLocalePayload;

  auth_sign_up: AnalyticsAuthMethodPayload & AnalyticsLocalePayload;

  auth_sign_out: AnalyticsLocalePayload;
};

export type AnalyticsEventPayload<TName extends AnalyticsEventName> =
  AnalyticsEventPayloadMap[TName];

export type AnalyticsProvider = {
  track: <TName extends AnalyticsEventName>(
    name: TName,
    payload: AnalyticsEventPayload<TName>
  ) => void;
};
