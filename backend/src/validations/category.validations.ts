import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(50),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional(),
});

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
