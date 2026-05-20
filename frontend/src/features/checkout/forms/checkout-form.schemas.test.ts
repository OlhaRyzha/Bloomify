import { describe, expect, test } from 'vitest';

import {
  CHECKOUT_PAYMENT_METHODS,
  createCheckoutSchema,
} from './checkout-form.schemas';

const messages = {
  address: 'Address is required',
  city: 'City is required',
  email: 'Email is required',
  invalidEmail: 'Email is invalid',
  minName: 'Name is too short',
  name: 'Name is required',
  phone: 'Phone is required',
};

const schema = createCheckoutSchema(messages);

const validCheckoutValues = {
  customerName: 'Olha Ryzha',
  email: 'olha@example.com',
  phone: '+380671234567',
  city: 'Kyiv',
  address: 'Khreshchatyk 1',
  deliveryNote: '',
  paymentMethod: CHECKOUT_PAYMENT_METHODS.APPLE_PAY,
};

describe('checkout schema', () => {
  test('accepts valid checkout values and normalizes empty delivery note', () => {
    expect(schema.parse(validCheckoutValues)).toEqual({
      ...validCheckoutValues,
      deliveryNote: undefined,
    });
  });

  test.each(Object.values(CHECKOUT_PAYMENT_METHODS))(
    'accepts %s payment method',
    (paymentMethod) => {
      expect(
        schema.safeParse({
          ...validCheckoutValues,
          paymentMethod,
        }).success
      ).toBe(true);
    }
  );

  test('returns delivery validation messages for empty required fields', () => {
    const result = schema.safeParse({
      customerName: '',
      email: '',
      phone: '',
      city: '',
      address: '',
      deliveryNote: '',
      paymentMethod: CHECKOUT_PAYMENT_METHODS.CARD,
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected checkout validation to fail');

    const fieldErrors = result.error.flatten().fieldErrors;

    expect(fieldErrors.address).toContain(messages.address);
    expect(fieldErrors.city).toContain(messages.city);
    expect(fieldErrors.customerName).toContain(messages.name);
    expect(fieldErrors.email).toContain(messages.email);
    expect(fieldErrors.phone).toContain(messages.phone);
  });

  test('rejects invalid email and unsupported payment method', () => {
    const result = schema.safeParse({
      ...validCheckoutValues,
      email: 'not-an-email',
      paymentMethod: 'crypto',
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected checkout validation to fail');

    const fieldErrors = result.error.flatten().fieldErrors;

    expect(fieldErrors.email).toEqual([messages.invalidEmail]);
    expect(fieldErrors.paymentMethod).toBeDefined();
  });
});
