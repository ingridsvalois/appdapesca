import { Request, Response } from "express";
import * as checkoutService from "../services/checkout.service";
import type { CreatePaymentIntentBody } from "../validations/checkout.validations";
import { prisma } from "../config/database";

export async function createPaymentIntent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Faça login para finalizar a compra" });
    return;
  }
  const body = (req as any).validBody as CreatePaymentIntentBody;
  let shippingAddress: checkoutService.ShippingAddressSnapshot;
  if (body.addressId) {
    const addr = await prisma.address.findFirst({
      where: { id: body.addressId, userId: req.user.id },
    });
    if (!addr) {
      res.status(404).json({ message: "Endereço não encontrado" });
      return;
    }
    shippingAddress = {
      street: addr.street,
      number: addr.number,
      complement: addr.complement ?? undefined,
      district: addr.district,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
    };
  } else if (body.shippingAddress) {
    shippingAddress = body.shippingAddress;
  } else {
    res.status(400).json({ message: "Informe addressId ou shippingAddress" });
    return;
  }
  try {
    const result = await checkoutService.createOrderFromCart(
      req.user.id,
      shippingAddress,
      body.paymentMethod
    );
    res.json({
      orderId: result.orderId,
      clientSecret: result.clientSecret,
      totalAmount: result.totalAmount,
    });
  } catch (e: any) {
    res.status(400).json({ message: e.message || "Erro ao criar pagamento" });
  }
}
