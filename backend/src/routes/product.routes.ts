import { Router } from "express";
import { auth, requireAuth } from "../middlewares/auth.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { productListQuerySchema, reviewSchema } from "../validations/product.validations";
import * as productController from "../controllers/product.controller";

export const router = Router();

router.get("/", validateQuery(productListQuerySchema), productController.list);
router.get("/:slug", productController.getBySlug);
router.post(
  "/:id/reviews",
  auth,
  requireAuth,
  validateBody(reviewSchema),
  productController.createReview
);
