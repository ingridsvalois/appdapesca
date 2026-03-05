import { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../config/env";
import { stripe } from "../config/stripe";
import { prisma } from "../config/database";
import { OrderStatus } from "@prisma/client";
import * as checkoutService from "../services/checkout.service";
import { sendEmail } from "../services/email.service";

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe || !env.stripeWebhookSecret) {
    console.error("[WEBHOOK] Stripe ou STRIPE_WEBHOOK_SECRET não configurado");
    res.status(503).json({ message: "Webhook não configurado" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    console.error("[WEBHOOK] Header stripe-signature ausente");
    res.status(400).send("Missing stripe-signature");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // DEVE ser Buffer raw (express.raw aplicado antes do JSON)
      sig,
      env.stripeWebhookSecret
    );
  } catch (e: any) {
    console.error("[WEBHOOK] Assinatura inválida:", e.message);
    res.status(400).send(`Assinatura inválida: ${e.message}`);
    return;
  }

  console.log("[WEBHOOK] Evento recebido:", event.type);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[WEBHOOK] PaymentIntent succeeded:", paymentIntent.id);

        await checkoutService.handlePaymentSucceeded(paymentIntent.id);

        // Notificação ao admin (opcional, não bloqueia se falhar)
        if (env.adminEmail && env.smtpHost && env.smtpFrom) {
          try {
            const order = await prisma.order.findFirst({
              where: { stripePaymentIntentId: paymentIntent.id },
              include: { items: { include: { product: true } } },
            });
            if (order) {
              const itemsList = order.items
                .map((i) => `- ${i.product.name} x${i.quantity}`)
                .join("\n");
              await sendEmail({
                to: env.adminEmail,
                subject: `[App da Pesca] Novo pedido #${order.id} pago`,
                html: `
                  <p>Novo pedido confirmado e pago:</p>
                  <p><strong>Pedido:</strong> ${order.id}</p>
                  <p><strong>Total:</strong> R$ ${Number(order.totalAmount).toFixed(2)}</p>
                  <p><strong>Itens:</strong></p>
                  <pre>${itemsList}</pre>
                `,
              });
              console.log("[WEBHOOK] Notificação ao admin enviada");
            }
          } catch (emailErr) {
            console.error("[WEBHOOK] Falha ao notificar admin:", emailErr);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[WEBHOOK] PaymentIntent failed:", paymentIntent.id);

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
        break;
      }

      default:
        console.log("[WEBHOOK] Evento não tratado:", event.type);
    }
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar evento:", error);
  }

  // SEMPRE responder 200 ao Stripe (evita retentativas desnecessárias)
  res.status(200).json({ received: true });
}
