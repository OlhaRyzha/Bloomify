import { describe, expect, test } from 'vitest';

import { validationMessages } from '@/constants/message.constants';
import { validateWithZod } from '@/utils/forms/validate-with-zod';

import { cartPromoCodeSchema } from './cart-promo-code-form.schemas';

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
