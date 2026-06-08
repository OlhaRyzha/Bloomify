import z from 'zod';

import {
  getValidationMessages,
  type TranslationFn,
} from '@/constants/message.constants';

export const createCartPromoCodeSchema = (t: TranslationFn) => {
  const validationMessages = getValidationMessages(t);

  return z.object({
    promoCode: z.string().trim().min(1, validationMessages.requiredField()),
  });
};

export type CartPromoCodeValues = z.infer<
  ReturnType<typeof createCartPromoCodeSchema>
>;
