import Stripe from "stripe";
import { env } from "./env";

export const stripe =
  env.stripeSecretKey.length > 0
    ? new Stripe(env.stripeSecretKey, { apiVersion: "2024-06-20" })
    : (null as unknown as Stripe);
