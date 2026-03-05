import { Router } from "express";
import * as webhookController from "../controllers/webhook.controller";

export const router = Router();

// POST /api/webhooks/stripe (rota na base do mount)
router.post("/", webhookController.stripeWebhook);
