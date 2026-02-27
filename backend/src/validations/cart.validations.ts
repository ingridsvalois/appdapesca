import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

export type AddCartItemBody = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemBody = z.infer<typeof updateCartItemSchema>;
