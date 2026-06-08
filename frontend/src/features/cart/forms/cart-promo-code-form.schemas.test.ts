import { describe, expect, test } from 'vitest';

import { getValidationMessages } from '@/constants/message.constants';
import { testT } from '@/test/translation';
import { validateWithZod } from '@/utils/forms/validate-with-zod';

import { createCartPromoCodeSchema } from './cart-promo-code-form.schemas';

const validationMessages = getValidationMessages(testT);
const cartPromoCodeSchema = createCartPromoCodeSchema(testT);

describe('cartPromoCodeSchema', () => {
  test('accepts a non-empty promo code', () => {
    expect(
      cartPromoCodeSchema.safeParse({
        promoCode: 'SPRING10',
      }).success
    ).toBe(true);
  });

  test('trims promo code before returning values', () => {
    const result = cartPromoCodeSchema.parse({
      promoCode: '  SPRING10  ',
    });

    expect(result.promoCode).toBe('SPRING10');
  });

  test('requires promo code', () => {
    expect(
      validateWithZod(cartPromoCodeSchema, {
        promoCode: '   ',
      })
    ).toEqual({
      promoCode: validationMessages.requiredField(),
    });
  });
});
