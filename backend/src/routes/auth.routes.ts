import { Router } from "express";
import rateLimit from "express-rate-limit";
import { auth } from "../middlewares/auth.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { registerSchema, loginSchema } from "../validations/auth.validations";
import * as authController from "../controllers/auth.controller";

export const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
});

router.use(authLimiter);

router.post(
  "/register",
  validateBody(registerSchema),
  authController.register
);

router.post(
  "/login",
  validateBody(loginSchema),
  authController.login
);

router.post("/refresh", authController.refresh);

router.post("/logout", auth, authController.logout);
