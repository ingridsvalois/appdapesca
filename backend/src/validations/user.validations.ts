import { z } from "zod";

export const updateMeSchema = z.object({
  name: z.string().min(2).max(120).optional(),
});

export const addressSchema = z.object({
  street: z.string().min(1, "Rua obrigatória"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().max(200).optional(),
  district: z.string().min(1, "Bairro obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z.string().length(2, "UF com 2 caracteres"),
  zipCode: z.string().min(8, "CEP inválido").max(9),
  isDefault: z.boolean().optional(),
});

export type UpdateMeBody = z.infer<typeof updateMeSchema>;
export type AddressBody = z.infer<typeof addressSchema>;
