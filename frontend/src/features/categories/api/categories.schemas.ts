import z from 'zod';
import { catalogItemSchema } from '@/features/catalog/api/products.shemas';

export const categoryKindSchema = z.enum(['catalog', 'info']);

export const categoryListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  kind: categoryKindSchema,
  name: z.string(),
});

export const categoryListSchema = z.array(categoryListItemSchema);

export const categoryContentBlockSchema = z.object({
  id: z.string(),
  blockType: z.enum(['heading', 'text', 'image']),
  title: z.string(),
  body: z.string(),
  imageUrl: z.string().nullable(),
  order: z.number(),
});

export const categoryDetailSchema = categoryListItemSchema.extend({
  blocks: z.array(categoryContentBlockSchema),
  items: z.array(catalogItemSchema),
});

export type CategoryKind = z.infer<typeof categoryKindSchema>;
export type CategoryListItem = z.infer<typeof categoryListItemSchema>;
export type CategoryList = z.infer<typeof categoryListSchema>;
export type CategoryContentBlock = z.infer<typeof categoryContentBlockSchema>;
export type CategoryDetail = z.infer<typeof categoryDetailSchema>;
