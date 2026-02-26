import z from 'zod';
import { validationMessages } from '@/constants/message.constants';
import {
  ABSOLUTE_URL_REGEX,
  RELATIVE_URL_REGEX,
} from '@/utils/patterns/regex';

export const catalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  imageUrl: z
    .string()
    .optional()
    .nullable()
    .refine(
      (value) =>
        !value ||
        ABSOLUTE_URL_REGEX.test(value) ||
        RELATIVE_URL_REGEX.test(value),
      validationMessages.invalidImageUrl
    ),
  tag: z.string().optional(),
});

export const catalogSchema = z.array(catalogItemSchema);

export type ProductItem = z.infer<typeof catalogItemSchema>;
export type Products = z.infer<typeof catalogSchema>;
