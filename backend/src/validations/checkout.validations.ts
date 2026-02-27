import { z } from "zod";

export const shippingAddressSchema = z.object({
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  district: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().min(8),
});

export const createPaymentIntentSchema = z.object({
  addressId: z.string().optional(),
  shippingAddress: shippingAddressSchema.optional(),
  paymentMethod: z.enum(["card", "pix"]).default("card"),
}).refine(
  (data) => data.addressId || data.shippingAddress,
  { message: "Informe addressId ou shippingAddress" }
);

export type CreatePaymentIntentBody = z.infer<typeof createPaymentIntentSchema>;
