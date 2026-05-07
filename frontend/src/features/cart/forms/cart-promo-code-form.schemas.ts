import z from 'zod';
import { validationMessages } from '@/constants/message.constants';

export const cartPromoCodeSchema = z.object({
  promoCode: z
    .string()
    .trim()
    .min(1, validationMessages.requiredField()),
});

export type CartPromoCodeValues = z.infer<typeof cartPromoCodeSchema>;
