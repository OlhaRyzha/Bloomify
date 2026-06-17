import { describe, expect, test } from 'vitest';

import { getValidationMessages } from '@/constants/message.constants';
import { testT } from '@/test/translation';

import {
  CHECKOUT_PAYMENT_METHODS,
  createCheckoutSchema,
} from './checkout-form.schemas';

const validationMessages = getValidationMessages(testT);
const schema = createCheckoutSchema(testT);

const validCheckoutValues = {
  customerName: 'Olena Kolomiec',
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

  test('returns validation messages for empty required fields', () => {
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

    if (result.success) {
      throw new Error('Expected checkout validation to fail');
    }

    const fieldErrors = result.error.flatten().fieldErrors;

    expect(fieldErrors.customerName).toContain(
      testT('checkout_validation_name_required')
    );

    expect(fieldErrors.email).toContain(
      testT('checkout_validation_email_required')
    );

    expect(fieldErrors.phone).toContain(
      testT('checkout_validation_phone_required')
    );

    expect(fieldErrors.city).toContain(
      testT('checkout_validation_city_required')
    );

    expect(fieldErrors.address).toContain(
      testT('checkout_validation_address_required')
    );
  });

  test('rejects invalid email and unsupported payment method', () => {
    const result = schema.safeParse({
      ...validCheckoutValues,
      email: 'not-an-email',
      paymentMethod: 'crypto',
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error('Expected checkout validation to fail');
    }

    const fieldErrors = result.error.flatten().fieldErrors;

    expect(fieldErrors.email).toEqual([
      testT('checkout_validation_email_invalid'),
    ]);

    expect(fieldErrors.paymentMethod).toBeDefined();
  });

  test.each(['abcdefg', 'phone123', '+++++++', '123', '+38 (---)'])(
    'rejects invalid phone value: %s',
    (phone) => {
      const result = schema.safeParse({
        ...validCheckoutValues,
        phone,
      });

      expect(result.success).toBe(false);

      if (result.success) {
        throw new Error('Expected checkout validation to fail');
      }

      expect(result.error.flatten().fieldErrors.phone).toContain(
        validationMessages.invalidPhone
      );
    }
  );

  test.each([
    '+380671234567',
    '0671234567',
    '+38 (067) 123-45-67',
    '067 123 45 67',
  ])('accepts valid phone value: %s', (phone) => {
    expect(
      schema.safeParse({
        ...validCheckoutValues,
        phone,
      }).success
    ).toBe(true);
  });
});
