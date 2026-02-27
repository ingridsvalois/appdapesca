import { prisma } from "../config/database";
import { stripe } from "../config/stripe";
import { env } from "../config/env";
import { OrderStatus } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

export interface ShippingAddressSnapshot {
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
}

export async function createOrderFromCart(
  userId: string,
  shippingAddress: ShippingAddressSnapshot,
  paymentMethod: string
): Promise<{ orderId: string; totalAmount: number; clientSecret: string }> {
  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
  if (!cart || cart.items.length === 0) {
    throw new Error("Carrinho vazio");
  }
  let totalAmount = 0;
  const orderItems: { productId: string; quantity: number; unitPrice: Decimal }[] = [];
  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      throw new Error(`Produto "${item.product.name}" sem estoque suficiente (${item.product.stock})`);
    }
    const price = Number(item.unitPrice);
    totalAmount += price * item.quantity;
    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
  }
  if (totalAmount <= 0) throw new Error("Total inválido");

  const order = await prisma.order.create({
    data: {
      userId,
      status: OrderStatus.PENDING,
      totalAmount,
      paymentMethod,
      paymentStatus: "pending",
      shippingAddressSnapshot: shippingAddress as any,
      items: {
        create: orderItems,
      },
    },
    include: { items: true },
  });

  if (!stripe) {
    throw new Error("Stripe não configurado");
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: "brl",
    metadata: { orderId: order.id },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return {
    orderId: order.id,
    totalAmount,
    clientSecret: paymentIntent.client_secret!,
  };
}

export async function handlePaymentSucceeded(paymentIntentId: string): Promise<void> {
  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { items: true },
  });
  if (!order) return;
  if (order.status === OrderStatus.PAID) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paymentStatus: "paid" },
    });
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "STRIPE",
        providerPaymentId: paymentIntentId,
        status: "succeeded",
        amount: order.totalAmount,
        currency: "BRL",
        rawPayload: { paymentIntentId } as any,
      },
    });
  });
}
