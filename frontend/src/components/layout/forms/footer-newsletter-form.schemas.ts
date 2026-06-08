import z from 'zod';

import {
  getValidationMessages,
  type TranslationFn,
} from '@/constants/message.constants';
import { EMAIL_REGEX } from '@/utils/patterns/regex';

export const createNewsletterSubscribeSchema = (t: TranslationFn) => {
  const validationMessages = getValidationMessages(t);

  return z.object({
    email: z
      .string()
      .trim()
      .min(1, validationMessages.requiredField())
      .regex(EMAIL_REGEX, validationMessages.invalidEmail),
  });
};

export type NewsletterSubscribeValues = z.infer<
  ReturnType<typeof createNewsletterSubscribeSchema>
>;
