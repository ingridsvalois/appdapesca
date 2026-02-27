import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { addCartItemSchema, updateCartItemSchema } from "../validations/cart.validations";
import * as cartController from "../controllers/cart.controller";

export const router = Router();

router.use(auth);

router.get("/", cartController.getCart);
router.post("/items", validateBody(addCartItemSchema), cartController.addItem);
router.put("/items/:itemId", validateBody(updateCartItemSchema), cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);
