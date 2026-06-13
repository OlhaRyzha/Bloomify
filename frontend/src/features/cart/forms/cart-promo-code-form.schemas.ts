import z from 'zod';

import { type TranslationFn } from '@/constants/message.constants';
import { requiredStringSchema } from '@/utils/forms/zod-string';

export const createCartPromoCodeSchema = (t: TranslationFn) => {
  return z.object({
    promoCode: requiredStringSchema(t),
  });
};

export type CartPromoCodeValues = z.infer<
  ReturnType<typeof createCartPromoCodeSchema>
>;
