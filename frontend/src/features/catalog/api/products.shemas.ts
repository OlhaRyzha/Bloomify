import z from 'zod';
import { getValidationMessages } from '@/constants/message.constants';
import { ABSOLUTE_URL_REGEX, RELATIVE_URL_REGEX } from '@/utils/patterns/regex';
import { testT } from '@/test/translation';

const validationMessages = getValidationMessages(testT);

export const catalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.string(),
  discountedPrice: z.string().optional().nullable(),
  isSale: z.boolean().optional(),
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

export const catalogListSchema = z.object({
  items: catalogSchema,
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  nextPage: z.number().nullable(),
});

export const catalogFiltersSchema = z.object({
  tags: z.array(z.string()),
});

export type ProductItem = z.infer<typeof catalogItemSchema>;
export type Products = z.infer<typeof catalogSchema>;
export type ProductList = z.infer<typeof catalogListSchema>;
export type ProductFilters = z.infer<typeof catalogFiltersSchema>;
