import { Router } from "express";
import multer from "multer";
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado"));
    }
  },
});

router.use(auth);
router.use(requireAuth);
router.use(isAdmin);

router.get("/categories", adminController.listCategories);
router.post("/categories", validateBody(createCategorySchema), adminController.createCategory);
router.put("/categories/:id", validateBody(updateCategorySchema), adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

router.post("/upload", upload.array("files", 5), adminController.uploadImages);

router.get("/products", adminController.listProducts);
router.get("/products/:id", adminController.getProduct);
router.post("/products", validateBody(createProductSchema), adminController.createProduct);
router.put("/products/:id", validateBody(updateProductSchema), adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);

router.get("/orders", adminController.listOrders);
router.get("/orders/:id", adminController.getOrder);
router.patch("/orders/:id/status", adminController.updateOrderStatus);
