import z from 'zod';

import {
  getValidationMessages,
  type TranslationFn,
} from '@/constants/message.constants';
import { EMAIL_REGEX, PASSWORD_REGEX } from '@/utils/patterns/regex';

export const createLoginSchema = (t: TranslationFn) => {
  const validationMessages = getValidationMessages(t);

  return z.object({
    email: z
      .string()
      .trim()
      .min(1, validationMessages.requiredField())
      .regex(EMAIL_REGEX, validationMessages.invalidEmail),
    password: z.string().trim().min(1, validationMessages.requiredField()),
  });
};

export const createRegisterSchema = (t: TranslationFn) => {
  const validationMessages = getValidationMessages(t);

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, validationMessages.requiredField())
        .min(2, validationMessages.nameMin(2)),
      email: z
        .string()
        .trim()
        .min(1, validationMessages.requiredField())
        .regex(EMAIL_REGEX, validationMessages.invalidEmail),
      password: z
        .string()
        .trim()
        .min(1, validationMessages.requiredField())
        .min(8, validationMessages.passwordMin(8))
        .regex(PASSWORD_REGEX, validationMessages.passwordRules),
      confirmPassword: z
        .string()
        .trim()
        .min(1, validationMessages.requiredField()),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: validationMessages.passwordMismatch,
      path: ['confirmPassword'],
    });
};

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;
