import { z } from 'zod';

import { isString } from '../guards/is-string';
import {
  getValidationMessages,
  TranslationFn,
} from '@/constants/message.constants';
import { PASSWORD_REGEX } from '../patterns/regex';

export const trimmedString = () => z.string().trim();

export const optionalTrimmedString = () =>
  z.preprocess(
    (value) => (isString(value) && value.trim() === '' ? undefined : value),
    trimmedString().optional()
  );

export const requiredStringSchema = (t: TranslationFn) => {
  const validationMessages = getValidationMessages(t);

  return trimmedString().min(1, validationMessages.requiredField());
};

export const emailSchema = (t: TranslationFn) => {
  const validationMessages = getValidationMessages(t);

  return requiredStringSchema(t).email(validationMessages.invalidEmail);
};

export const passwordSchema = (t: TranslationFn) => {
  const validationMessages = getValidationMessages(t);

  return requiredStringSchema(t)
    .min(8, validationMessages.passwordMin(8))
    .regex(PASSWORD_REGEX, validationMessages.passwordRules);
};

export const confirmPasswordSchema = (t: TranslationFn) => {
  return requiredStringSchema(t);
};

export const nameSchema = (t: TranslationFn) => {
  const validationMessages = getValidationMessages(t);

  return requiredStringSchema(t).min(2, validationMessages.nameMin(2));
};
