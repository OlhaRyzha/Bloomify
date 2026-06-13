import z from 'zod';

import {
  getValidationMessages,
  type TranslationFn,
} from '@/constants/message.constants';
import {
  confirmPasswordSchema,
  emailSchema,
  nameSchema,
  passwordSchema,
  requiredStringSchema,
} from '@/utils/forms/zod-string';

export const createLoginSchema = (t: TranslationFn) => {
  return z.object({
    email: emailSchema(t),
    password: requiredStringSchema(t),
  });
};

export const createRegisterSchema = (t: TranslationFn) => {
  return z
    .object({
      name: nameSchema(t),
      email: emailSchema(t),
      password: passwordSchema(t),
      confirmPassword: confirmPasswordSchema(t),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: getValidationMessages(t).passwordMismatch,
    });
};

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;
