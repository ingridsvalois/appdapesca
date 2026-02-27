import { Router } from "express";
import { auth, requireAuth } from "../middlewares/auth.middleware";
import * as orderController from "../controllers/order.controller";

export const router = Router();

router.use(auth);
router.use(requireAuth);

router.get("/", orderController.listMyOrders);
router.get("/:id", orderController.getOrder);
