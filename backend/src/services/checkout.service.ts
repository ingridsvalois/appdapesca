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

  // Definir métodos de pagamento baseado na seleção do usuário
  const isPix = paymentMethod === "pix";
  const paymentMethodTypes = isPix ? ["pix"] : ["card"];

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: "brl",
    metadata: {
      orderId: order.id,
      paymentMethod: paymentMethod, // credit, debit ou pix
    },
    payment_method_types: paymentMethodTypes,
    ...(isPix
      ? {
          payment_method_options: {
            pix: {
              expires_after_seconds: 1800, // PIX expira em 30 min
            },
          },
        }
      : {
          payment_method_options: {
            card: {
              request_three_d_secure: "automatic",
            },
          },
        }),
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
  if (!order) {
    console.warn("[webhook] Pedido não encontrado para paymentIntent:", paymentIntentId);
    return;
  }
  if (order.status === OrderStatus.PAID) {
    console.log("[webhook] Pedido já pago, ignorando:", order.id);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Atualizar status do pedido
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: "paid",
        paidAt: new Date(),
      },
    });
    console.log("[webhook] Pedido marcado como PAID:", order.id);

    // 2. Decrementar estoque de cada produto
    for (const item of order.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      });
      if (!product) {
        console.error("[webhook] Produto não encontrado para baixa de estoque:", item.productId);
        continue;
      }
      if (product.stock < item.quantity) {
        // Loga erro mas NÃO reverte o pagamento (já cobrado pelo Stripe)
        console.error(
          `[webhook] Estoque insuficiente para produto "${product.name}" (id: ${item.productId}): ` +
            `disponível=${product.stock}, solicitado=${item.quantity}. Baixa realizada mesmo assim.`
        );
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      console.log(
        `[webhook] Estoque decrementado: produto ${item.productId}, quantidade -${item.quantity}`
      );
    }

    // 3. Registrar pagamento
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
    console.log("[webhook] Pagamento registrado para pedido:", order.id);
  });
}