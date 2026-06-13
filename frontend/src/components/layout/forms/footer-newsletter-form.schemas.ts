import z from 'zod';

import { type TranslationFn } from '@/constants/message.constants';
import { emailSchema } from '@/utils/forms/zod-string';

export const createNewsletterSubscribeSchema = (t: TranslationFn) =>
  z.object({
    email: emailSchema(t),
  });

export type NewsletterSubscribeValues = z.infer<
  ReturnType<typeof createNewsletterSubscribeSchema>
>;
