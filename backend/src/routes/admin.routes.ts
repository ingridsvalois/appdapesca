import { Router } from "express";
import { auth, requireAuth, isAdmin } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/product.validations";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validations";
import * as adminController from "../controllers/admin.controller";

export const router = Router();

router.use(auth);
router.use(requireAuth);
router.use(isAdmin);

router.get("/categories", adminController.listCategories);
router.post("/categories", validateBody(createCategorySchema), adminController.createCategory);
router.put("/categories/:id", validateBody(updateCategorySchema), adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

router.get("/products", adminController.listProducts);
router.get("/products/:id", adminController.getProduct);
router.post("/products", validateBody(createProductSchema), adminController.createProduct);
router.put("/products/:id", validateBody(updateProductSchema), adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);

router.get("/orders", adminController.listOrders);
router.get("/orders/:id", adminController.getOrder);
router.patch("/orders/:id/status", adminController.updateOrderStatus);
