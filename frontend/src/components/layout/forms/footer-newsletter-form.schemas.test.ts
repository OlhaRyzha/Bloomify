import { describe, expect, test } from 'vitest';

import { validationMessages } from '@/constants/message.constants';
import { validateWithZod } from '@/utils/forms/validate-with-zod';

import { newsletterSubscribeSchema } from './footer-newsletter-form.schemas';

describe('newsletterSubscribeSchema', () => {
  test('accepts a valid email', () => {
    expect(
      newsletterSubscribeSchema.safeParse({
        email: 'tom@example.com',
      }).success
    ).toBe(true);
  });

  test('trims email before validation', () => {
    const result = newsletterSubscribeSchema.parse({
      email: '  tom@example.com  ',
    });

    expect(result.email).toBe('tom@example.com');
  });

  test('rejects invalid email', () => {
    expect(
      validateWithZod(newsletterSubscribeSchema, {
        email: 'invalid-email',
      })
    ).toEqual({
      email: validationMessages.invalidEmail,
    });
  });
});
