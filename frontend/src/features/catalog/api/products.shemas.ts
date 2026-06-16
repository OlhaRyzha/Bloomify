import z from 'zod';
import type { components } from '@/types/api.generated';
import { getValidationMessages } from '@/constants/message.constants';
import { ABSOLUTE_URL_REGEX, RELATIVE_URL_REGEX } from '@/utils/patterns/regex';
import { testT } from '@/test/translation';

const validationMessages = getValidationMessages(testT);

type ApiProduct = components['schemas']['Product'];

export const catalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  discountedPrice: z.string().nullable(),
  isSale: z.boolean(),
  imageUrl: z
    .string()
    .nullable()
    .refine(
      (value) =>
        !value ||
        ABSOLUTE_URL_REGEX.test(value) ||
        RELATIVE_URL_REGEX.test(value),
      validationMessages.invalidImageUrl
    ),
  tag: z.string(),
}) satisfies z.ZodType<ApiProduct>;

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
