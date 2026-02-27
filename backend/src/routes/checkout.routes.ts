import { Router } from "express";
import { auth, requireAuth } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { createPaymentIntentSchema } from "../validations/checkout.validations";
import * as checkoutController from "../controllers/checkout.controller";

export const router = Router();

router.use(auth);
router.use(requireAuth);
router.post(
  "/create-payment-intent",
  validateBody(createPaymentIntentSchema),
  checkoutController.createPaymentIntent
);
