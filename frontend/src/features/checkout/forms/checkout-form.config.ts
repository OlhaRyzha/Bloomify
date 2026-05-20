import type { CheckoutFormValues } from './checkout-form.schemas';
import { CHECKOUT_PAYMENT_METHODS } from './checkout-form.schemas';
import { checkoutDeliveryDraftInitialValues } from '../store/checkout-draft.store';

export const checkoutInitialValues: CheckoutFormValues = {
  ...checkoutDeliveryDraftInitialValues,
  paymentMethod: CHECKOUT_PAYMENT_METHODS.APPLE_PAY,
};
