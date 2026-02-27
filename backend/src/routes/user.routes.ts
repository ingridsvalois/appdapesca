import { Router } from "express";
import { auth, requireAuth } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { updateMeSchema, addressSchema } from "../validations/user.validations";
import * as userController from "../controllers/user.controller";

export const router = Router();

router.use(auth);
router.use(requireAuth);

router.get("/me", userController.getMe);
router.put("/me", validateBody(updateMeSchema), userController.updateMe);

router.get("/me/addresses", userController.getAddresses);
router.post("/me/addresses", validateBody(addressSchema), userController.createAddress);
router.put("/me/addresses/:id", validateBody(addressSchema), userController.updateAddress);
router.delete("/me/addresses/:id", userController.deleteAddress);
