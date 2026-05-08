import { describe, expect, test } from 'vitest';

import { validationMessages } from '@/constants/message.constants';
import { validateWithZod } from '@/utils/forms/validate-with-zod';

import { loginSchema, registerSchema } from './auth.schemas';

describe('loginSchema', () => {
  test('accepts valid login values', () => {
    expect(
      loginSchema.safeParse({
        email: 'olha@example.com',
        password: 'password',
      }).success
    ).toBe(true);
  });

  test('requires valid email and password', () => {
    expect(
      validateWithZod(loginSchema, {
        email: 'invalid-email',
        password: '',
      })
    ).toEqual({
      email: validationMessages.invalidEmail,
      password: validationMessages.requiredField(),
    });
  });
});

describe('registerSchema', () => {
  test('accepts valid register values', () => {
    expect(
      registerSchema.safeParse({
        name: 'Olha',
        email: 'olha@example.com',
        password: 'flower123',
        confirmPassword: 'flower123',
      }).success
    ).toBe(true);
  });

  test('validates name, email and password rules', () => {
    expect(
      validateWithZod(registerSchema, {
        name: 'O',
        email: 'invalid-email',
        password: 'password',
        confirmPassword: 'password',
      })
    ).toEqual({
      name: validationMessages.nameMin(2),
      email: validationMessages.invalidEmail,
      password: validationMessages.passwordRules,
    });
  });

  test('validates password confirmation', () => {
    expect(
      validateWithZod(registerSchema, {
        name: 'Olha',
        email: 'olha@example.com',
        password: 'flower123',
        confirmPassword: 'flower456',
      })
    ).toEqual({
      confirmPassword: validationMessages.passwordMismatch,
    });
  });
});
