import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { validateWithZod } from './validate-with-zod';

const schema = z.object({
  email: z.string().email('Invalid email.'),
  name: z.string().min(2, 'Name is too short.'),
});

describe('validateWithZod', () => {
  test('returns an empty error object for valid values', () => {
    expect(
      validateWithZod(schema, {
        email: 'olha@example.com',
        name: 'Olha',
      })
    ).toEqual({});
  });

  test('maps zod issues to first field-level error message', () => {
    expect(
      validateWithZod(schema, {
        email: 'invalid-email',
        name: '',
      })
    ).toEqual({
      email: 'Invalid email.',
      name: 'Name is too short.',
    });
  });

  test('keeps the first error when one field has several issues', () => {
    const passwordSchema = z.object({
      password: z
        .string()
        .min(8, 'Password is too short.')
        .regex(/\d/, 'Password must contain a digit.'),
    });

    expect(validateWithZod(passwordSchema, { password: '' })).toEqual({
      password: 'Password is too short.',
    });
  });
});
