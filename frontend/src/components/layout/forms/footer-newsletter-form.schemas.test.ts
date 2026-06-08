import { describe, expect, test } from 'vitest';

import { getValidationMessages } from '@/constants/message.constants';
import { validateWithZod } from '@/utils/forms/validate-with-zod';

import { createNewsletterSubscribeSchema } from './footer-newsletter-form.schemas';
import { testT } from '@/test/translation';

const validationMessages = getValidationMessages(testT);
const newsletterSubscribeSchema = createNewsletterSubscribeSchema(testT);

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
