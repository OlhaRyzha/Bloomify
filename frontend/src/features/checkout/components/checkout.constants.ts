import {
  Apple,
  CreditCard,
  Smartphone,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

import {
  CHECKOUT_PAYMENT_METHODS,
  type CheckoutPaymentMethod,
} from '../forms/checkout-form.schemas';

export type PaymentOption = {
  descriptionKey: string;
  icon: LucideIcon;
  id: CheckoutPaymentMethod;
  titleKey: string;
};

export const paymentOptions: PaymentOption[] = [
  {
    id: CHECKOUT_PAYMENT_METHODS.APPLE_PAY,
    icon: Apple,
    titleKey: 'checkout_payment_apple_pay_title',
    descriptionKey: 'checkout_payment_apple_pay_description',
  },
  {
    id: CHECKOUT_PAYMENT_METHODS.GOOGLE_PAY,
    icon: Smartphone,
    titleKey: 'checkout_payment_google_pay_title',
    descriptionKey: 'checkout_payment_google_pay_description',
  },
  {
    id: CHECKOUT_PAYMENT_METHODS.CARD,
    icon: CreditCard,
    titleKey: 'checkout_payment_card_title',
    descriptionKey: 'checkout_payment_card_description',
  },
  {
    id: CHECKOUT_PAYMENT_METHODS.CASH_ON_DELIVERY,
    icon: WalletCards,
    titleKey: 'checkout_payment_cash_title',
    descriptionKey: 'checkout_payment_cash_description',
  },
];

export const PENDING_LIQPAY_ORDER_KEY = 'bloomify.pendingLiqPayOrderId';
export const PENDING_LIQPAY_ORDER_TOKEN_KEY =
  'bloomify.pendingLiqPayOrderToken';

export const PAYMENT_STATUS_SYNC_RETRY_LIMIT = 5;
export const PAYMENT_STATUS_SYNC_RETRY_DELAY_MS = 1500;
