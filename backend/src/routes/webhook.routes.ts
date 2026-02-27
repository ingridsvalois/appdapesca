import { Router } from "express";
import * as webhookController from "../controllers/webhook.controller";

export const router = Router();

router.post("/stripe", webhookController.stripeWebhook);
