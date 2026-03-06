import { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../config/env";
import { stripe } from "../config/stripe";
import { prisma } from "../config/database";
import { OrderStatus } from "@prisma/client";
import * as checkoutService from "../services/checkout.service";
import { sendAdminNotificationEmail } from "../services/email.service";

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe || !env.stripeWebhookSecret) {
    console.error("[WEBHOOK] Stripe ou STRIPE_WEBHOOK_SECRET não configurado");
    res.status(503).json({ message: "Webhook não configurado" });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = env.stripeWebhookSecret;

  if (!sig || typeof sig !== "string") {
    console.error("[WEBHOOK] Header stripe-signature ausente");
    res.status(400).send("Missing stripe-signature");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("[WEBHOOK] Falha na verificação de assinatura:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log("[WEBHOOK] Evento recebido:", event.type);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;

        console.log(`[WEBHOOK] payment_intent.succeeded recebido. Order ID: ${orderId}`);

        if (!orderId) {
          // Fallback: buscar por stripePaymentIntentId (para compatibilidade)
          console.warn(
            "[WEBHOOK] orderId não encontrado nos metadata, tentando stripePaymentIntentId"
          );
          await checkoutService.handlePaymentSucceeded(paymentIntent.id);
          if (env.adminEmail && env.smtpHost && env.smtpFrom) {
            try {
              const order = await prisma.order.findFirst({
                where: { stripePaymentIntentId: paymentIntent.id },
                include: { items: { include: { product: true } }, user: true },
              });
              if (order) {
                await sendAdminNotificationEmail(order);
                console.log("[WEBHOOK] Email de notificação enviado ao admin");
              }
            } catch (emailErr) {
              console.error("[WEBHOOK] Falha ao enviar email ao admin:", emailErr);
            }
          }
          break;
        }

        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: { include: { product: true } }, user: true },
        });
        if (!existingOrder) {
          console.error("[WEBHOOK] Pedido não encontrado:", orderId);
          break;
        }
        if (existingOrder.status === OrderStatus.PAID) {
          console.log("[WEBHOOK] Pedido já pago, ignorando:", orderId);
          break;
        }

        const order = await prisma.$transaction(async (tx) => {
          const updated = await tx.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.PAID,
              paymentStatus: "paid",
              paidAt: new Date(),
            },
            include: {
              items: { include: { product: true } },
              user: true,
            },
          });

          for (const item of updated.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }

          const existingPayment = await tx.payment.findUnique({
            where: { orderId: updated.id },
          });
          if (!existingPayment) {
            await tx.payment.create({
              data: {
                orderId: updated.id,
                provider: "STRIPE",
                providerPaymentId: paymentIntent.id,
                status: "succeeded",
                amount: updated.totalAmount,
                currency: "BRL",
                rawPayload: { paymentIntentId: paymentIntent.id } as any,
              },
            });
          }

          return updated;
        });

        console.log(`[WEBHOOK] Pedido ${orderId} atualizado para PAID`);
        for (const item of order.items) {
          console.log(
            `[WEBHOOK] Estoque decrementado: produto ${item.productId}, qty: -${item.quantity}`
          );
        }
        console.log("[WEBHOOK] Pagamento registrado para pedido:", order.id);

        await sendAdminNotificationEmail(order);
        console.log("[WEBHOOK] Email de notificação enviado ao admin");
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;

        console.log(`[WEBHOOK] payment_intent.payment_failed. Order: ${orderId}`);

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.CANCELLED,
              paymentStatus: "failed",
            },
          });
          console.log("[WEBHOOK] Pedido", orderId, "marcado como CANCELLED/FAILED");
        } else {
          const order = await prisma.order.findFirst({
            where: { stripePaymentIntentId: paymentIntent.id },
          });
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.CANCELLED,
                paymentStatus: "failed",
              },
            });
            console.log("[WEBHOOK] Pedido", order.id, "marcado como CANCELLED/FAILED");
          }
        }
        break;
      }

      default:
        console.log("[WEBHOOK] Evento não tratado:", event.type);
    }
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar evento:", error);
  }

  res.status(200).json({ received: true });
}
