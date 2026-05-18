import type { CheckoutFormValues } from './checkout-form.schemas';
import { CHECKOUT_PAYMENT_METHODS } from './checkout-form.schemas';

export const checkoutInitialValues: CheckoutFormValues = {
  customerName: '',
  email: '',
  phone: '',
  city: 'Kyiv',
  address: '',
  deliveryNote: '',
  paymentMethod: CHECKOUT_PAYMENT_METHODS.APPLE_PAY,
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
};
