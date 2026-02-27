import { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../config/env";
import { stripe } from "../config/stripe";
import * as checkoutService from "../services/checkout.service";

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe || !env.stripeWebhookSecret) {
    res.status(503).json({ message: "Webhook não configurado" });
    return;
  }
  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    res.status(400).send("Missing stripe-signature");
    return;
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.stripeWebhookSecret
    );
  } catch (e: any) {
    res.status(400).send(`Webhook signature verification failed: ${e.message}`);
    return;
  }
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await checkoutService.handlePaymentSucceeded(paymentIntent.id);
  }
  res.sendStatus(200);
}
