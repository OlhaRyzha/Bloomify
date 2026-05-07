import z from 'zod';
import { validationMessages } from '@/constants/message.constants';
import { EMAIL_REGEX } from '@/utils/patterns/regex';

export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, validationMessages.requiredField())
    .regex(EMAIL_REGEX, validationMessages.invalidEmail),
});

export type NewsletterSubscribeValues = z.infer<
  typeof newsletterSubscribeSchema
>;
