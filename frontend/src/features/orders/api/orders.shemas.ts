import { z } from 'zod';

export const orderItemSchema = z.object({
  id: z.number(),
  productId: z.number(),
  name: z.string(),
  imageUrl: z.string(),
  quantity: z.number(),
  unitPrice: z.coerce.number(),
  total: z.coerce.number(),
});

export const orderSchema = z.object({
  id: z.number(),
  status: z.string(),
  paymentStatus: z.string(),
  paymentProvider: z.string(),
  paymentMethod: z.string(),
  createdAt: z.string(),
  subtotal: z.coerce.number().optional(),
  deliveryCost: z.coerce.number().optional(),
  discount: z.coerce.number().optional(),
  promoCode: z.string().nullable().optional(),
  total: z.coerce.number(),
  items: z.array(orderItemSchema),
});

export const ordersPaginatedSchema = z.object({
  items: z.array(orderSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  nextPage: z.number().nullable(),
});

export type Order = z.infer<typeof orderSchema>;
export type Orders = Order[];
export type OrdersPaginatedResponse = z.infer<typeof ordersPaginatedSchema>;
