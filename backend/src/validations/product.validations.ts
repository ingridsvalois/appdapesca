import { z } from "zod";

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  rating: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  search: z.string().optional(),
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("12").transform(Number),
  sort: z.enum(["price_asc", "price_desc", "name", "newest", "rating"]).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  categoryId: z.string().min(1),
  mainImageUrl: z.string().url(),
  images: z.array(z.string().url()).default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
export type ReviewBody = z.infer<typeof reviewSchema>;
